# Plan de ITIL y DevOps

**Proyecto:** AI-Assisted News App: aplicación de noticias por país y tema con un asistente conversacional de IA, publicada en web, Android y Google Cloud.

**Curso y grupo:** Administración y Mantenimiento de Sistemas, Universidad del Valle de Guatemala. Grupo 5.

**Integrantes**

| **Nombre completo** | **Carnet** |
| --- | :---: |
| Mathew Alexander Cordero Aquino | 22982 |
| Pedro Pablo Guzmán Mayen | 22111 |
| Gustavo Adolfo Cruz Bardales | 22779 |
| Josué Say | 22801 |
| José Gramajo | 22907 |

**Fecha:** 13 de noviembre de 2026

**Repositorio:** <https://github.com/ai-project-u1g/ai-assisted-news-app>

**Descripción del proyecto:** La app muestra noticias por país y por 14 temas, con fuentes citadas, y un chatbot que responde con datos de la base y cita las noticias que usa. El frontend es una app Expo (React Native) que se publica como web en Firebase Hosting y como APK de Android con EAS Build. El backend son dos servicios FastAPI, `news-api` y `news-chatbot`, en Cloud Run (`us-east4`), con MongoDB Atlas como base de datos y OpenAI como proveedor del modelo.

**Objetivo del plan:** Que cada cambio llegue a producción probado, seguro, trazable y con costo controlado, sin pasos manuales. Lo medimos con cinco indicadores: pruebas aprobadas en cada pull request, tasa de éxito del pipeline, alertas de seguridad abiertas, cumplimiento de Conventional Commits y costo mensual en USD frente al presupuesto.

**Resumen del estado**

| No. | Componente | Estado | Responsable | Detalle |
| :---: | --- | --- | --- | --- |
| 1 | Integración continua (CI) | Implementado | Gustavo Adolfo Cruz Bardales | [01-ci](01-ci/README.md) |
| 2 | Despliegue continuo (CD) | Implementado, con mejoras en proceso | Pedro Pablo Guzmán Mayen | [02-cd](02-cd/README.md) |
| 3 | Pruebas automatizadas | Implementado | Gustavo Adolfo Cruz Bardales | [03-pruebas](03-pruebas/README.md) |
| 4 | Gestión de configuración | En proceso | Mathew Alexander Cordero Aquino | [04-configuracion](04-configuracion/README.md) |
| 5 | Gestión de versionamiento con Git | Implementado | José Gramajo | [05-git](05-git/README.md) |
| 6 | Gestión de seguridad (DevSecOps) | Implementado | Josué Say | [06-seguridad](06-seguridad/README.md) |
| 7 | Gestión financiera (FinOps) | En proceso | Mathew Alexander Cordero Aquino | [07-finops](07-finops/README.md) |

Cada carpeta contiene el apartado completo con sus evidencias. Abajo va el resumen de cada componente.

# 1 Integración continua CI

**Herramienta y motivo de elección:** GitHub Actions. El código ya vive en GitHub, así que el flujo corre sin servidor propio ni costo adicional, y queda versionado junto al código en `.github/workflows/deploy.yml`.

**Implementación:** Se activa en cada pull request, en cada push a `main` y de forma manual. Corre dos jobs en paralelo: `test` (Python 3.13: pytest de los servicios, contrato de los scripts de despliegue e integración con MongoDB efímera) y `frontend` (Node 24: `npm ci`, revisión de tipos con TypeScript, Vitest y export web). El despliegue depende de ambos.

**Estado y resultado:** Implementado. En `main` (commit `6b1c02a`) pasaron 430 pruebas de backend, con 1 omitida, y 81 de frontend; `test` y `frontend` terminaron en verde en 64 y 47 segundos. El CI rechazó 2 pull requests de Dependabot antes de que llegaran a `main`.

**Responsable y fecha:** Gustavo Adolfo Cruz Bardales, 13 de noviembre de 2026.

**Evidencia:** [01-ci/evidencias](01-ci/evidencias/): captura de los jobs en verde y resumen del workflow.

# 2 Despliegue continuo CD

**Plataforma y motivo de elección:** GitHub Actions orquesta; Cloud Run aloja `news-api` y `news-chatbot` (escala a cero y conserva cada revisión para volver atrás); Firebase Hosting publica la web con CDN y HTTPS; EAS Build compila el APK; Workload Identity Federation da credenciales de corta duración sin llaves JSON en GitHub.

**Implementación:** Un push a `main` (merge de un PR) o la ejecución manual dispara el job `deploy` en el entorno `production`, que solo acepta `main`. Antes de publicar deben pasar `test`, `frontend` y `check-ci-config.sh`. En un PR solo corren las pruebas; nunca se publica.

