import { StyleSheet, Text, View } from "react-native";
import { ArticleCard } from "./ArticleCard";
import { colors, fonts, radii, spacing } from "../theme";
import type { NewsArticle } from "../types";
import type { NewsCoverage } from "../services/newsService";

export function TerritoryCoverage({ coverage, error, isSaved, onOpen, onToggleSave }: {
  coverage: NewsCoverage | null;
  error: string | null;
  isSaved: (article: NewsArticle) => boolean;
  onOpen: (article: NewsArticle) => void;
  onToggleSave: (article: NewsArticle) => void;
}) {
  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>Panorama por territorio</Text>
      <Text style={styles.copy}>Sin filtros por tus intereses: la noticia más reciente de cada alcance. Amplía la cobertura; no declara prioridad editorial ni confirma los hechos.</Text>
      {error ? <Text accessibilityRole="alert" style={styles.copy}>{error}</Text> : null}
      {!coverage && !error ? <Text style={styles.copy}>Cargando panorama territorial…</Text> : null}
      {coverage ? (Object.entries({ local: "Local o regional", national: "Nacional", international: "Internacional" }) as [keyof NewsCoverage, string][]).map(([key, label]) => (
        <View key={key} style={styles.territory}>
          <Text style={styles.label}>{label}</Text>
          {coverage[key] ? <ArticleCard article={coverage[key]} isSaved={isSaved(coverage[key])}
            onOpen={onOpen} onToggleSave={onToggleSave} variant="compact" />
            : <Text style={styles.copy}>{key === "local" ? "Sin cobertura local para la ubicación seleccionada. Un país no equivale a una ciudad." : "No hay noticias publicadas para este alcance."}</Text>}
        </View>
      )) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.panel, marginVertical: spacing.md },
  title: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 32, color: colors.ink },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  territory: { gap: spacing.sm },
  copy: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: colors.textSecondary },
});
