// @vitest-environment happy-dom

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { NewsArticle } from "../src/types";
import type { AdminNewsCreateInput, NewsCoverage, NewsLocation } from "../src/services/newsService";

type LayoutEvent = { nativeEvent: { layout: { y: number; height: number } } };
const native = vi.hoisted(() => ({
  layouts: new Set<(event: LayoutEvent) => void>(),
  width: 1200,
  os: "web",
  keyboard: new Map<string, () => void>(),
  imageFails: false,
}));

// Keep React's real effects and state; replace native rendering and external I/O.
vi.mock("react-native", async () => {
  const React = await import("react");
  type Props = {
    children?: React.ReactNode;
    onPress?: () => void;
    onLayout?: (event: LayoutEvent) => void;
    accessibilityLabel?: string;
    disabled?: boolean;
    "aria-checked"?: boolean;
    "aria-expanded"?: boolean;
    ref?: React.Ref<unknown>;
  };
  function View({ children, onLayout }: Props) {
    React.useEffect(() => {
      if (onLayout) native.layouts.add(onLayout);
      return () => { if (onLayout) native.layouts.delete(onLayout); };
    }, [onLayout]);
    return React.createElement("div", null, children);
  }
  function ScrollView(props: Props) {
    React.useImperativeHandle(props.ref, () => ({ scrollTo() {} }));
    return React.createElement(View, props);
  }
  return {
    View,
    ScrollView,
    KeyboardAvoidingView: View,
    Text: ({ children }: Props) => React.createElement("span", null, children),
    Pressable: ({ children, onPress, accessibilityLabel, disabled, ...props }: Props) =>
      React.createElement("button", { onClick: onPress, "aria-label": accessibilityLabel,
        "aria-checked": props["aria-checked"], "aria-expanded": props["aria-expanded"], disabled }, children),
    TextInput: ({ accessibilityLabel, value, onChangeText }: { accessibilityLabel: string; value: string; onChangeText: (value: string) => void }) =>
      React.createElement("input", { "aria-label": accessibilityLabel, value, onChange() {}, onInput: (event: React.FormEvent<HTMLInputElement>) => onChangeText(event.currentTarget.value) }),
    Linking: { openURL: vi.fn(async () => undefined) },
    Image: ({ source, accessibilityLabel, onLoad, onError }: { source: { uri: string }; accessibilityLabel: string; onLoad?: () => void; onError?: () => void }) => {
      React.useEffect(() => { if (native.imageFails) onError?.(); else onLoad?.(); }, [source.uri]);
      return React.createElement("img", { alt: accessibilityLabel });
    },
    ActivityIndicator: () => null,
    AppState: { currentState: "active", addEventListener: () => ({ remove() {} }) },
    Keyboard: { addListener: (event: string, callback: () => void) => {
      native.keyboard.set(event, callback);
      return { remove: () => native.keyboard.delete(event) };
    } },
    Platform: { get OS() { return native.os; } },
    StyleSheet: { create: (styles: unknown) => styles },
    useWindowDimensions: () => ({ width: native.width, height: 800 }),
  };
});
vi.mock("react-native-safe-area-context", async () => ({
  SafeAreaView: (await import("react-native")).View,
}));
vi.mock("lucide-react-native", () => Object.fromEntries(
  ["ArrowLeft", "Bookmark", "BookmarkCheck", "FilePlus", "Home", "LogOut", "MessageCircle", "Search", "X"]
    .map((name) => [name, () => null]),
));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: { getItem: async () => null, setItem: async () => undefined },
}));
vi.mock("../src/components/ArticleImage", () => ({ ArticleImage: () => null }));
vi.mock("../src/features/chat/ChatScreen", () => ({
  ChatScreen: ({ isKeyboardVisible }: { isKeyboardVisible?: boolean }) =>
    React.createElement("section", { "data-testid": "chat", "data-keyboard": String(Boolean(isKeyboardVisible)) }),
}));
vi.mock("../src/services/firebaseClient", () => ({
  getCurrentFirebaseIdToken: async () => "verified-test-token",
}));

