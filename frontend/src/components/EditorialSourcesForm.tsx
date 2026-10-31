import { StyleSheet, Text, TextInput, View } from "react-native";
import { AppButton } from "./AppButton";
import { colors, fonts, radii, spacing } from "../theme";
import type { AdminSourceInput } from "../services/newsService";
import { SOURCE_LABELS } from "../features/news/editorialTransparency";

export function emptySource(): AdminSourceInput {
  return { name: "", url: "", sourceType: "other", publishedAt: null, supports: null };
}

export function EditorialSourcesForm({ sources, onChange, disabled }: {
  sources: AdminSourceInput[];
  onChange: (sources: AdminSourceInput[]) => void;
  disabled: boolean;
}) {
  function change(index: number, value: Partial<AdminSourceInput>) {
    onChange(sources.map((source, position) => position === index ? { ...source, ...value } : source));
  }
  return (
    <View style={styles.list}>
      <Text style={styles.copy}>Registra el material original, su fecha y qué afirmación respalda. Dos enlaces al mismo sitio no cuentan como corroboración independiente. La independencia real la evalúa la persona revisora.</Text>
      {sources.map((source, index) => (
        <View key={index} style={styles.source}>
          <Text style={styles.label}>Fuente {index + 1}</Text>
          {([
            ["name", "Nombre de fuente", "Medio, institución o documento"],
            ["url", "URL de fuente", "https://..."],
            ["supports", "Afirmación respaldada", "Qué respalda y qué no permite afirmar"],
            ["publishedAt", "Fecha de publicación de fuente", "ISO 8601 con zona horaria; vacío si se desconoce"],
            ["accessedAt", "Fecha de consulta de fuente", "Vacío para registrar la fecha actual"],
          ] as const).map(([field, label, placeholder]) => (
            <View key={field} style={styles.list}>
              <Text style={styles.label}>{label} {index + 1}</Text>
              <TextInput accessibilityLabel={`${label} ${index + 1}`} placeholder={placeholder}
                placeholderTextColor={colors.textSecondary} value={source[field] ?? ""} editable={!disabled}
                autoCapitalize="none" keyboardType={field === "url" ? "url" : "default"}
                onChangeText={(value) => change(index, { [field]: value || (
                  field === "accessedAt" ? undefined : field === "publishedAt" || field === "supports" ? null : ""
                ) })}
                style={styles.input} />
            </View>
          ))}
          <Text style={styles.label}>Tipo de fuente {index + 1}: {SOURCE_LABELS[source.sourceType]}</Text>
          <View style={styles.options}>
            {(Object.entries(SOURCE_LABELS) as [AdminSourceInput["sourceType"], string][]).map(([type, label]) => (
              <AppButton key={type} label={label} variant={source.sourceType === type ? "primary" : "secondary"}
                disabled={disabled} onPress={() => change(index, { sourceType: type })} />
            ))}
          </View>
          {sources.length > 1 ? <AppButton label={`Quitar fuente ${index + 1}`} variant="ghost" disabled={disabled}
            onPress={() => onChange(sources.filter((_, position) => position !== index))} /> : null}
        </View>
      ))}
      <AppButton label="Agregar fuente" variant="secondary" disabled={disabled || sources.length >= 10}
        onPress={() => onChange([...sources, emptySource()])} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
  source: { paddingVertical: spacing.md, gap: spacing.sm, borderTopWidth: 1, borderColor: colors.border },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  copy: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  input: { borderWidth: 1, borderColor: colors.controlBorder, borderRadius: radii.control, padding: spacing.sm,
    minHeight: 48, fontFamily: fonts.body, fontSize: 16, color: colors.ink, backgroundColor: colors.surface },
  options: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
});
