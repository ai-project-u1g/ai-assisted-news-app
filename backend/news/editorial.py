"""Editorial attestations at the admin publication boundary; no truth classifier."""

from typing import Any
from urllib.parse import urlparse


def has_confirmation_basis(sources: list[dict[str, Any]]) -> bool:
    """A minimum provenance signal; independence and truth still require a person."""
    hosts = {
        (urlparse(source.get("url") or "").hostname or "").lower().removeprefix("www.")
        for source in sources
    } - {""}
    primary = any(
        source.get("sourceType") in {"official", "primary_source"} for source in sources
    )
    return len(hosts) >= 2 or primary


def validate_publication(payload: Any) -> None:
    """Enforce minimum traceability; the authenticated person owns the decision."""
    if payload.status != "published":
        return
    if not payload.humanReviewed:
        raise ValueError(
            "Publicar requiere revisión humana explícita; una respuesta de IA no verifica los hechos."
        )
    if not payload.verificationNotes:
        raise ValueError(
            "Documenta en notas de verificación qué contrastaste y qué sigue incierto."
        )
    if payload.verificationStatus == "insufficient_sources":
        raise ValueError(
            "Las noticias con fuentes insuficientes deben permanecer como borrador."
        )
    if not payload.sources or any(
        not (source.supports or "").strip() for source in payload.sources
    ):
        raise ValueError(
            "Agrega fuentes con la afirmación que respalda cada una antes de publicar."
        )
    if payload.verificationStatus == "confirmed" and not has_confirmation_basis(
        [source.model_dump() for source in payload.sources]
    ):
        raise ValueError(
            "Confirmar requiere una fuente oficial/primaria o corroboración de dos sitios distintos; revisa su independencia."
        )
    if payload.imageUrl and not all(
        (value or "").strip()
        for value in (payload.imageAlt, payload.imageCredit, payload.imageRights)
    ):
        raise ValueError(
            "Publicar una imagen requiere texto alternativo, crédito y derechos de uso."
        )