**Estado y resultado:** Implementado desde el 20 de octubre de 2026. Mejoras del 13 de noviembre: filtro de rutas, para que los cambios de documentación no redesplieguen (16 de 24 pushes a `main` lo hacían sin cambiar la app); verificación posterior al despliegue con `make deploy-smoke`; y procedimiento documentado para volver atrás. Tasa de éxito del pipeline: 82 % (9 de 11). Sitio: <https://adfasdfasfd-1899a.web.app>.

**Responsable y fecha:** Pedro Pablo Guzmán Mayen, 13 de noviembre de 2026.

**Evidencia:** [02-cd/evidencias](02-cd/evidencias/): línea base, ejecuciones exitosa y fallida, entorno `production`, revisiones de Cloud Run y la app funcionando.

# 3 Pruebas automatizadas con Jest

| **No.** | **Función y caso probado** | **Resultado esperado** | **Resultado obtenido** |
| :---: | --- | --- | --- |
| 1 | `shortArticleReadComplete`: artículo corto visible completo con 4 y con 5 segundos de lectura | Falso con 4 s, verdadero con 5 s; falso si el artículo no se ve completo | Cumplido |
| 2 | `estimate_reading_minutes`: 0, 150, 200 y 300 palabras | 1, 1, 1 y 2 minutos, redondeando hacia arriba | Cumplido |
| 3 | `readConversations`: una conversación vigente, una vencida y una de otro usuario | Solo la conversación vigente del usuario actual | Cumplido |

**Ejecución e integración:** `npm test` en el frontend (Vitest) y `pytest assistant/tests news/tests` en el backend. Los mismos comandos corren en los jobs `frontend` y `test` en cada PR y push a `main`, y bloquean el despliegue si fallan.

**Estado y decisión:** Implementado: 81 pruebas en 11 archivos de frontend y 430 en backend. Se eligieron funciones puras con reglas visibles para el usuario. Usamos Vitest porque el frontend es un proyecto Expo con TypeScript y Vitest ofrece la misma sintaxis de Jest (`describe`, `it`, `expect`).

**Responsable y fecha:** Gustavo Adolfo Cruz Bardales, 13 de noviembre de 2026.

**Evidencia:** [03-pruebas/evidencias](03-pruebas/evidencias/): capturas de Vitest (81 aprobadas) y pytest (430 aprobadas) y sus salidas completas.

# 4 Gestión de configuración

**Configuración local y en la nube:** `.env.example` y `frontend/.env.example` documentan las variables sin valores: modo de MongoDB (`NEWS_DB_MODE`), base, puertos, URLs de la API y el chat, proveedor del chatbot (`CHATBOT_PROVIDER`) y variables públicas de Firebase. En la nube, las variables viven en el entorno `production` de GitHub y en `deploy/gcp/config.sh`, y los secretos de MongoDB y OpenAI en Secret Manager.

**Decisión y separación de entornos:** Desarrollo usa `.env` y MongoDB local por defecto; Atlas se elige explícitamente. Producción usa Firebase Hosting, Cloud Run y la base `ai_assisted_news` en Atlas, sin cargar el `.env` raíz, para no enviar puertos ni URLs locales a producción.

**Estado y resultado:** En proceso. La separación de entornos está verificada y las capturas muestran variables y nombres de secretos sin valores. Queda pendiente comprobar en consola las variables efectivas de los servicios Cloud Run.

**Responsable y fecha:** Mathew Alexander Cordero Aquino, 13 de noviembre de 2026.

**Evidencia:** [04-configuracion/evidencias](04-configuracion/evidencias/): `.env.example`, `.gitignore`, entorno `production` y Secret Manager.

# 5 Gestión de versionamiento con Git

**Prácticas aplicadas:** GitHub Flow (`main` estable y ramas por funcionalidad), integración por pull request con los workflows `deploy` y `security` en verde, Conventional Commits (regla escrita en `AGENTS.md`), infraestructura y documentación versionadas, y secretos fuera del historial con `.gitignore`. Desde el 13 de noviembre, el ruleset `main-protegida` exige PR con una aprobación de otra persona, revisión de code owners y checks en verde. El procedimiento documentado es: rama propia, PR hacia `main`, checks en verde, revisión formal de otra persona (**Approve** o **Request changes**) y merge por quien revisa.

**Decisión:** GitHub Flow, porque hay un solo entorno productivo que se despliega de forma continua desde `main`. Git Flow agrega ramas `develop` y `release` que solo se justifican con varias versiones en paralelo.

**Estado y resultado:** Implementado. 10 pull requests integrados hasta el #11 al momento del análisis; 68 % de los commits cumple Conventional Commits. Brechas: no hay tags ni releases y parte de los commits no sigue la convención. La falta de protección de `main` ya se resolvió.

