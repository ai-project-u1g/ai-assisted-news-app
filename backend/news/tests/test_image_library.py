"""Image candidates retain provenance and are only exposed to an authenticated admin."""

from types import SimpleNamespace
from urllib.parse import urlsplit

from bson import ObjectId
from fastapi.testclient import TestClient

from news.api import create_app, get_authenticated_user
from news.models.news import Image
from news.tests.test_api_firebase_auth import FakeClient, FakeDatabase


def library_client(monkeypatch, role="admin"):
    database = FakeDatabase()
    monkeypatch.setattr(
        "news.api.get_news_settings",
        lambda: SimpleNamespace(
            mongodb_database="ai_assisted_news", firebase_project_id="fixture"
        ),
    )
    monkeypatch.setattr(
        "news.api.get_news_client", lambda _settings: FakeClient(database)
    )
    app = create_app()
    if role:
        actor = {"_id": ObjectId(), "role": role}
        app.dependency_overrides[get_authenticated_user] = lambda: actor
    return TestClient(app), database


def test_admin_gets_usable_images_with_original_source_credit_and_license(monkeypatch):
    client, database = library_client(monkeypatch)
    with client:
        response = client.get("/admin/image-library")
    assert response.status_code == 200
    candidates = response.json()
    assert len(candidates) >= 3
    assert len({candidate["id"] for candidate in candidates}) == len(candidates)
    for candidate in candidates:
        image = Image.model_validate(candidate["image"])
        assert image.type == "photograph"
        assert urlsplit(image.url).hostname == "upload.wikimedia.org"
        assert candidate["sourceUrl"].startswith(
            "https://commons.wikimedia.org/wiki/File:"
        )
        assert candidate["sourceUrl"] in image.credit
        assert "https://" in image.rights
        assert "no documenta" in image.alt
        assert "demo" not in image.alt.lower()
    assert not database["news"].documents
    assert not database["auditLogs"].documents


def test_candidates_can_be_filtered_by_topic_without_random_or_ai_calls(monkeypatch):
    client, _database = library_client(monkeypatch)
    with client:
        all_images = client.get("/admin/image-library").json()
        sports = client.get("/admin/image-library?topic=deportes").json()
        assert sports
        assert all("deportes" in candidate["topics"] for candidate in sports)
        assert len(sports) < len(all_images)
        assert client.get("/admin/image-library?topic=inventado").status_code == 400


def test_reader_cannot_use_admin_image_library(monkeypatch):
    client, _database = library_client(monkeypatch, role="user")
    with client:
        assert client.get("/admin/image-library").status_code == 403


def test_image_library_requires_authentication(monkeypatch):
    client, _database = library_client(monkeypatch, role=None)
    with client:
        assert client.get("/admin/image-library").status_code == 401


def test_selected_image_can_be_saved_with_its_exact_provenance(monkeypatch):
    client, database = library_client(monkeypatch)
    with client:
        candidate = client.get("/admin/image-library").json()[0]
        image = candidate["image"]
        response = client.post(
            "/admin/news",
            json={
                "title": "Una noticia con imagen de contexto",
                "summary": "Resumen conservado",
                "content": "Texto original conservado.",
                "topic": "medio_ambiente",
                "locationId": "670000000000000000000001",
                "status": "draft",
                "imageUrl": image["url"],
                "imageAlt": image["alt"],
                "imageType": image["type"],
                "imageCredit": image["credit"],
                "imageRights": image["rights"],
                "imageAiDisclosure": image["aiDisclosure"],
            },
        )
    assert response.status_code == 201
    assert database["news"].documents[0]["image"] == image
    assert database["news"].documents[0]["content"] == "Texto original conservado."
    assert database["news"].documents[0]["aiAssistance"]["imageGenerated"] is False