import { NewsFeedScreen } from "../src/features/news/NewsFeedScreen";

const first: NewsArticle = {
  id: "1", slug: "first", title: "Primera noticia", summary: "Resumen",
  category: "tecnologia", topics: ["tecnologia"], geographicScope: null,
  verification: null, sources: [],
  aiAssistance: { summaryGenerated: false, topicsGenerated: false, imageGenerated: false, humanReviewed: false },
  author: "Redacción", publishedAt: "2026-10-20T12:00:00Z", body: ["Contenido."],
  readingMinutes: 1, source: "Prueba",
  image: { src: null, type: "none", aiDisclosure: null, alt: "", width: 960, height: 540, credit: "", sourceUrl: "", license: "" },
};
const second = { ...first, id: "2", slug: "second", title: "Segunda noticia" };
let serverFeed: NewsArticle[];
let serverCoverage: NewsCoverage;
let serverLocations: NewsLocation[];
let adminPayload: AdminNewsCreateInput | null;
const libraryCandidate = {
  id: "garden", title: "Jardín", topics: ["medio_ambiente"],
  sourceUrl: "https://commons.wikimedia.org/wiki/File:Garden.jpg",
  image: { url: "https://upload.wikimedia.org/wikipedia/commons/3/37/Garden.jpg",
    type: "photograph", alt: "Un jardín. Imagen de contexto; no documenta el hecho.",
    credit: "Shengzhi Li · Wikimedia Commons", rights: "CC BY-SA 2.5 · https://creativecommons.org/licenses/by-sa/2.5/", aiDisclosure: null },
};
let libraryCandidates: typeof libraryCandidate[];
let libraryFails: boolean;
let libraryGate: Promise<void> | null;
let root: Root;
let container: HTMLDivElement;
let finishExit: () => void;
let finishRead: () => void;
let exitGate: Promise<void>;
let readGate: Promise<void>;
let feedRequests: number;
let readRequests: number;
let exitDuration: number | undefined;
let exitStatus: number;

