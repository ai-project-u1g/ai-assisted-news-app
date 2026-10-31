"""Publication decisions are explicit human attestations, never model verdicts."""

from datetime import UTC, datetime
from types import SimpleNamespace

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient
from pydantic import ValidationError

from news.api import (
    AdminNewsCreateRequest,
    _create_news_document,
    create_app,
    get_authenticated_user,
    get_optional_authenticated_user,
)
from news.seed_catalog import CATALOG_LOCATION_IDS, catalog_location_document
from news.tests.test_api_firebase_auth import FakeClient
from news.tests.test_api_firebase_auth import FakeDatabase as ApiDatabase
from news.tests.test_schema_initialize import FakeDatabase


def publication(**overrides):
    payload = {
        "title": "Decisión editorial",
        "summary": "Resumen identificado",
        "content": "Información contrastada por una persona.",
        "topic": "actualidad",
        "locationId": str(CATALOG_LOCATION_IDS["GT"]),
        "status": "published",
        "verificationStatus": "confirmed",
        "humanReviewed": True,
        "verificationNotes": "Se contrastó el comunicado original y su fecha.",
        "sources": [
            {
                "name": "Institución",
                "url": "https://institution.example/notice",
                "sourceType": "official",
                "publishedAt": "2026-10-29T09:00:00Z",
                "accessedAt": "2026-10-30T09:00:00Z",
                "supports": "El anuncio y su fecha de entrada en vigor.",
            }
        ],
    }
    return AdminNewsCreateRequest(**(payload | overrides))


def test_new_admin_article_starts_as_unreviewed_developing_draft():
    payload = publication().model_dump(
        exclude={
            "status",
            "verificationStatus",
            "humanReviewed",
            "verificationNotes",
            "sources",
        }
    )
    request = AdminNewsCreateRequest(**payload)
    assert request.status == "draft"
    assert request.verificationStatus == "developing"
    assert request.humanReviewed is False


@pytest.mark.parametrize(
    "overrides",
    [
        {"humanReviewed": False},
        {"verificationNotes": "   "},
        {"sources": []},
        {"verificationStatus": "insufficient_sources"},
        {
            "sources": [
                {
                    "name": "Medio",
                    "url": "https://media.example/a",
                    "sourceType": "media",
                    "supports": "Anuncio",
                }
            ]
        },
        {
            "sources": [
                {
                    "name": "Institución",
                    "url": "https://institution.example/a",
                    "sourceType": "official",
                    "supports": " ",
                }
            ]
        },
    ],
)
def test_publication_rejects_missing_review_evidence_or_insufficient_sources(overrides):
    with pytest.raises(ValidationError):
        publication(**overrides)


def test_two_links_to_same_host_are_not_independent_corroboration():
    sources = [
        {"name": "Medio", "url": url, "sourceType": "media", "supports": "Anuncio"}
        for url in ("https://media.example/a", "https://www.media.example/b")
    ]
    with pytest.raises(ValidationError):
        publication(sources=sources)
    sources[1]["url"] = "https://second.example/b"
    assert publication(sources=sources).verificationStatus == "confirmed"


@pytest.mark.parametrize("status", ["developing", "conflicting_sources"])
def test_uncertainty_can_be_published_with_a_human_explanation(status):
    request = publication(verificationStatus=status)
    assert request.verificationStatus == status
    assert publication(
        status="draft", humanReviewed=False, sources=[], verificationNotes=None
    )


@pytest.mark.parametrize("image_type", ["ai_generated", "ai_modified"])
def test_ai_visual_requires_disclosure_and_explicit_classification(image_type):
    image = {
        "imageUrl": "https://images.example/a.jpg",
        "imageType": image_type,
        "imageAlt": "Ilustración del tema",
        "imageCredit": "Equipo",
        "imageRights": "Uso autorizado",
    }
    with pytest.raises(ValidationError):
        publication(**image)
    assert publication(
        **image, imageAiDisclosure="Visual de IA; no documenta el hecho."
    )
    with pytest.raises(ValidationError):
        publication(imageUrl=image["imageUrl"])


