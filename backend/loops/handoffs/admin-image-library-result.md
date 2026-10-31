# Biblioteca administrativa de imágenes y acceso web móvil

Fecha: 2026-10-30.

## Objetivo y alcance autorizado

Completar únicamente el punto 1 de la revisión integral: obtener una imagen desde el flujo
administrativo, previsualizarla, revisar su procedencia/derechos y adjuntarla sin perder el texto.
El usuario añadió el punto 2 con alcance documental: usar la web en el teléfono y compartir su
enlace directo, porque el equipo no desarrolla para iPhone. No se implementaron los demás puntos.

Se leyó `editorial-transparency-result.md`, el diseño vigente de contenido e imágenes y las
skills planning-with-files, TDD, ui-ux-pro-max, systematic-debugging, code-reviewer y seguridad.
Plan fuera de Git: `/tmp/news-image-picker-plan.md`. Se conservaron los cambios editoriales previos.

## Cambios y decisiones

- Se eligió **obtener desde biblioteca**: seis fotografías contextuales de Commons ya revisadas
  en el proyecto. No se genera una imagen nueva ni se llama a IA; no se agregan secretos,
  dependencias, almacenamiento ni esquema MongoDB.
- `backend/news/image_library.py` reutiliza metadatos de assets de `demo_images.py`, sin copiar
  contenido ficticio de noticias. Conserva URL, crédito, página de origen y licencia; sustituye
  el pie específico de demo por una advertencia de que no documenta el hecho de esta noticia.
- `GET /admin/image-library` exige autenticación y rol admin. `?topic=` filtra por categoría;
  categoría desconocida devuelve 400 y ausencia de candidatas devuelve lista vacía. La selección
  del catálogo no escribe noticias ni auditorías, ni registra `aiUsage`.
- `ImageLibraryPicker` permite obtener, ampliar a toda la biblioteca y previsualizar. Muestra
  autoría, licencia y página original. Exige carga correcta y revisión explícita para adjuntar.
  Cancelar, fallo o respuesta tardía conserva el texto y la imagen anterior.
- Al aceptar se actualizan juntos URL/tipo/alt/crédito/derechos/disclosure del formulario.
  Se invalida la revisión editorial general. La publicación conserva las reglas existentes.
- La imagen se persiste por el endpoint de creación existente, en `news.image`, con metadatos
  exactos. Las candidatas son fotografías de contexto; su pertinencia la decide una persona.
- Para iPhone se documentó el acceso por navegador en `docs/deploy/acceso-web-movil.md`, con
  enlaces a aplicación, chat, feed y panel. El dominio procede del Project ID público del
  archivo Google Services del proyecto; la raíz devolvió HTTP 200 y HTML en comprobación pública.
  No se ejecutó login real ni se desarrolló/distribuyó un build iOS.

## Archivos creados/modificados en este loop

- `backend/news/image_library.py` (nuevo), `backend/news/api.py`, `backend/news/README.md`.
- `backend/news/tests/test_image_library.py` (nuevo).
- `frontend/src/components/ImageLibraryPicker.tsx` (nuevo),
  `frontend/src/features/news/NewsFeedScreen.tsx`, `frontend/src/services/newsService.ts`,
  `frontend/tests/newsFeedReading.test.tsx`, `frontend/README.md`.
- `docs/deploy/acceso-web-movil.md` (nuevo), `docs/deploy/README.md`.
- `docs/design/database/14-biblioteca-administrativa.md` (nuevo),
  `02-criterios-de-contenido.md`, `07-diagrama.md`, `README.md` en el mismo directorio.
- `docs/reviews/alcance-pendiente-proyecto-2.md`, `transparencia-responsible-ai-demo.md`.
- Este handoff. Los archivos ya modificados por el loop editorial conservan ese trabajo.

## Comandos, pruebas y resultados

- `git status --short`, lecturas acotadas con `rg`/`sed`/`cat`, revisión de diffs.
- TDD: seis pruebas nuevas de pantalla fallaron primero por ausencia de **Obtener imagen**.
  Pasaron después de implementar obtención, revisión, cancelación, errores, vacío y respuesta tardía.
- Pruebas HTTP escritas antes de implementar. La ejecución inicial en sandbox se bloqueó en
  `TestClient.__enter__`; un diagnóstico con `faulthandler_timeout=8` y `timeout 20s` localizó el
  bloqueo en el portal de threads/asyncio, antes de invocar la ruta. La misma prueba fuera del
  sandbox pasó; no se cambió código de producto para eludir ese bloqueo.
- `PYTHON_DOTENV_DISABLED=1 /tmp/news-editorial-venv/bin/python -m pytest backend/news/tests -q
  --tb=short`: **301 passed**, fuera del sandbox por la restricción anterior. Todos los datos
  de API/DB son simulados, sin Atlas ni archivos secretos reales.
