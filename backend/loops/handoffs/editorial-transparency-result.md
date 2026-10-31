# Transparencia editorial y Responsible AI

Fecha: 2026-10-30.

## Objetivo

Aplicar los cinco criterios de transparencia de la página 2 del PDF local
`Proyecto_2_AI_Assisted_News_App (3).pdf`: importancia/relevancia, fuentes,
validación, límites de IA e imágenes. Se revisaron los handoffs de los loops 11/12,
el de imágenes y `docs/design/database/` antes de implementar. El usuario había
retirado el trabajo de Expo Go; no se restableció.

## Cambios y decisiones

- Conservados pesos, desempates, prominencia y reservas 4/9 del ranking aprobado.
  La API expone componentes/puntaje calculados y la interfaz explica reglas y límites.
- `GET /coverage` selecciona la publicación más reciente local/regional, nacional e
  internacional sin filtrar intereses ni limitarse a las 50 candidatas del feed.
  Local exige coincidencia exacta de ciudad/región; nacional usa `countryCode` del catálogo.
  Ausencia de oferta se comunica; seleccionar país no crea cobertura de ciudad.
- El panel empieza en borrador/desarrollo. Publicar exige revisión humana explícita,
  fuentes con afirmación respaldada y notas. Fuentes insuficientes permanecen en borrador;
  desarrollo/contradicción se publican solo con revisión y explicación de incertidumbre.
- Confirmar exige respaldo mínimo oficial/primario o sitios distintos. La comparación
  normaliza `www.`; **no demuestra independencia ni verdad**. La revisión humana debe
  contrastar fechas, contexto, afirmaciones y versiones. No se agregó clasificador de veracidad.
- Se almacenan múltiples fuentes y sus fechas, notas, revisión y aportes IA en los campos
  existentes. Autor/revisor proceden de la identidad autenticada. Editar el formulario
  invalida su revisión. La auditoría de creación conserva la decisión declarada.
- Imagen con URL requiere tipo explícito. Publicar exige alt/crédito/derechos; tipos IA
  exigen declaración. Los cinco tipos se conservan sin inferir fotografía de la URL.
  Feed/detalle etiquetan generación/alteración como contenido que no es evidencia del hecho.
- El lector ve estados inciertos antes de abrir, resumen diferenciado, notas, fuentes
  enlazables, fechas, afirmaciones respaldadas, contexto visual y uso de IA declarado.
- El chat mantiene autoridad editorial en código: incertidumbre/notas y prefacio preceden
  a la salida LLM, sin que esta modifique la noticia. El contexto incluye procedencia y
  declaraciones; «respaldo documental» evita presentar confianza como probabilidad de verdad.
- La publicación refresca el ranking del servidor, sin insertar una noticia arbitrariamente
  en el primer puesto del cliente. Las aperturas desde panorama registran posición nula.

## Archivos creados/modificados

- Backend noticias: `backend/news/api.py`, `editorial.py`, `personalization.py`, `README.md`.
- Pruebas noticias: `backend/news/tests/test_api.py`, `test_editorial_policy.py`, `test_coverage.py`.
- Chat news: `backend/assistant/news_chat/retrieval.py`, `service.py`,
  `backend/assistant/prompts/news.md`, `backend/assistant/tests/test_news_chat.py`,
  `test_news_conversation.py`.
- Frontend: `frontend/src/types.ts`, `services/newsService.ts`,
  `features/news/NewsFeedScreen.tsx`, `features/news/editorialTransparency.ts`,
  `features/chat/ChatScreen.tsx`; componentes `ArticleCard.tsx`, `ArticleImage.tsx`,
  `ArticleTransparency.tsx`, `EditorialSourcesForm.tsx`, `FeedExplanation.tsx`,
  `TerritoryCoverage.tsx`; `frontend/README.md`.
- Pruebas frontend: `frontend/tests/newsFeedReading.test.tsx`, `editorialImages.test.tsx`.
- Diseño: `docs/design/database/02-criterios-de-contenido.md`,
  `03-criterios-de-personalizacion.md`, `04-criterios-de-chat-y-costos.md`,
  `07-diagrama.md`, `README.md`.
- Seguimiento: `docs/reviews/alcance-pendiente-proyecto-2.md`,
  `docs/reviews/transparencia-responsible-ai-demo.md` y este handoff.
- El PDF aportado por el usuario permanece sin modificar y fuera de staging.

## Comandos, pruebas y resultados

- Inspección: `git status --short`, `git log`, `rg`, lecturas acotadas de diseño/handoffs,
  `pdftotext -layout` hacia `/tmp/news-project-requirements.txt` y revisión de diffs.
- Skills: planning-with-files, test-driven-development, ui-ux-pro-max,
  systematic-debugging para fallos observados, code-reviewer y security-compliance.
  Plan fuera de Git: `/tmp/news-editorial-task-plan.md`.
- TDD: inicialmente fallaron 11 casos de publicación/procedencia, 4 de pantalla, 3 de
  panorama, 2 de chat y 1 de semántica web; pasaron después de implementar cada cambio.
- Dependencias de verificación instaladas en `/tmp/news-editorial-venv` y
  `/tmp/news-editorial-preview`; sin cambios a dependencias de producción o lockfiles.
- Una ejecución directa inicial de news falló por parámetros de `.env` local. Deshabilitar
  dotenv permitió verificar news, pero impidió una prueba del assistant que carga un archivo
  temporal explícito. La ejecución final usa copia de ambos árboles fuente/test en
  `/tmp/news-editorial-isolated`, excluyendo **antes de recorrer** `keys`, `.env`, `.env.*`,
  cachés y venvs; incluye el contrato generado. No se alteró configuración del usuario.
