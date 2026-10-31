import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii, spacing } from "../theme";

export function FeedExplanation() {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.panel}>
      <Pressable accessibilityRole="button" accessibilityLabel="Cómo se ordena tu feed"
        accessibilityState={{ expanded }} aria-expanded={expanded} onPress={() => setExpanded(!expanded)}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.75 }]}>
        <Text style={styles.title}>Cómo se ordena tu feed {expanded ? "−" : "+"}</Text>
      </Pressable>
      {expanded ? <View style={styles.copyBlock}>
        <Text style={styles.copy}>El orden usa reglas, sin llamadas a IA: ubicación exacta +30; alcance internacional +10 cuando no coincide tu ubicación; temas elegidos +20; intereses de lectura hasta +20; actualidad hasta +20, que baja a cero en 14 días.</Text>
        <Text style={styles.copy}>La primera noticia tiene mayor tamaño; las siguientes conservan el orden del servidor. En empates se usa fecha y luego identificador. La afinidad no mide la veracidad ni la importancia pública.</Text>
        <Text style={styles.copy}>Las posiciones 4 y 9 reservan espacio para otras ubicaciones o alcance internacional, por actualidad, si hay oferta. El panorama territorial se consulta por separado, sin filtros por tus temas y sin el límite de 50 noticias del feed.</Text>
        <Text style={styles.copy}>No hay un detector automático de emergencias ni una garantía de mostrar todo lo importante. Puedes cambiar tus preferencias y consultar otras secciones. La ubicación es manual; no usamos GPS.</Text>
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surfaceMuted, borderRadius: radii.panel, marginVertical: spacing.sm, paddingHorizontal: spacing.md },
  button: { minHeight: 48, justifyContent: "center" },
  title: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.action },
  copyBlock: { gap: spacing.sm, paddingBottom: spacing.md },
  copy: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: colors.ink },
});
