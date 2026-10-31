import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ArticleImage as ImageData } from "../src/types";

vi.mock("react-native", () => ({
  View: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
  Text: ({ children }: { children: React.ReactNode }) => React.createElement("span", null, children),
  Image: ({ accessibilityLabel }: { accessibilityLabel: string }) => React.createElement("img", { alt: accessibilityLabel }),
  StyleSheet: { create: (value: unknown) => value },
}));
vi.mock("lucide-react-native", () => ({ ImageOff: () => null }));
import { ArticleImage } from "../src/components/ArticleImage";

beforeEach(() => vi.stubGlobal("React", React));
afterEach(() => vi.unstubAllGlobals());

it.each(["ai_generated", "ai_modified"] as const)("labels %s images visibly even on a compact card", (type) => {
  const image: ImageData = { type, src: "https://images.example/visual.jpg", alt: "Un visual",
    aiDisclosure: "Visual sintético", credit: "Equipo", license: "Uso autorizado", sourceUrl: "", width: 960, height: 540 };
  const html = renderToStaticMarkup(React.createElement(ArticleImage, { image, size: "compact" }));
  expect(html).toContain("no es evidencia del hecho");
  expect(html).toContain(type === "ai_modified" ? "Alterada con IA" : "Generada con IA");
  expect(html).toMatch(/<span>.*IA.*evidencia.*<\/span>/);
});