- Suite final news + assistant: **424 passed, 1 skipped**. El omitido es el smoke externo
  que exige `ASSISTANT_BASE_URL`; no se ejecutó contra contenedores/Atlas reales.

  ```sh
  PYTHONPATH=/tmp/news-editorial-isolated/backend /tmp/news-editorial-venv/bin/python \
    -m pytest -c /tmp/news-editorial-isolated/backend/assistant/pyproject.toml \
    /tmp/news-editorial-isolated/backend/news/tests \
    /tmp/news-editorial-isolated/backend/assistant/tests -q --tb=short
  ```

- `cd frontend && npm test`: **75 passed**, 11 archivos.
- `cd frontend && npm run typecheck`: correcto.
- Exports con `CI=1 EXPO_NO_DOTENV=1`: web mediante `npm run export:web -- --output-dir
  /tmp/news-editorial-final-web-export`; iOS mediante `npx expo export --platform ios
  --output-dir /tmp/news-editorial-final-ios-export`. Ambos correctos; no son builds nativos
  instalados ni pruebas de Expo Go.
- Navegador Chromium con componentes reales, fuentes del proyecto, fixtures de red/Firebase
  y sin iconos en el harness: 375×812, 844×390 y 1280×900, movimiento reducido. Sin errores
  JS ni overflow horizontal de página. Se comprobaron ranking, fuentes, declaración de
  imagen, alta de segunda fuente y desmarcado de revisión al editar. La inspección detectó
  que RN Web no exponía `accessibilityState.checked`; se añadió `aria-checked` y prueba.
  También `aria-expanded` para la explicación. Se compactó el panorama y se colocó tras
  la portada para conservar prominencia de la noticia principal.
- Evidencia temporal: `/tmp/news-editorial-preview/results.json`,
  `coverage-panel.png`, `provenance-panel.png`, capturas feed/detail/admin por anchura;
  scripts `build.cjs` y `check.cjs` en ese directorio. No contienen datos de usuarios reales.
- Ruff: pasan módulos nuevos, pruebas nuevas y los módulos/pruebas del assistant modificados.
  API/personalización conservan avisos de estilo preexistentes; no se aplicó el cambio sugerido
  de ValueError a TypeError que rompería el manejo de validación Pydantic.
- Scanner seguro: 8 pruebas propias correctas. Escaneo solo de archivos de texto modificados
  y nuevos; ningún secreto nuevo. Único hallazgo: regla `mongodb-uri` en un ejemplo ya existente
  de `backend/news/README.md`, comprobado contra HEAD sin reproducir el valor.
- `git diff --check`: correcto. Sin archivos staged.

## Trazabilidad DB

- [x] Modelos sincronizados: revisados; mismos campos/enums/relaciones. El request administrativo
  reutiliza el esquema, con controles de publicación en la API, sin migración ni ODM.
- [x] Documentación sincronizada: reglas de contenido, feed/chat, guía y seguimiento actualizados.
- [x] Diagrama sincronizado: estructura conservada; anotado el uso de embebidos existentes y
  metadatos de respuesta calculados, sin campos persistidos nuevos.
- [x] Tests sincronizados: almacenamiento simulado, frontera HTTP, ranking/panorama, chat y UI.
- [x] Makefile revisado: los comandos existentes siguen siendo suficientes; sin cambios.
- [x] Secrets/bootstrap revisados: no hay credenciales nuevas; `setup-keys` y `keys/README.md`
  no requieren cambios. No se abrió ni modificó contenido de `keys/`.
- Validators, índices, seeders, catálogos y TTL revisados: no afectados, sin cambios.

## Límites, pendientes y estado final

- Los cinco criterios están implementados localmente y cuentan con guía de demostración.
  No hay bloqueos de implementación ni decisiones estructurales pendientes para este alcance.
- Falta demostración con contenido real revisado, cuentas Firebase reales y dispositivos
  físicos. Las pruebas de navegador no prueban apariencia nativa ni autenticación/Atlas reales.
- El catálogo/dataset vigente puede no tener cobertura local o internacional; se muestran
  vacíos reales, sin ampliar catálogo ni sembrar noticias nuevas. Las noticias demo históricas
  son sintéticas y no deben presentarse como hechos verificados.
- La independencia real de fuentes, confirmación, tratamiento de contradicciones, derechos de
  imagen y decisión de publicar requieren criterio humano. Los mínimos técnicos no garantizan
  verdad ni detección de IA, emergencias o cobertura exhaustiva.
- Las reglas nuevas se aplican al flujo de creación actual; no reclasifican ni migran noticias
  publicadas anteriormente. La obtención/generación integrada de imágenes sigue siendo un
  requisito independiente pendiente, identificado en el seguimiento del punto 5.
- Sin llamadas reales a IA, operaciones Atlas, reseed, limpieza, cambios de secretos o
  despliegues. Sin cambios en los modos projection/novu del assistant.
- Commit/push: ninguno. Working tree con los archivos anteriores modificados/nuevos y el PDF
  del usuario sin seguimiento, todo fuera de staging. No se modificó historia Git.
- Para continuar: seguir `docs/reviews/transparencia-responsible-ai-demo.md`, preparar noticias
  revisadas de los alcances deseados y ejecutar la demostración humana; actualizar la evidencia
  con sus resultados reales antes de afirmar comprobación en dispositivos.
