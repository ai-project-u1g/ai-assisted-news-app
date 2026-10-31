import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "./AppButton";
import { colors, fonts, radii, spacing } from "../theme";
import { getCategoryLabel, type CategoryId } from "../types";
import { fetchImageLibrary, type ImageLibraryCandidate } from "../services/newsService";
import { getCurrentFirebaseIdToken } from "../services/firebaseClient";

type Preview = {
  candidate: ImageLibraryCandidate;
  status: "loading" | "ready" | "error";
  reviewed: boolean;
  attempt: number;
};

export function ImageLibraryPicker({ topic, disabled, onSelect }: {
  topic: CategoryId;
  disabled: boolean;
  onSelect: (candidate: ImageLibraryCandidate) => void;
}) {
  const [open, setOpen] = useState(false);
  const [allTopics, setAllTopics] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<ImageLibraryCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const previewAttempt = useRef(0);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setCandidates([]);
    setPreview(null);
    setError(null);
    void getCurrentFirebaseIdToken().then(token => fetchImageLibrary(token, allTopics ? undefined : topic))
      .then(items => { if (active) setCandidates(items); })
      .catch(() => { if (active) setError("No pudimos cargar la biblioteca. Puedes reintentar o continuar como borrador."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, topic, allTopics, retry]);

  function close() {
    setOpen(false);
    setPreview(null);
  }

  function updateImageStatus(status: Preview["status"], attempt: number) {
    setPreview(current => current?.attempt === attempt ? { ...current, status } : current);
  }

  async function openSource() {
    if (!preview) return;
    try {
      await Linking.openURL(preview.candidate.sourceUrl);
    } catch {
      setError("No pudimos abrir la página original. Consulta la URL que se muestra antes de aceptar la imagen.");
    }
  }

  if (!open) return <AppButton label="Obtener imagen" variant="secondary" disabled={disabled}
    onPress={() => { setAllTopics(false); setOpen(true); }} />;

  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.heading}>Biblioteca de imágenes</Text>
      <Text style={styles.copy}>Fotos de Wikimedia Commons para uso contextual, con crédito y licencia. No documentan el hecho de tu noticia. Elegir una no consume créditos de IA.</Text>
      <Text style={styles.copy}>{allTopics ? "Todas las categorías" : `Sugeridas para ${getCategoryLabel(topic)}`}</Text>
      {loading ? <View style={styles.row}><ActivityIndicator color={colors.action} /><Text style={styles.copy}>Cargando biblioteca…</Text></View> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {error && candidates.length === 0 ? <AppButton label="Reintentar biblioteca" variant="secondary" disabled={disabled || loading}
        onPress={() => setRetry(value => value + 1)} /> : null}
      {!loading && !error && candidates.length === 0 ? <Text style={styles.copy}>No hay imágenes para esta categoría. Puedes consultar toda la biblioteca o continuar sin adjuntar una imagen.</Text> : null}
      {!allTopics ? <AppButton label="Ver toda la biblioteca" variant="ghost" disabled={disabled || loading}
        onPress={() => setAllTopics(true)} /> : null}
      <View style={styles.choices}>
        {candidates.map(candidate => <AppButton key={candidate.id} label={`Previsualizar: ${candidate.title}`}
          variant={preview?.candidate.id === candidate.id ? "primary" : "secondary"} disabled={disabled}
          onPress={() => setPreview({ candidate, status: "loading", reviewed: false, attempt: ++previewAttempt.current })} />)}
      </View>
      {preview ? <View style={styles.preview}>
        <Text style={styles.heading}>{preview.candidate.title}</Text>
        <Image key={preview.attempt} source={{ uri: preview.candidate.image.url }}
          accessibilityLabel={preview.candidate.image.alt} resizeMode="contain" style={styles.image}
          onLoad={() => updateImageStatus("ready", preview.attempt)}
          onError={() => updateImageStatus("error", preview.attempt)} />
        {preview.status === "loading" ? <Text style={styles.copy}>Cargando vista previa…</Text> : null}
        {preview.status === "error" ? <Text accessibilityRole="alert" style={styles.error}>No pudimos cargar esta imagen. Previsualízala de nuevo o elige otra.</Text> : null}
        <Text style={styles.copy}>{preview.candidate.image.alt}</Text>
        <Text selectable style={styles.copy}>Crédito: {preview.candidate.image.credit}</Text>
        <Text selectable style={styles.copy}>Derechos: {preview.candidate.image.rights}</Text>
        <Pressable accessibilityRole="link" accessibilityLabel="Abrir procedencia de la imagen" disabled={disabled}
          onPress={() => void openSource()} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
          <Text style={styles.linkText}>Consultar página original y licencia</Text>
        </Pressable>
        <Text selectable style={styles.copy}>{preview.candidate.sourceUrl}</Text>
        <Pressable accessibilityRole="checkbox" accessibilityLabel="Revisé procedencia, derechos y pertinencia de esta imagen de contexto"
          aria-checked={preview.reviewed} accessibilityState={{ checked: preview.reviewed, disabled }} disabled={disabled}
          onPress={() => setPreview(current => current ? { ...current, reviewed: !current.reviewed } : current)}
          style={({ pressed }) => [styles.review, preview.reviewed && styles.reviewed, pressed && styles.pressed]}>
          <Text style={styles.copy}>{preview.reviewed ? "Sí" : "Pendiente"} · Revisé procedencia, derechos y pertinencia de esta imagen de contexto</Text>
        </Pressable>
        <AppButton label="Usar esta imagen" disabled={disabled || !preview.reviewed || preview.status !== "ready"}
          onPress={() => { onSelect(preview.candidate); close(); }} />
        <Text style={styles.copy}>Solo se adjunta al aceptar. La revisión editorial de la noticia deberá confirmarse después.</Text>
      </View> : null}
      <AppButton label="Cancelar selección de imagen" variant="ghost" disabled={disabled} onPress={close} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.panel, backgroundColor: colors.surfaceMuted },
  heading: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 24, color: colors.ink },
  copy: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: colors.ink, flexShrink: 1 },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 22, color: colors.danger },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  choices: { gap: spacing.xs },
  preview: { gap: spacing.sm },
  image: { width: "100%", aspectRatio: 16 / 9, backgroundColor: colors.surface, borderRadius: radii.image },
  link: { minHeight: 48, justifyContent: "center" },
  linkText: { color: colors.action, fontSize: 14, lineHeight: 22, fontFamily: fonts.bodyBold, textDecorationLine: "underline" },
  review: { minHeight: 48, padding: spacing.sm, borderWidth: 1, borderColor: colors.controlBorder, borderRadius: radii.control },
  reviewed: { backgroundColor: colors.actionSoft, borderColor: colors.action },
  pressed: { opacity: 0.75 },
});
