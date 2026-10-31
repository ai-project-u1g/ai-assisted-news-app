# Compatibilidad de los cambios editoriales con el despliegue de main

Fecha: 2026-10-30.

## Objetivo

Revisar si los cambios de transparencia editorial y biblioteca de imágenes del frontend,
API y chat pueden publicarse con la arquitectura existente de `main`, especialmente su
persistencia MongoDB. Revisión autorizada; no se solicitó desplegar, hacer push ni operar Atlas.
Se consultaron los handoffs editorial y de biblioteca y el diseño de `docs/design/database/`.
Se aplicaron las skills locales de revisión, diagnóstico y seguridad ya leídas.

## Conclusión y arquitectura revisada

No se encontraron incompatibilidades de despliegue en los cambios revisados.

- Referencia local: `main`, HEAD `9629e3ec797706435d3911738828fefdf0cfa660`.
- El workflow de ese mismo commit terminó correctamente el 24 de octubre de 2026:
  [run 40135132051](https://github.com/ai-project-u1g/ai-assisted-news-app/actions/runs/40135132051).
  Se comprobaron los jobs `test`, `frontend` y `deploy`, incluidos APK, Cloud Run y Hosting.
  Es evidencia del pipeline existente; los cambios locales de esta revisión no están publicados.
- El workflow, Dockerfiles, scripts de despliegue, dependencias y configuración no cambian.
  Los contextos Docker incluyen los módulos nuevos de news y los cambios del chat.
- La API y el chatbot conservan sus dos servicios Cloud Run y la conexión a `ai_assisted_news`.
  Se mantiene el montaje existente de la credencial MongoDB desde Secret Manager. No se
  requieren secretos, variables, servicios, dependencias ni permisos IAM adicionales.
- Firebase Hosting recompila el cliente utilizando las URLs de Cloud Run resueltas por el
  script actual. La validación frontend usa Node 24 y el backend usa Python 3.13.
- El paso de APK sigue ejecutándose antes de Cloud Run y Hosting: un fallo de ese paso
  impediría continuar el despliegue, como ya ocurre en el workflow actual. No se ejecutó EAS
  durante esta revisión.

## MongoDB: qué se despliega y qué permanece

Los cambios son de lógica y presentación. Los modelos, validators, índices, TTL, catálogos,
seeders y bootstrap existentes no se modificaron respecto a HEAD. Se reutilizan `news.image`,
`news.sources`, `news.verification` y `news.aiAssistance`. La biblioteca está en código;
no crea otra colección. La puntuación del feed se calcula en respuesta y no se persiste.

La publicación en Cloud Run actualiza el código. No sube la base local, no vuelve a insertar
noticias demo y no ejecuta migraciones o reseeds sobre Atlas. Las publicaciones nuevas se
guardan con el contrato existente. No hace falta inicializar de nuevo la base para este cambio.

Se verificó ese contrato con MongoDB 8.0 real temporal: bootstrap reproducible, validators,
índices, fechas BSON de las fuentes y revisión, metadatos de imagen, publicación revisada,
rechazo sin revisión, feed, panorama territorial y cita del chat. No se consultó Atlas;
por ello no se auditó deriva manual del esquema, conectividad actual ni permisos de producción.

El formulario nuevo cumple la revisión editorial exigida por la API. Un cliente administrativo
antiguo que intente publicar sin esos datos recibe 422; debe usarse el frontend actualizado.
El workflow ya publica API/chat antes de Hosting. La lectura de noticias conserva compatibilidad.

## Cambios realizados en esta revisión

- `tests/integration/test_news_shared_contract.py`: amplía el test existente que ejecuta
  `make news-integration-test` en main. Inserta la publicación revisada con una imagen real
  del catálogo y fuentes sintéticas, comprueba los tipos BSON y su consumo por API y chat.
  Usa tokens de prueba y proveedor `stub`; no descarga fotos ni llama a IA.
- `tests/integration/README.md`: documenta la cobertura añadida.
- Este handoff. No se cambiaron archivos de producción ni el índice Git preparado por el usuario.

## Comandos y resultados

- Lecturas acotadas y `git diff HEAD` de modelos, schema, dependencias, configuración,
  Makefile, Dockerfiles y pipeline: sin diferencias estructurales que requieran despliegue DB.
- Consulta pública de GitHub y de los jobs del run citado: todos correctos.
- Comando de CI `python -m pytest -q assistant/tests news/tests`, ejecutado en un contenedor
  Python 3.13 sin red, sin `keys/` ni configuración local: **429 passed, 1 skipped**.
  El mismo comando también pasó en una copia temporal sin `.env` ni `keys/` en el host.
- `python3 -m unittest discover -s tests/unit -p test_deploy_scripts.py -v`: **9 passed**.
- `bash scripts/news-integration-test.sh`: **1 passed**, con MongoDB 8.0 efímera en tmpfs,
  red Docker interna, bootstrap canónico y flujo nuevo completo. El harness retiró únicamente
  sus propios contenedores y red. Sin Atlas, volúmenes reales ni credenciales externas.
- `docker build -f backend/news/Dockerfile ... .`: correcto.
- `docker build -f backend/assistant/Dockerfile --target runtime ... backend`: correcto.
- `docker build -f frontend/Dockerfile ... frontend`: correcto, base Node 24.
- Host: `npm run typecheck` correcto y `npm test`: **81 passed**, 11 archivos.
- Contenedor Node 24 sin red ni configuración local: `npm run typecheck`, `npm test`
  (**81 passed**) y `npm run export:web -- --output-dir /tmp/news-deploy-export`: correctos.
- Ruff sobre el test modificado: correcto. `git diff --check` acotado a los archivos de
  esta revisión: correcto. El PDF ya staged contiene espacios finales; no se alteró y
  el workflow no utiliza ese chequeo como condición de publicación.
- Escáner seguro sobre `tests/integration/`: único hallazgo `mongodb-uri` en la línea 23
  del test, preexistente y correspondiente a la URI del contenedor temporal generado por
  el harness. No contiene credenciales y solo admite hosts con prefijo de prueba.

Logs y plan temporales fuera de Git: `/tmp/news-deploy-compatibility-plan.md`,
`/tmp/news-deploy-python313-tests.log`, `/tmp/news-deploy-chatbot-build.log`,
`/tmp/news-deploy-frontend-build.log` y `/tmp/news-deploy-node24-checks.log`.

## Trazabilidad DB

- [x] Modelos sincronizados: revisados, sin cambios de estructura.
- [x] Documentación sincronizada: diseño vigente revisado; cobertura y handoff actualizados.
- [x] Diagrama sincronizado: revisado, sin relaciones o colecciones nuevas.
- [x] Tests sincronizados: publicación y lectura verificadas contra MongoDB real temporal.
- [x] Makefile revisado: el comando de integración y el job actuales incluyen el test ampliado.
- [x] Secrets/bootstrap revisados: sin credenciales nuevas ni cambios requeridos; no se leyó `keys/`.
- Validadores, índices, TTL y seeders: revisados, sin cambios.

## Estado final y siguiente paso

Sin bloqueos de código detectados y sin decisiones de arquitectura pendientes. Se conservaron
los cambios previos del usuario en staging; los cambios de esta revisión quedan sin stage.
No se creó commit, no se hizo push, no se publicó nada y no se modificó Atlas.

El siguiente paso del equipo es incluir estos cambios en un commit de main y dejar ejecutar
el workflow. Ese run verificará el código nuevo y publicará API, chat y frontend con la
configuración de producción ya existente; no requiere un procedimiento separado para MongoDB.
