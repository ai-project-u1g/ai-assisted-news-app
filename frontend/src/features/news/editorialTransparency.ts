import type { ArticleImage, NewsArticle } from "../../types";

export const VERIFICATION_LABELS = {
  confirmed: "Confirmada por la redacción",
  developing: "En desarrollo · puede cambiar",
  insufficient_sources: "Fuentes insuficientes · sin confirmar",
  conflicting_sources: "Fuentes contradictorias · sin confirmar",
};

export const SOURCE_LABELS = {
  official: "Fuente oficial",
  media: "Medio de comunicación",
  primary_source: "Documento o material original",
  witness: "Testimonio directo",
  other: "Otra procedencia",
};

export function verificationLabel(article: NewsArticle) {
  return article.verification ? VERIFICATION_LABELS[article.verification.status] : "Verificación no declarada";
}

export function imageLabel(image: ArticleImage) {
  if (image.src && image.type === "none") return "Procedencia visual no declarada";
  return {
    photograph: "Fotografía · consulta su contexto",
    illustration: "Ilustración · no documenta el hecho",
    ai_generated: "Generada con IA · no es evidencia del hecho",
    ai_modified: "Alterada con IA · no es evidencia del hecho",
    none: "Sin imagen",
  }[image.type];
}

export function summaryLabel(article: NewsArticle) {
  return article.aiAssistance.summaryGenerated ? "Resumen generado con IA" : "Resumen de la redacción";
}