@pytest.mark.parametrize(
    "image_type", ["none", "photograph", "illustration", "ai_generated", "ai_modified"]
)
def test_provenance_review_and_ai_flags_are_stored_without_inventing_review(image_type):
    db = FakeDatabase()
    db["locations"].insert_one(
        catalog_location_document(
            {"code": "GT", "name": "Guatemala", "country": "Guatemala"}
        )
    )
    actor = {"_id": ObjectId(), "role": "admin"}
    request = publication(
        summaryGenerated=True,
        topicsGenerated=True,
        imageUrl="https://images.example/ai.jpg" if image_type != "none" else None,
        imageType=image_type,
        imageAlt="Ilustración",
        imageCredit="Equipo",
        imageRights="Uso autorizado",
        imageAiDisclosure="Generada con IA; no es evidencia del hecho.",
    )
    doc = _create_news_document(db, request, actor)
    assert doc["verification"]["notes"] == request.verificationNotes
    assert doc["verification"]["reviewedBy"] == actor["_id"]
    assert doc["sources"][0]["supports"] == request.sources[0].supports
    assert doc["sources"][0]["accessedAt"] == datetime(
        2026, 10, 30, 9, tzinfo=UTC
    )
    assert doc["image"]["type"] == image_type
    assert doc["aiAssistance"] == {
        "summaryGenerated": True,
        "topicsGenerated": True,
        "imageGenerated": image_type == "ai_generated",
        "humanReviewed": True,
    }
    draft = _create_news_document(
        db, publication(slug="borrador", status="draft", humanReviewed=False), actor
    )
    assert draft["verification"]["reviewedBy"] is None
    assert draft["verification"]["reviewedAt"] is None


def test_http_publication_checks_cannot_be_bypassed_and_leave_no_news_on_rejection(
    monkeypatch,
):
    db = ApiDatabase()
    monkeypatch.setattr(
        "news.api.get_news_settings",
        lambda: SimpleNamespace(mongodb_database="ai_assisted_news"),
    )
    monkeypatch.setattr("news.api.get_news_client", lambda _settings: FakeClient(db))
    app = create_app()
    actor = {"_id": ObjectId(), "role": "admin"}
    app.dependency_overrides[get_authenticated_user] = lambda: actor
    payload = publication(locationId="670000000000000000000001").model_dump(mode="json")
    with TestClient(app) as client:
        rejected = client.post("/admin/news", json=payload | {"humanReviewed": False})
        assert rejected.status_code == 422
        assert not db["news"].documents
        assert not db["auditLogs"].documents
        accepted = client.post("/admin/news", json=payload)
    assert accepted.status_code == 201
    assert accepted.json()["verification"]["reviewedBy"] == str(actor["_id"])
    assert (
        accepted.json()["sources"][0]["supports"] == payload["sources"][0]["supports"]
    )


def test_http_coverage_returns_published_territories_without_feed_truncation(
    monkeypatch,
):
    from news.demo_news import get_demo_news_documents

    db = ApiDatabase()
    location_id = db["locations"].documents[0]["_id"]
    document = next(
        doc for doc in get_demo_news_documents() if doc["status"] == "published"
    )
    document["geographicScope"] = {"level": "country", "locationIds": [location_id]}
    db["news"].insert_one(document)
    draft = dict(document, _id=ObjectId(), slug="draft", status="draft")
    db["news"].insert_one(draft)
    monkeypatch.setattr(
        "news.api.get_news_settings",
        lambda: SimpleNamespace(mongodb_database="ai_assisted_news"),
    )
    monkeypatch.setattr("news.api.get_news_client", lambda _settings: FakeClient(db))
    app = create_app()
    app.dependency_overrides[get_optional_authenticated_user] = lambda: {
        "simulatedLocationId": location_id
    }
    with TestClient(app) as client:
        response = client.get("/coverage")
    assert response.status_code == 200
    assert response.json()["national"]["slug"] == document["slug"]
    assert response.json()["local"] is None
    assert response.json()["international"] is None
