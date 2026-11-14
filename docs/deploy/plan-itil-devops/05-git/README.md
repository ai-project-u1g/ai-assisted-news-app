# 5 Gestión de versionamiento con Git

**Estado:** Implementado. Las brechas detectadas tienen propuesta de mejora (ver al final).

**Prácticas aplicadas:**

- **Flujo de ramas GitHub Flow.** `main` es la rama estable y la única que publica a producción (Cloud Run y Firebase Hosting). Cada funcionalidad se desarrolla en una rama propia, por ejemplo `feat/news-chat`, `feat/database-seeding-and-automation` y `firebase`.
- **Integración por pull request.** Los cambios entran a `main` mediante PR. Los workflows de `deploy` y `security` ejecutan las pruebas y controles en cada PR; el despliegue ocurre únicamente después de integrar a `main`.
- **Conventional Commits.** La regla está escrita en `AGENTS.md`: *«Usar Conventional Commits siguiendo el estilo existente del repositorio»*. Se usan los tipos `feat`, `fix`, `docs` y `chore`, con alcance cuando aplica: `feat(deploy)`, `feat(news)`.
- **Todo como código.** Infraestructura (`docker-compose.yml`, `Makefile`, `deploy/gcp/`, `deploy/firebase/`), decisiones de arquitectura (ADR `docs/decisions/0001-api-principal-y-seguridad.md`), diagramas en Mermaid y el contrato API-frontend (`make news-contract-check`) viven en el repositorio.
- **Secretos fuera del historial.** `.gitignore` excluye `keys/*` y todos los `.env`, salvo la plantilla `.env.example`.
- **`main` protegida.** Desde el 13 de noviembre de 2026, el ruleset `main-protegida` exige pull request con una aprobación de otra persona, revisión de code owners, conversaciones resueltas y los checks de `security`, `test` y `frontend` en verde, y bloquea force push y borrado. Detalle y evidencias en [6 Gestión de seguridad](../06-seguridad/README.md#protección-de-main).

```mermaid
gitGraph
    commit id: "inicio"
    branch feat/news-chat
    commit id: "chat"
    commit id: "contrato"
    checkout main
    merge feat/news-chat id: "PR chat"
    branch feat/database-seeding-and-automation
    commit id: "seeders"
    checkout main
    merge feat/database-seeding-and-automation id: "PR seeding"
    branch firebase
    commit id: "FIX Caida"
    checkout main
    merge firebase id: "FINAL"
```

*Diagrama simplificado del flujo de ramas. El historial completo está en las Figuras 1 y 2.*

**Decisión:** Elegimos GitHub Flow porque el proyecto tiene un solo entorno productivo y despliega de forma continua desde `main`. Git Flow agrega ramas `develop` y `release` que solo se justifican cuando hay varias versiones en paralelo, y aquí habrían sumado pasos sin beneficio. Conventional Commits deja un historial legible y permite generar después el CHANGELOG y las versiones SemVer de forma automática.

## Cómo se integra un pull request

1. La persona autora trabaja en una rama propia, registra sus cambios y abre un PR hacia `main` con un resumen de lo realizado. No escribe directamente en `main`.
2. GitHub ejecuta los checks automáticos del PR. Las pruebas y los controles de seguridad obligatorios deben terminar en verde. Si falla alguno, la persona autora corrige el cambio y espera una nueva ejecución.
3. Una persona distinta de quien abrió el PR revisa los cambios y registra su decisión en **Submit review**: **Approve** si los acepta o **Request changes** si solicita correcciones. Un comentario sin revisión formal no cuenta como aprobación. Si solicita cambios, la persona autora los aplica y el PR vuelve a pasar por checks y revisión; la aprobación debe corresponder al último push. También deben quedar resueltas las conversaciones y cumplirse la revisión de code owners cuando aplique.
4. Con los checks obligatorios en verde y la aprobación válida, la persona revisora integra el PR mediante **Merge pull request**. Solo entonces el cambio llega a `main`; el despliegue se ejecuta si el cambio incluye archivos que llegan a producción. El ruleset `main-protegida` impide el push directo y el merge sin cumplir estos requisitos.

**Estado y resultado** (al 13 de noviembre de 2026):

| Indicador | Valor |
|---|---|
| Commits en `main` | 75 (desde el 4 de septiembre de 2026) |
| Pull requests integrados | 10 (#2 a #11) |
| Commits que cumplen Conventional Commits | 68 % (43 de 63, sin contar merges) |
| Versión declarada de la app | `1.0.0` en `frontend/package.json` |
| Tags o releases | Ninguno |

Brechas detectadas:

- **Sin tags ni releases.** No se puede volver a «la versión entregada» por nombre.
- **Convención aplicada de forma parcial.** Hay commits fuera del formato, por ejemplo «FINAL», «FIX Caida», «USE DE FEED» y «[FEAT] …».
- **`main` no estaba protegida (resuelta).** El cambio de la rama `firebase` («FIX Caida») entró a `main` con un merge local («FINAL», 30 de octubre) sin pull request ni revisión de otro integrante, como muestra la Figura 1. Se cerró el 13 de noviembre con el ruleset `main-protegida`.
- **Ramas ya integradas sin borrar:** `feat/database-seeding-and-automation` y `firebase`. El borrado automático de ramas al integrar ya está activo, así que solo quedan estas dos.

**Responsable y fecha:** José Luis Gramajo · 13 de noviembre de 2026

**Evidencia:**

*Historial de commits y ramas (`git log --graph`):*

![git log --graph: merge FINAL de la rama firebase a main](evidencias/git-log-graph-1.png)

*Figura 1. `main` en `7fe4914`. La rama `firebase` (`fd33d7c`, «FIX Caida») se integra a `main` con el merge «FINAL» del 30 de octubre; antes aparece el merge del PR #10.*

![git log --graph: merge del PR #10](evidencias/git-log-graph-2.png)

*Figura 2. Merge del PR #10 («FEAT> Completado apk (#10)»): la rama de trabajo (`27f8cec`) se une a `main` mediante un commit con dos padres.*

*Solicitudes de integración:*

![Pestaña Pull requests de GitHub](evidencias/pull-requests.png)

*Figura 3. Pestaña Pull requests (captura tomada antes de integrar el PR #11).*

Ejemplos de PR integrados: [#10 Completado apk](https://github.com/ai-project-u1g/ai-assisted-news-app/pull/10) · [#11 Estructura del plan ITIL y DevOps](https://github.com/ai-project-u1g/ai-assisted-news-app/pull/11)

*Opciones para registrar la revisión de un PR:*

![PR #53 con el formulario Finish your review y las opciones Comment, Approve y Request changes](evidencias/datos_pr.png)

*Figura 4. El PR #53, abierto por G2309 hacia `main`, muestra el formulario **Finish your review**. La opción seleccionada en la captura es **Comment**, que solo envía comentarios; para registrar la decisión, otra persona debe elegir **Approve** o **Request changes** y pulsar **Submit review**. La barra de checks aún muestra trabajo en curso, y la imagen no muestra una aprobación enviada ni un merge.*

*Secretos excluidos (`.gitignore`):*

```gitignore
# Secrets            (líneas 10-12)
keys/*
!keys/README.md

# Secretos locales   (líneas 123-126)
.env
.env.*
!.env.example
```

## Propuesta de mejora

| Prioridad | Mejora | Cómo |
|:---:|---|---|
| 1 | Etiquetar la entrega con SemVer | `git tag -a v1.0.0 -m "Entrega Proyecto Final"` y `git push origin v1.0.0`; luego publicar un GitHub Release. El workflow solo se dispara con push a `main`, así que el tag no redespliega. |
| 2 | Proteger `main` | Implementado con el ruleset `main-protegida` (ver «Prácticas aplicadas»). |
| 3 | Automatizar la convención | commitlint con un hook de husky que valide el formato antes de cada commit. |
| 4 | CHANGELOG automático | Generarlo desde los Conventional Commits, por ejemplo con release-please. |
| 5 | Limpieza de ramas | Borrar `feat/database-seeding-and-automation` y `firebase`. *Automatically delete head branches* ya está activo. |