**Responsable y fecha:** José Gramajo, 13 de noviembre de 2026.

**Evidencia:** [05-git/evidencias](05-git/evidencias/): `git log --graph`, la pestaña de pull requests y el formulario de revisión del PR #53; ejemplo de PR integrado: [#12](https://github.com/ai-project-u1g/ai-assisted-news-app/pull/12).

# 6 Gestión de seguridad DevSecOps

**Riesgo identificado:** Dependencias vulnerables, secretos expuestos en un repositorio público, código inseguro, configuración insegura de la API en ejecución, imágenes con más de lo necesario y cambios sin revisión.

**Control y herramienta:** Workflow propio `security.yml`, en cada PR, en `main` y cada semana: CodeQL (SAST), gitleaks y secret scanning con push protection (secretos), Trivy, pip-audit y Dependabot (dependencias), Trivy image sobre lo que se despliega, OWASP ZAP (DAST) contra la API levantada, WIF y Secret Manager para credenciales, y el ruleset `main-protegida` con `CODEOWNERS`.

**Estado y resultado:** Implementado. Checks de `security` de 3 en rojo a 7 de 7 en verde; code scanning de 18 alertas altas a 0; Dependabot de 78 alertas a 0 (2 riesgos aceptados con justificación); secret scanning de 1 a 0.

**Responsable y fecha:** Josué Say, 13 de noviembre de 2026.

**Evidencia:** [06-seguridad/evidencias](06-seguridad/evidencias/): alertas antes y después, code scanning, Dependabot y reportes de DAST.

# 7 Gestión financiera FinOps

**Moneda y período:** USD, del 1 al 31 de octubre de 2026. Los costos actuales son reales; los propuestos son un escenario estimado para el mismo volumen de uso.

| **Servicio o recurso** | **Costo actual** | **Costo propuesto** |
| --- | --- | --- |
| Google Cloud, proyecto de la app | USD 2.15 | USD 2.15 |
| API de OpenAI, app de noticias | USD 1.54 | USD 1.39 |
| Total | USD 3.69 | USD 3.54 |

**Medida de ahorro y decisión:** Ya implementado: Cloud Run con cero instancias mínimas y máximo de dos; presupuesto de USD 25 en Google Cloud con avisos al 50 %, 90 % y 100 %; límite de 1,600 tokens de salida por respuesta; presupuesto acumulado de IA de USD 20; y respuestas factuales desde MongoDB sin llamar al modelo. Propuesto: un piloto para bajar 10 % el gasto de OpenAI.

**Estado e impacto:** En proceso. Ahorro estimado de USD 0.15 en un período comparable (4.1 %), todavía sin medir.

**Responsable y fecha:** Mathew Alexander Cordero Aquino, 13 de noviembre de 2026.

**Evidencia:** [07-finops](07-finops/README.md): reportes de consumo y controles en el código.

# Relación con ITIL

**Prácticas de ITIL y aplicación concreta:**

| Práctica de ITIL 4 | Cómo la aplicamos |
| --- | --- |
| Habilitación del cambio | Todo cambio entra por pull request con pruebas, controles de seguridad y una aprobación (ruleset `main-protegida`). Los cambios en la nube, como la restricción de la API key de Firebase, siguen riesgo, reversa, autorización, verificación y cierre. |
| Gestión de liberaciones y despliegue | CD automático desde `main` al entorno `production`, verificación posterior y procedimiento para volver atrás. |
| Gestión de la configuración del servicio | Variables por entorno, secretos en Secret Manager e infraestructura como código en el repositorio. |
| Seguridad de la información | Controles automáticos en cada cambio y gestión de vulnerabilidades con riesgos aceptados y justificados. |
| Gestión financiera de servicios | Costos reales por proveedor, presupuestos con alertas y límites de uso de la IA. |
| Mejora continua | Cada apartado mide un antes y un después y deja propuestas priorizadas con responsable y plazo. |

Estas prácticas apoyan la gestión de cambios (nada llega a producción sin revisión ni pruebas), la calidad del servicio (pruebas, verificación posterior y escaneo de seguridad antes de publicar) y la mejora continua (indicadores medidos y propuestas priorizadas).

**Seguimiento:**

| Indicador | Meta | Revisa | Frecuencia |
| --- | --- | --- | --- |
| Tasa de éxito del pipeline | 90 % o más | Pedro Pablo Guzmán | Semanal |
| Pruebas aprobadas en cada PR | 100 % | Gustavo Cruz | En cada PR |
| Alertas de seguridad abiertas sin justificar | 0 | Josué Say | Semanal (escaneo de los lunes) |
| Commits con Conventional Commits | 90 % o más | José Gramajo | Mensual |
| Costo mensual frente al presupuesto | Por debajo de USD 25 | Mathew Cordero | Mensual |

