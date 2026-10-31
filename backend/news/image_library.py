"""Small, reviewed contextual photo library; no AI, remote discovery or DB writes."""

from .demo_images import get_demo_image
from .topics import normalize_topic

# Reuse the reviewed asset metadata, not the fictitious news content.
_LIBRARY = (
    (
        "garden",
        "Jardín",
        "demo-ca-01-sensores-jardin",
        ("medio_ambiente", "ciencia", "salud"),
    ),
    ("pitch", "Cancha de fútbol", "demo-gt-02-liga-fin-semana", ("deportes",)),
    (
        "room",
        "Sala de reuniones",
        "demo-ar-01-asamblea-salon",
        (
            "actualidad",
            "economia",
            "negocios",
            "politica",
            "seguridad",
            "internacional",
        ),
    ),
    (
        "guitar",
        "Guitarra acústica",
        "demo-jm-01-noche-acustica",
        ("cultura", "entretenimiento"),
    ),
    (
        "shelves",
        "Estanterías con libros",
        "demo-fr-01-ruta-lectura",
        ("educacion", "cultura"),
    ),
    (
        "bicycles",
        "Bicicletas estacionadas",
        "demo-au-01-ciclismo-recreativo",
        ("medio_ambiente", "deportes", "salud"),
    ),
)


def image_candidates(topic: str | None = None) -> list[dict]:
    """Return independent candidates with attribution and explicit contextual captions."""
    normalized = normalize_topic(topic) if topic else None
    candidates = []
    for asset_id, title, slug, topics in _LIBRARY:
        if normalized and normalized not in topics:
            continue
        image = get_demo_image(slug)
        image["alt"] = image["alt"].replace(
            "el acontecimiento demo", "el hecho de esta noticia"
        )
        source_url = image["credit"].split("Wikimedia Commons: ", 1)[1]
        candidates.append(
            {
                "id": asset_id,
                "title": title,
                "topics": list(topics),
                "sourceUrl": source_url,
                "image": image,
            }
        )
    return candidates