- `cd frontend && npm test`: **81 passed**, 11 archivos.
- `cd frontend && npm run typecheck`: correcto.
- Ruff en módulo y pruebas nuevos: correcto; imports ordenados y archivos nuevos formateados.
- `CI=1 EXPO_NO_DOTENV=1 npm run export:web -- --output-dir /tmp/news-image-library-web-export`:
  correcto, sin publicar ni incorporar configuración local.
- Revisión Chromium con componentes y fuentes reales, autenticación/API/imagen sustituidas por
  fixtures: **375×812, 844×390 y 1280×900**, movimiento reducido. Vista previa, revisión, adjunto,
  invalidación de revisión editorial y cancelación correctos; sin errores JS ni overflow horizontal
  de página. Se inspeccionó visualmente la captura de 375 px.
- Evidencia temporal: `/tmp/news-image-library-preview/results.json`, `picker-375.png`,
  `picker-844.png`, `picker-1280.png`; scripts `/tmp/news-image-library-build.cjs` y
  `/tmp/news-image-library-browser.cjs`. La revisión principal usó un candidato de prueba; no
  autentica fotos ni demuestra comportamiento físico de Safari.
- Se preparó una repetición visual con todos los candidatos para comprobar sus textos. **La
  revisión automática de permisos agotó el plazo y rechazó esa repetición antes de ejecutarla**.
  No indicó que la acción fuera insegura. Se conservan la revisión principal en tres tamaños
  y las suites completas ya aprobadas; no queda un bloqueo de implementación por esa repetición.
- Lectura pública de páginas originales de los seis assets: autoría/licencias contrastadas con
  los metadatos registrados. No se tomaron imágenes de noticias ni se generó una ilustración.
- Comprobación HTTP del portal: `https://adfasdfasfd-1899a.web.app/` respondió **200, text/html**.
  La herramienta web no pudo abrirlo; una petición pública directa confirmó la respuesta.
- Comprobación HTTP de recursos mediante el checker existente, sin descargar cuerpos:
  jardín/cancha/guitarra/bicicletas devolvieron **200 image/jpeg**; sala/estanterías devolvieron
  **429**. Esos límites del CDN se reportan como fallos, no como imágenes verificadas disponibles.
  La UI contempla este escenario y no permite aceptar una vista previa fallida; se puede
  reintentar, elegir otra imagen o cancelar y guardar el borrador.
- Escáner seguro sobre archivos de texto de los cambios, sin `keys/` ni `.env`: sin secretos
  nuevos. Permanece el ejemplo MongoDB de `backend/news/README.md` detectado antes de este loop.
- `git diff --check`: correcto. Índice Git vacío.

## Controles revisados

| Riesgo | Control y evidencia |
| --- | --- |
| Lector accede a funciones admin | Firebase y rol servidor; pruebas 401/403/200. |
| Candidata se adjunta sin revisión | Aceptación exige confirmación y preview cargado; prueba de pantalla. |
| Foto no disponible se persiste por selección | Error visible y botón deshabilitado; prueba de fallo de imagen. |
| Cancelación pierde texto o reemplaza imagen | Estado de candidata separado del formulario y respuestas tardías ignoradas; pruebas. |
| Foto contextual parece prueba del hecho | Pie explícito, fuente/licencia visibles y revisión de pertinencia humana. |

## Trazabilidad DB

- [x] Modelos sincronizados: sin campos/enums/referencias nuevos; candidato usa `Image` existente.
- [x] Documentación sincronizada: biblioteca, contenido, uso web, README y seguimiento.
- [x] Diagrama sincronizado: nota de catálogo en código y reutilización de `news.image`.
- [x] Tests sincronizados: autorización, metadatos, persistencia y flujo de selección.
- [x] Makefile revisado: comandos existentes suficientes; sin cambios.
- [x] Secrets/bootstrap revisados: no hay credenciales nuevas; sin cambios en `setup-keys`,
  configuración secreta o `keys/README.md`. No se leyó contenido de `keys/`.
- Validators, índices, TTL, catálogos DB y seeders: revisados como no afectados; no cambiaron.

## Estado final y siguiente paso

- Punto 1 implementado localmente; punto 2 documentado como acceso web, según instrucción humana.
- Sin decisiones estructurales pendientes ni bloqueos del alcance autorizado. La biblioteca es
  finita y contextual; no ofrece búsqueda libre ni generación de imágenes con IA.
- Los límites del CDN pueden impedir cargar candidatas concretas. No se garantiza disponibilidad
  permanente; el flujo falla de forma explícita y conserva el borrador.
- Sin nuevas llamadas IA, operaciones MongoDB/Atlas reales, reseeds, limpiezas, despliegues o
  cambios de autenticación. Sin desarrollo nativo iPhone ni trabajo sobre los demás pendientes.
- Commit/push: ninguno. Working tree conserva los cambios editoriales previos más estos archivos;
  todo fuera de staging. El PDF del usuario permanece sin seguimiento y sin modificar.
- Para ver el selector en la web compartida se debe publicar backend y frontend; ese despliegue
  queda a cargo del usuario junto con el resto de puntos que indicó que cubriría.
