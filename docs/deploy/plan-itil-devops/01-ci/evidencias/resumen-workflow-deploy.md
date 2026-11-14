# Resumen del workflow deploy, jobs de CI

Commit analizado: `6b1c02a`, rama `main`, 13 de noviembre de 2026.
Archivo: [`.github/workflows/deploy.yml`](../../../../../.github/workflows/deploy.yml).

## Eventos que lo activan

| Evento | Qué corre |
| --- | --- |
| `pull_request` | Jobs `test` y `frontend` |
| `push` a `main` | Jobs `test` y `frontend`, después `deploy` |
| `workflow_dispatch` | Igual que un push a `main` |

Concurrencia: grupo `deploy-${{ github.ref }}` con `cancel-in-progress: false`. Dos ejecuciones sobre la misma rama se encolan.

## Job test

Corre en `ubuntu-latest` con Python 3.13 y caché de pip.

| Paso | Comando |
| --- | --- |
| Dependencias | `pip install -r backend/assistant/requirements-dev.txt -r backend/news/requirements-dev.txt` |
| Pytest backend | `python -m pytest -q assistant/tests news/tests`, desde `backend` |
| Contrato de scripts de deploy | `make deploy-test`, sin nube ni secretos |
| Integración feed, perfil y chat | `make news-integration-test`, contra una MongoDB efímera en una red Docker interna |

## Job frontend

Corre en `ubuntu-latest` con Node 24 y caché de npm, desde la carpeta `frontend`, con `EXPO_NO_DOTENV=1`.

| Paso | Comando |
| --- | --- |
| Instalación | `npm ci` |
| Tipos | `npm run typecheck`, que ejecuta `tsc --noEmit` |
| Pruebas | `npm test`, que ejecuta `vitest run` |
| Export web | `npm run export:web`, sin publicar |

## Relación con el despliegue

El job `deploy` declara `needs: [test, frontend]` y solo corre en `refs/heads/main` con un evento distinto de `pull_request`. Si `test` o `frontend` fallan, no se publica nada.

## Última ejecución consultada

Ejecución [43552233962](https://github.com/ai-project-u1g/ai-assisted-news-app/actions/runs/43552233962), push a `main` del commit `d6dc563`, consultada en la API pública de GitHub:

| Job | Resultado | Duración |
| --- | --- | --- |
| `frontend` | success | 47 s |
| `test` | success | 64 s |

La ejecución del commit `6b1c02a` estaba en cola al momento de la consulta.
