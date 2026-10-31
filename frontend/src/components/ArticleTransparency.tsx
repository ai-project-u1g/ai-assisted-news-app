import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import type { NewsArticle } from "../types";
import { colors, fonts, radii, spacing } from "../theme";
import { SOURCE_LABELS, verificationLabel } from "../features/news/editorialTransparency";

function date(value: string | null) {
  return value ? new Date(value).toLocaleString("es-GT") : "no declarada";
}

export function ArticleTransparency({ article }: { article: NewsArticle }) {
  const [linkError, setLinkError] = useState<string | null>(null);
  const verification = article.verification;
  const ai = article.aiAssistance;
  async function openSource(url: string) {
    try {
      if (!/^https?:\/\//i.test(url)) throw new Error("invalid source");
      await Linking.openURL(url);
      setLinkError(null);
    } catch {
      setLinkError("No pudimos abrir la fuente. Puedes consultar la URL que se muestra.");
    }
  }

  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.heading}>Verificación y procedencia</Text>
      <Text style={styles.status}>{verificationLabel(article)}</Text>
      {verification?.status !== "confirmed" ? (
        <Text style={styles.copy}>Esta información no está confirmada. Revisa las fuentes y las limitaciones antes de compartirla.</Text>
      ) : null}
      <Text style={styles.copy}>{verification?.notes || "No se registraron notas de verificación."}</Text>
      <Text style={styles.copy}>
        {verification?.reviewedAt && verification.reviewedBy
          ? `Revisión humana registrada: ${date(verification.reviewedAt)}`
          : "Sin revisión humana fechada registrada."}
      </Text>
      <Text style={styles.copy}>Texto publicado por {article.author}. El resumen se presenta por separado del artículo y de sus fuentes originales.</Text>
      <Text style={styles.copy}>
        Aportes de IA declarados: {[ai.summaryGenerated && "resumen", ai.topicsGenerated && "temas", ai.imageGenerated && "imagen", article.image.type === "ai_modified" && "alteración de imagen"].filter(Boolean).join(", ") || "ninguno"}.
        {ai.humanReviewed ? " Contenido revisado por una persona." : " Revisión del contenido asistido por IA no declarada."}
      </Text>
      <Text style={styles.copy}>La IA ayuda a resumir o explicar; no verifica los hechos. La decisión de confirmar y publicar corresponde a una persona.</Text>
      <Text accessibilityRole="header" style={styles.heading}>Fuentes originales</Text>
      {article.sources.length === 0 ? <Text style={styles.copy}>No se declararon fuentes; no es posible comprobar la procedencia.</Text> : null}
      {article.sources.map((source, index) => (
        <View key={`${source.url}-${index}`} style={styles.source}>
          <Pressable accessibilityRole="link" accessibilityLabel={`Abrir fuente: ${source.name}`}
            onPress={() => void openSource(source.url)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
            <Text style={styles.linkText}>{source.name}</Text>
          </Pressable>
          <Text selectable style={styles.copy}>{source.url}</Text>
          <Text style={styles.copy}>{SOURCE_LABELS[source.sourceType]}</Text>
          <Text style={styles.copy}>Respalda: {source.supports || "afirmación no especificada"}</Text>
          <Text style={styles.copy}>Publicada: {date(source.publishedAt)} · Consultada: {date(source.accessedAt)}</Text>
        </View>
      ))}
      {linkError ? <Text accessibilityRole="alert" style={styles.copy}>{linkError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: spacing.md, gap: spacing.sm, backgroundColor: colors.surfaceMuted, borderRadius: radii.panel },
  heading: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  status: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  copy: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: colors.textSecondary, flexShrink: 1 },
  source: { gap: spacing.xs, borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing.sm },
  link: { minHeight: 48, justifyContent: "center" },
  linkText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.action, textDecorationLine: "underline" },
  pressed: { opacity: 0.75 },
});
