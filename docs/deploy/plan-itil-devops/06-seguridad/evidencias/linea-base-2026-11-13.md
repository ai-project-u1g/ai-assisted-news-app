# Línea base de seguridad (13 de noviembre de 2026)

Estado del repositorio antes de agregar controles DevSecOps al pipeline. Sirve como punto de
comparación para medir el efecto de los controles.

## Alcance y método

- Commit analizado: `871bb90` (`main`).
- Se analizó una exportación de los archivos versionados (`git archive HEAD`). Así ningún escáner
  lee `keys/` ni archivos `.env` locales.
- Todas las herramientas se ejecutaron en contenedores Docker, sin instalar nada en el equipo.

| Herramienta | Contenedor | Qué revisa |
| --- | --- | --- |
| Trivy `fs` | `aquasec/trivy` | Dependencias con lockfile, configuración de Dockerfiles y secretos en archivos |
| pip-audit | `python:3.13-slim` | Dependencias Python declaradas en `requirements.txt` |
| gitleaks `git` | `zricethezav/gitleaks` | Secretos en todo el historial git (59 commits), con salida redactada |

## Configuración del repositorio en GitHub

| Control | Estado |
| --- | --- |
| Repositorio | Público, organización `ai-project-u1g` |
| Protección de `main` | No configurada |
| Secret scanning y push protection | Desactivados |
| Dependabot security updates | Desactivado |
| Análisis de seguridad en `.github/workflows/deploy.yml` | Ninguno |

## Hallazgos

### Dependencias del frontend (`frontend/package-lock.json`)

26 vulnerabilidades: 1 crítica, 9 altas, 10 medias, 6 bajas.

| Paquete | Versión | Severidad máxima | Versión corregida | Lo trae |
| --- | --- | --- | --- | --- |
| shell-quote | 1.10.0 | Crítica | 1.11.0 | `react-devtools-core` |
| node-forge | 1.4.0 | Alta (18 CVE) | 1.4.3 | `@expo/cli`, `@expo/code-signing-certificates` |
| source-map-js | 1.2.1 | Alta | 1.2.2 | `postcss` |
| glob | 13.0.6 | Media | 14.0.2 | `@expo/cli`, `@expo/config` |
| minimatch | 10.2.6 | Media | 11.0.1 | `@expo/fingerprint`, `glob` |
| uuid | 7.0.3 | Media | 11.1.1 | `@expo/ngrok`, `xcode` |

Todas son dependencias transitivas de herramientas de desarrollo y build de Expo. No las importa
el código de la app.

`Referncias/package-lock.json` tiene hallazgos similares (31). Es código de referencia, no
forma parte de la app desplegada.

### Dependencias del backend

- `backend/news` y `backend/assistant`: pip-audit no encontró vulnerabilidades conocidas.
- Riesgo: los `requirements.txt` usan rangos (`>=x,<y`) sin lockfile. Cada build puede
  instalar versiones distintas, y Trivy no puede evaluarlas sin versiones fijas.

### Secretos en el historial git

| Regla | Archivo | Commit | Evaluación |
| --- | --- | --- | --- |
| `generic-api-key` | `docs/api/README.md` | `1a4860f` | Falso positivo: ejemplo truncado de un `id_token` en la documentación |
| `gcp-api-key` | `frontend/google-services.json` | `27f8cec` | API key de Firebase para Android. Va pública dentro del APK por diseño. Se mitiga restringiéndola en la consola de Google Cloud |

No hay archivos de `keys/` ni `.env` en el historial.

### Configuración de contenedores

- Los tres Dockerfiles ejecutan con usuario sin privilegios (`USER nobody` o `USER node`).
- Trivy solo reporta la ausencia de `HEALTHCHECK` (severidad baja) en `backend/news/Dockerfile` y
  `frontend/Dockerfile`. En Cloud Run, los health checks se configuran en el servicio.

### Imágenes de contenedor publicadas en Cloud Run

Las imágenes se construyeron igual que en `deploy/gcp/deploy.sh` (líneas 32 y 33), a partir de la
exportación limpia, y se analizaron con `trivy image`. Ninguna se publicó.

| Imagen | Sistema base | Paquetes del SO | Paquetes Python | Secretos |
| --- | --- | --- | --- | --- |
| `news-api` | Debian 13.7 (`python:3.13-slim`) | 209 (49 altas), 3 con corrección | 8 (5 altas), todas con corrección | 0 |
| `news-chatbot` | Debian 13.7 (`python:3.13-slim`) | 209 (49 altas), 3 con corrección | 8 (5 altas), todas con corrección | 0 |

Hallazgos que se pueden corregir:

| Paquete | Versión | Severidad máxima | Versión corregida | Origen |
| --- | --- | --- | --- | --- |
| urllib3 | 2.7.0 | Alta | 2.8.0 | Dependencia transitiva de `google-auth[requests]` |
| msgpack | 1.1.2 | Alta | 1.2.3 | Dependencia transitiva |
| setuptools | 70.3.0 | Alta | 84.1.0 | Incluido en la imagen base |
| zlib1g | 1.3.1-1+b1 | Alta | 1.3.1-1+deb13u1 | Paquete del SO en la imagen base |

Observaciones:

- La mayoría de las vulnerabilidades del sistema operativo todavía no tienen corrección de Debian.
  Se aceptan como riesgo residual y se revisan en cada build.
- pip-audit sobre `requirements.txt` no reportó estas versiones de Python; el análisis de la
  imagen construida sí las encontró. Por eso el pipeline analiza el artefacto que se despliega y no
  solo los archivos de dependencias.
- `backend/news/Dockerfile` instala `requirements-dev.txt` (pytest y herramientas de prueba) en la
  imagen de producción y copia todo `backend/`. Eso agrega superficie de ataque que no se necesita.