beforeEach(() => {
  native.width = 1200;
  native.os = "web";
  native.keyboard.clear();
  native.imageFails = false;
  vi.useFakeTimers();
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "#/inicio");
  serverFeed = [first, second];
  serverCoverage = { local: null, national: null, international: null };
  serverLocations = [];
  adminPayload = null;
  libraryCandidates = [libraryCandidate];
  libraryFails = false;
  libraryGate = null;
  feedRequests = 0;
  readRequests = 0;
  exitDuration = undefined;
  exitStatus = 200;
  exitGate = new Promise((resolve) => { finishExit = resolve; });
  readGate = new Promise((resolve) => { finishRead = resolve; });
  vi.stubGlobal("fetch", vi.fn(async (input: string, init?: RequestInit) => {
    const path = new URL(input).pathname;
    if (path === "/news") {
      feedRequests += 1;
      return { ok: true, json: async () => [...serverFeed] };
    }
    if (path === "/coverage") return { ok: true, json: async () => serverCoverage };
    if (path === "/profile") return { ok: true, json: async () => ({
      locationId: "country", locationName: "Guatemala", selectedTopics: [],
      inferredInterests: [], onboardingCompleted: true,
    }) };
    if (path === "/locations") return { ok: true, json: async () => serverLocations };
    if (path === "/admin/news") {
      adminPayload = JSON.parse(String(init?.body));
      return { ok: true, json: async () => first };
    }
    if (path === "/admin/image-library") {
      if (libraryGate) await libraryGate;
      return { ok: !libraryFails, status: libraryFails ? 503 : 200, json: async () => libraryCandidates };
    }
    if (path.endsWith("/opened")) {
      const payload = JSON.parse(String(init?.body));
      if (payload.dwellTimeSeconds !== undefined) {
        exitDuration = payload.dwellTimeSeconds;
        await exitGate;
        return { ok: exitStatus === 200, status: exitStatus };
      }
      return { ok: true };
    }
    if (path.endsWith("/read")) {
      readRequests += 1;
      await readGate;
      return { ok: true };
    }
    if (path === "/news/first") return { ok: true, json: async () => first };
    throw new Error(`Unexpected request: ${path}`);
  }));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  finishRead();
  finishExit();
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function render(role: "admin" | "user" = "user") {
  await act(async () => {
    root.render(React.createElement(NewsFeedScreen, {
      user: { id: "reader", name: "Reader", email: "reader@example.test", isGuest: false, role },
      onSignOut() {},
    }));
  });
}

async function press(label: string) {
  const button = [...container.querySelectorAll("button")].find((item) =>
    item.getAttribute("aria-label") === label || item.textContent === label);
  expect(button, label).toBeDefined();
  await act(async () => { button!.click(); });
}

async function reachReadThreshold() {
  await act(async () => {
    for (const onLayout of native.layouts) {
      onLayout({ nativeEvent: { layout: { y: 0, height: 300 } } });
    }
    await vi.advanceTimersByTimeAsync(6000);
  });
  expect(readRequests).toBe(1);
}

function leadTitle() {
  return container.querySelector('button[aria-label^="Abrir noticia:"]')?.getAttribute("aria-label");
}

describe("feed after reading", () => {
  it("waits for final dwell time before showing the updated ranking on return", async () => {
    await render();
    await press("Abrir noticia: Primera noticia");
    await act(async () => { await vi.advanceTimersByTimeAsync(35000); });
    await press("Inicio");

    expect(exitDuration).toBe(35);
    expect(feedRequests).toBe(1);
    serverFeed = [second, first];
    await act(async () => { finishExit(); });

    expect(feedRequests).toBe(2);
    expect(leadTitle()).toBe("Abrir noticia: Segunda noticia");
  });

  it("keeps the article open after read succeeds and refreshes on browser back", async () => {
    await render();
    await press("Abrir noticia: Primera noticia");
    await act(async () => { finishRead(); });
    await reachReadThreshold();

    expect(feedRequests).toBe(1);
    expect(container.textContent).toContain("Contenido.");
    await act(async () => {
      window.history.replaceState(null, "", "#/inicio");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(feedRequests).toBe(1);
    serverFeed = [second, first];
    await act(async () => { finishExit(); });

    expect(feedRequests).toBe(2);
    expect(leadTitle()).toBe("Abrir noticia: Segunda noticia");
  });

  it("refreshes again when an in-flight read finishes after returning home", async () => {
    await render();
    await press("Abrir noticia: Primera noticia");
    await reachReadThreshold();
    await act(async () => { finishExit(); });
    await press("Inicio");
    const requestsBeforeRead = feedRequests;
    serverFeed = [second, first];
    await act(async () => { finishRead(); });

    expect(feedRequests).toBeGreaterThan(requestsBeforeRead);
    expect(leadTitle()).toBe("Abrir noticia: Segunda noticia");
  });

  it("still refreshes a completed read if sending the final dwell time fails", async () => {
    await render();
    await press("Abrir noticia: Primera noticia");
    await act(async () => { finishRead(); });
    await reachReadThreshold();
    exitStatus = 503;
    await press("Inicio");
    serverFeed = [second, first];
    await act(async () => { finishExit(); });

    expect(feedRequests).toBe(2);
    expect(leadTitle()).toBe("Abrir noticia: Segunda noticia");
  });

  it("loads an initial article link even when the article is outside the feed", async () => {
    window.history.replaceState(null, "", "#/noticia/first");
    serverFeed = [second];

    await render();

    expect(feedRequests).toBe(1);
    expect(container.textContent).toContain("Contenido.");
  });
});

describe("mobile assistant navigation", () => {
  it("opens the assistant first in the Android app and hides navigation while typing", async () => {
    native.os = "android";
    native.width = 390;
    await render();
    expect(container.querySelector('[data-testid="chat"]')).not.toBeNull();
    expect([...container.querySelectorAll("button")].some(button => button.textContent === "Guardados")).toBe(true);
    await act(async () => { native.keyboard.get("keyboardDidShow")?.(); });
    expect(container.querySelector('[data-testid="chat"]')?.getAttribute("data-keyboard")).toBe("true");
    expect([...container.querySelectorAll("button")].some(button => button.textContent === "Guardados")).toBe(false);
    await act(async () => { native.keyboard.get("keyboardDidHide")?.(); });
    expect([...container.querySelectorAll("button")].some(button => button.textContent === "Guardados")).toBe(true);
    await press("Inicio");
    expect(leadTitle()).toBe("Abrir noticia: Primera noticia");
    await press("Asistente");
    expect(container.querySelector('[data-testid="chat"]')).not.toBeNull();
  });
  it("opens the assistant on mobile web without an explicit route", async () => {
    native.width = 390;
    window.history.replaceState(null, "", "/");
    await render();
    expect(container.querySelector('[data-testid="chat"]')).not.toBeNull();
  });
  it("keeps the desktop home page and explicit mobile links", async () => {
    window.history.replaceState(null, "", "/");
    await render();
    expect(leadTitle()).toBe("Abrir noticia: Primera noticia");
    native.width = 390;
    await act(async () => {
      window.history.replaceState(null, "", "#/noticia/first");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(container.textContent).toContain("Contenido.");
  });
});

describe("editorial transparency", () => {
  it("keeps coverage outside the personalized feed visible and opens its article", async () => {
    serverFeed = [second];
    serverCoverage = { local: null, national: first, international: null };
    await render();
    expect(container.textContent).toContain("Panorama por territorio");
    expect(container.textContent).toContain("Sin cobertura local");
    await press("Abrir noticia: Primera noticia");
    expect(container.textContent).toContain("Contenido.");
  });
  it("warns about uncertainty and identifies AI summaries before opening an article", async () => {
    serverFeed = [{ ...first,
      verification: { status: "conflicting_sources", reviewedBy: "editor", reviewedAt: first.publishedAt, notes: "Las cifras difieren." },
      aiAssistance: { ...first.aiAssistance, summaryGenerated: true },
    }];
    await render();
    expect(container.textContent).toContain("Fuentes contradictorias");
    expect(container.textContent).toContain("Resumen generado con IA");
    await press("Abrir noticia: Primera noticia");
    expect(container.textContent).toContain("Las cifras difieren.");
    expect(container.textContent).toContain("no verifica los hechos");
  });

  it("shows source evidence and timestamps, not just a source name", async () => {
    serverFeed = [{ ...first, sources: [{ name: "Comunicado original", url: "https://institution.example/notice",
      sourceType: "primary_source", publishedAt: first.publishedAt, accessedAt: first.publishedAt,
      supports: "La fecha del anuncio.",
    }] }];
    await render();
    await press("Abrir noticia: Primera noticia");
    expect(container.textContent).toContain("Documento o material original");
    expect(container.textContent).toContain("La fecha del anuncio.");
    expect(container.textContent).toContain("Consultada:");
    expect(container.querySelector('button[aria-label="Abrir fuente: Comunicado original"]')).not.toBeNull();
  });

  it("explains ranking and coverage without calling affinity a truth score", async () => {
    await render();
    await press("Cómo se ordena tu feed");
    expect(container.textContent).toContain("30");
    expect(container.textContent).toContain("4 y 9");
    expect(container.textContent).toContain("no mide la veracidad");
  });

  it("starts the admin form as a draft and asks for human evidence", async () => {
    window.history.replaceState(null, "", "#/admin/nueva");
    await render("admin");
    expect(container.textContent).toContain("Una respuesta de IA no es una fuente");
    expect(container.querySelector('input[aria-label="Notas de verificación"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="He contrastado las fuentes y revisado el contenido"]')).not.toBeNull();
    await press("Agregar fuente");
    expect(container.querySelector('input[aria-label="Nombre de fuente 2"]')).not.toBeNull();
  });

  it("announces the review state on web and invalidates it after editing classification", async () => {
    window.history.replaceState(null, "", "#/admin/nueva");
    await render("admin");
    const label = "He contrastado las fuentes y revisado el contenido";
    const review = container.querySelector(`button[aria-label="${label}"]`)!;
    expect(review.getAttribute("aria-checked")).toBe("false");
    await press(label);
    expect(review.getAttribute("aria-checked")).toBe("true");
    await press("Confirmada");
    expect(review.getAttribute("aria-checked")).toBe("false");
  });

  it("sends the human evidence, source provenance and altered image declaration from the form", async () => {
    window.history.replaceState(null, "", "#/admin/nueva");
    serverLocations = [{ id: "670000000000000000000001", name: "Guatemala", country: "Guatemala", countryCode: "GT", level: "country" }];
    await render("admin");
    async function fill(label: string, value: string) {
      const input = container.querySelector(`input[aria-label="${label}"]`) as HTMLInputElement;
      expect(input, label).not.toBeNull();
      await act(async () => { input.value = value; input.dispatchEvent(new Event("input", { bubbles: true })); });
    }
    await fill("Título", "Publicación de prueba");
    await fill("Resumen", "Resumen asistido");
    await fill("Contenido", "Texto revisado por la persona editora.");
    await fill("Nombre de fuente 1", "Comunicado original");
    await fill("Nombre de fuente 1", "");
    await fill("Nombre de fuente 1", "Comunicado original");
    await fill("URL de fuente 1", "https://institution.example/notice");
    await fill("Afirmación respaldada 1", "La fecha del anuncio.");
    await press("Fuente oficial");
    await press("Publicar ahora");
    await press("Confirmada");
    await fill("Notas de verificación", "Revisado el comunicado y su fecha.");
    await press("El resumen se generó con IA");
    await press("Alterada con IA");
    await fill("URL de imagen", "https://images.example/altered.jpg");
    await fill("Texto alternativo de imagen", "Ilustración contextual.");
    await fill("Crédito de imagen", "Equipo");
    await fill("Derechos de imagen", "Uso autorizado");
    await fill("Declaración de IA de la imagen", "Alterada con IA; no documenta el hecho.");
    await press("He contrastado las fuentes y revisado el contenido");
    await press("Guardar noticia");
    expect(adminPayload).toMatchObject({ status: "published", verificationStatus: "confirmed", humanReviewed: true,
      summaryGenerated: true, imageType: "ai_modified", imageAiDisclosure: "Alterada con IA; no documenta el hecho.",
      sources: [{ name: "Comunicado original", sourceType: "official", supports: "La fecha del anuncio." }],
    });
  });
});

describe("obtaining an image while writing an article", () => {
  async function adminEditor() {
    window.history.replaceState(null, "", "#/admin/nueva");
    serverLocations = [{ id: "670000000000000000000001", name: "Guatemala", country: "Guatemala", countryCode: "GT", level: "country" }];
    await render("admin");
  }
  async function fill(label: string, value: string) {
    const input = container.querySelector(`input[aria-label="${label}"]`) as HTMLInputElement;
    expect(input, label).not.toBeNull();
    await act(async () => { input.value = value; input.dispatchEvent(new Event("input", { bubbles: true })); });
  }
  function value(label: string) {
    return (container.querySelector(`input[aria-label="${label}"]`) as HTMLInputElement).value;
  }
  it("previews a candidate, requires human review, and attaches all provenance without losing the article", async () => {
    await adminEditor();
    await fill("Título", "Mi noticia conservada");
    await fill("Resumen", "Mi resumen");
    await fill("Contenido", "Texto original conservado.");
    await press("He contrastado las fuentes y revisado el contenido");
    await press("Obtener imagen");
    await press("Previsualizar: Jardín");
    expect(value("URL de imagen")).toBe("");
    const attach = [...container.querySelectorAll("button")].find(button => button.textContent === "Usar esta imagen")!;
    expect(attach.disabled).toBe(true);
    expect(container.textContent).toContain("CC BY-SA 2.5");
    await press("Revisé procedencia, derechos y pertinencia de esta imagen de contexto");
    await press("Usar esta imagen");
    expect(value("Título")).toBe("Mi noticia conservada");
    expect(value("URL de imagen")).toBe(libraryCandidate.image.url);
    expect(value("Crédito de imagen")).toBe(libraryCandidate.image.credit);
    expect(value("Derechos de imagen")).toBe(libraryCandidate.image.rights);
    expect(container.querySelector('button[aria-label="He contrastado las fuentes y revisado el contenido"]')?.getAttribute("aria-checked")).toBe("false");
    await press("Guardar noticia");
    expect(adminPayload).toMatchObject({ title: "Mi noticia conservada", imageUrl: libraryCandidate.image.url,
      imageType: "photograph", imageAlt: libraryCandidate.image.alt, imageCredit: libraryCandidate.image.credit,
      imageRights: libraryCandidate.image.rights, humanReviewed: false });
  });
  it("cancels without replacing an existing image or changing the article", async () => {
    await adminEditor();
    await fill("Título", "No perder");
    await fill("URL de imagen", "https://images.example/existing.jpg");
    await press("Obtener imagen");
    await press("Previsualizar: Jardín");
    await press("Cancelar selección de imagen");
    expect(value("URL de imagen")).toBe("https://images.example/existing.jpg");
    expect(value("Título")).toBe("No perder");
  });
  it("shows a retrieval error, retries and keeps the editor usable", async () => {
    libraryFails = true;
    await adminEditor();
    await fill("Título", "Texto conservado");
    await press("Obtener imagen");
    expect(container.textContent).toContain("No pudimos cargar la biblioteca");
    libraryFails = false;
    await press("Reintentar biblioteca");
    await press("Previsualizar: Jardín");
    expect(value("Título")).toBe("Texto conservado");
  });
  it("handles no candidates and lets the editor browse the full library or cancel", async () => {
    libraryCandidates = [];
    await adminEditor();
    await press("Obtener imagen");
    expect(container.textContent).toContain("No hay imágenes para esta categoría");
    libraryCandidates = [libraryCandidate];
    await press("Ver toda la biblioteca");
    await press("Previsualizar: Jardín");
    await press("Cancelar selección de imagen");
    expect(value("URL de imagen")).toBe("");
  });
  it("prevents attaching a preview that failed to load", async () => {
    native.imageFails = true;
    await adminEditor();
    await press("Obtener imagen");
    await press("Previsualizar: Jardín");
    expect(container.textContent).toContain("No pudimos cargar esta imagen");
    await press("Revisé procedencia, derechos y pertinencia de esta imagen de contexto");
    expect([...container.querySelectorAll("button")].find(button => button.textContent === "Usar esta imagen")?.disabled).toBe(true);
    expect(value("URL de imagen")).toBe("");
  });
  it("ignores a late library response after cancellation", async () => {
    let finish!: () => void;
    libraryGate = new Promise<void>(resolve => { finish = resolve; });
    await adminEditor();
    await press("Obtener imagen");
    expect(container.textContent).toContain("Cargando biblioteca");
    await press("Cancelar selección de imagen");
    await act(async () => { finish(); });
    expect(value("URL de imagen")).toBe("");
    expect([...container.querySelectorAll("button")].some(button => button.textContent === "Previsualizar: Jardín")).toBe(false);
  });
});