# Análisis y reflexión

**1. ¿Cuáles son las principales ventajas obtenidas con las prácticas implementadas?**

- **Confianza en cada cambio.** Más de 500 pruebas corren en cada PR, y el CI ya detuvo PRs de Dependabot que habrían roto el frontend.
- **Despliegues sin pasos manuales.** Publicar es integrar a `main`: el pipeline publica backend, web y APK, y ahora verifica el resultado.
- **Seguridad medible.** En un día se pasó de 78 alertas de Dependabot, 18 de code scanning y 1 de secretos a 0 abiertas. Analizar la imagen desplegada encontró vulnerabilidades que el análisis de archivos no veía.
- **Trazabilidad.** Cada cambio queda en un PR revisado, con mensaje convencional y checks registrados.
- **Costo controlado.** La operación de octubre costó USD 3.69 gracias al escalado a cero, los presupuestos con alertas y el límite de tokens.

**2. ¿Cuáles fueron los retos o dificultades más importantes durante su implementación?**

- **Coordinar ramas en paralelo.** Varias funcionalidades a la vez obligaron a reintegrar `main` y resolver conflictos; un cambio llegó a entrar sin PR antes de proteger la rama.
- **Falsos positivos y ruido.** gitleaks marcó como secreto un nombre temporal de contenedor, y la primera corrida de Dependabot abrió 23 PRs con saltos mayores. Se resolvió con excepciones por patrón y actualizaciones agrupadas.
- **Dependencias atadas a la plataforma.** `minimatch` y `uuid` solo se corrigen en versiones incompatibles con Expo 57; se aceptaron como riesgo justificado.
- **Despliegues innecesarios.** 16 de 24 pushes a `main` redesplegaban sin cambiar la app; se corrigió con un filtro de rutas.
- **Configurar la nube y coordinar accesos.** Workload Identity, Secret Manager y la API key de Firebase dependían del proyecto de Google Cloud de un integrante y de su autorización.

**3. ¿Qué mejoras implementarían para evolucionar su solución?**

| Prioridad | Mejora | Enfoque | Responsable | Plazo |
| :---: | --- | --- | --- | --- |
| 1 | Alertas de Cloud Monitoring por errores, picos de 401 y 429 y costo del chat, con rate limit en `/chat` | DevSecMonOps, monitoreo y FinOps | Josué Say y Mathew Cordero | 2 semanas |
| 2 | Medir el piloto de ahorro de OpenAI y un tablero mensual de costo por servicio | FinOps | Mathew Cordero | 1 mes |
| 3 | Reducir el lead time de 13 a 14 minutos, compilando el APK solo cuando cambie el frontend | Automatización | Pedro Pablo Guzmán | 2 semanas |
| 4 | Tags SemVer y releases automáticos con CHANGELOG, y commitlint para validar la convención | Automatización | José Gramajo | 1 semana |
| 5 | Desactivar `/docs` y `/openapi.json` en producción | DevSecOps | Josué Say | 1 semana |
| 6 | Pruebas end-to-end del flujo de lectura y chat | Calidad | Gustavo Cruz | 1 mes |
| 7 | SBOM y firma de imágenes en Artifact Registry | Cadena de suministro | Josué Say | 1 mes |

El detalle por componente está en [09-reflexion](09-reflexion/README.md) y en la sección de propuestas de cada carpeta.

# Presentación grupal

**Enlace:** [10-presentacion/presentacion.pdf](10-presentacion/presentacion.pdf) · versión navegable: [presentacion.html](10-presentacion/presentacion.html) · guion: [guion.md](10-presentacion/guion.md)

# Evidencias adicionales

| Apartado | Evidencia | Qué demuestra |
| --- | --- | --- |
| CI | [01-ci/evidencias](01-ci/evidencias/) | Jobs `test` y `frontend` en verde |
| CD | [02-cd/evidencias](02-cd/evidencias/) | Línea base y despliegues exitoso y fallido |
| Pruebas | [03-pruebas/evidencias](03-pruebas/evidencias/) | 430 pruebas de backend y 81 de frontend aprobadas |
| Configuración | [04-configuracion/evidencias](04-configuracion/evidencias/) | Variables y secretos sin valores |
| Git | [05-git/evidencias](05-git/evidencias/) | Historial de ramas y pull requests |
| Seguridad | [06-seguridad/evidencias](06-seguridad/evidencias/) | Alertas antes y después, DAST |
| FinOps | [07-finops](07-finops/README.md) | Costos reales de octubre y controles |
