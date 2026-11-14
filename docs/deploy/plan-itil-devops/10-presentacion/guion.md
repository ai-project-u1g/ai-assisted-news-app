# Guion de la presentación

Duración objetivo: 17 minutos, por debajo del máximo de 20. Participan los cinco integrantes. Cada
parte indica quién habla y cuánto tiempo tiene. La diapositiva está en
[`presentacion.html`](presentacion.html) y en [`presentacion.pdf`](presentacion.pdf).

| Parte | Diapositivas | Presenta | Tiempo |
| --- | --- | --- | --- |
| Apertura | 1 y 2 | Gustavo Cruz | 1 min 30 s |
| 1 Integración continua | 3 | Gustavo Cruz | 1 min 30 s |
| 2 Despliegue continuo | 4 y 5 | Pedro Pablo Guzmán | 2 min 30 s |
| 3 Pruebas automatizadas | 6 | Gustavo Cruz | 1 min 30 s |
| 4 Gestión de configuración | 7 | Mathew Cordero | 1 min 30 s |
| 5 Versionamiento con Git | 8 | José Luis Gramajo | 1 min 30 s |
| 6 Seguridad DevSecOps | 9 | Josué Say | 2 min |
| 7 FinOps | 10 | Mathew Cordero | 1 min 30 s |
| Relación con ITIL | 11 | Pedro Pablo Guzmán | 1 min |
| Análisis y reflexión | 12, 13 y 14 | Josué Say, José Luis Gramajo | 2 min 30 s |
| Cierre | 15 | Gustavo Cruz | 30 s |

## Apertura

Presenta: Gustavo Cruz.

---
## Del commit a producción con ITIL y DevOps

- Plan ITIL y DevOps de AI Assisted News App
- Cinco integrantes, siete prácticas, evidencia en el repositorio

**Elemento visual sugerido:** Título grande a la izquierda y tarjeta con los cinco integrantes y su componente.

**Notas del orador:** Buenas. Somos el equipo de AI Assisted News App. En los próximos minutos les vamos a mostrar cómo aplicamos siete prácticas de ITIL y DevOps sobre una aplicación que ya está publicada. Cada integrante presenta el componente que implementó, y todo lo que mostramos tiene evidencia en la carpeta del plan dentro del repositorio.

---
## Una app de noticias con chat, ya publicada

- Web en Firebase Hosting y APK Android, login con Firebase
- `news-api` y `news-chatbot` en Cloud Run
- MongoDB Atlas para noticias, usuarios y sesiones de chat
- El chat usa OpenAI con un tope de USD 20

**Elemento visual sugerido:** Captura del sitio publicado en Firebase Hosting.

**Notas del orador:** La aplicación muestra noticias por país y tiene un asistente que responde preguntas sobre ellas. La web está en Firebase Hosting y también hay un APK de Android. Atrás corren dos servicios en Cloud Run: la API de noticias y el chatbot. Los datos viven en MongoDB Atlas, y el chat llama a OpenAI con un presupuesto máximo de 20 dólares. Todo lo que sigue se aplica sobre esta arquitectura real.

## 1 Integración continua CI

Presenta: Gustavo Cruz.

---
## Cada cambio pasa por dos jobs automáticos

- GitHub Actions corre en cada PR y cada push a `main`
- `test`: pytest, scripts de deploy e integración con MongoDB
- `frontend`: TypeScript, Vitest y export web
- Si uno falla, el despliegue no corre

**Elemento visual sugerido:** Captura de la ejecución 43552233962 en Actions con los jobs test y frontend en verde.

**Notas del orador:** Elegimos GitHub Actions porque el código ya está en GitHub y no necesitamos otro servidor. El flujo está en el archivo deploy.yml y se activa en cada pull request y en cada push a main. Corre dos jobs en paralelo. El de backend instala dependencias, corre pytest, valida los scripts de despliegue sin tocar la nube y levanta una MongoDB temporal para probar feed, perfil y chat. El de frontend revisa tipos, corre las pruebas y genera la versión web sin publicarla. El despliegue depende de los dos: si alguno falla, no se publica nada. En esta ejecución, backend tardó un minuto y frontend 47 segundos.

## 2 Despliegue continuo CD

Presenta: Pedro Pablo Guzmán.

---
## Un push a main publica las cuatro piezas

- Cloud Run en `us-east4` para la API y el chat
- Firebase Hosting para la web y EAS para el APK
- Credenciales temporales con Workload Identity, sin llaves JSON
- Al final verifica imagen del commit, `/health` y sitio

**Elemento visual sugerido:** Flujo push, pruebas, configuración, APK, Cloud Run, Hosting y verificación, con dos indicadores: 13 minutos y 82 %.

**Notas del orador:** Cuando un cambio llega a main, el mismo workflow publica cuatro cosas desde el mismo commit: la API, el chatbot, la web y el APK. GitHub no guarda llaves de Google: obtiene credenciales de corta duración con Workload Identity, y solo desde main. Antes de tocar la nube revisa que existan todas las variables. Al final corre una verificación que confirma que Cloud Run sirve la imagen de ese commit y que los health checks responden. De main a producción tarda unos 13 minutos, y el 70 % de ese tiempo es el APK.

---
## Menos despliegues inútiles, fallas visibles al momento

- 16 de 24 pushes desplegaban sin cambiar la app
- Filtro de rutas: cambios de docs ya no despliegan
- La verificación detectó un despliegue a medias del chatbot
- Volver atrás quedó documentado con comandos

**Elemento visual sugerido:** Barras de antes y después: 16 de 24 despliegues innecesarios contra 0 con el filtro.

**Notas del orador:** Medimos una línea base con los 47 runs del workflow. 16 de 24 pushes a main desplegaban todo aunque solo cambiara documentación. Con un filtro de rutas esos casos ya no despliegan. La verificación final encontró un caso real: la API se actualizó pero el chatbot no arrancó, y producción quedó con dos versiones. Ahora eso deja el run en rojo y hay un procedimiento escrito para volver atrás.

## 3 Pruebas automatizadas

Presenta: Gustavo Cruz.

---
## 511 pruebas automáticas, tres casos documentados

- 430 en backend con pytest, 81 en frontend con Vitest
- Artículo corto: leído a los 5 segundos activos
- 300 palabras dan 2 minutos de lectura
- El chat restaura solo conversaciones vigentes del usuario

**Elemento visual sugerido:** Captura de la terminal con 430 aprobadas y 1 omitida.

**Notas del orador:** El proyecto tiene 511 pruebas que corren en cada pull request. Documentamos tres casos. El primero decide cuándo una noticia corta cuenta como leída: con 4 segundos de lectura activa todavía no, con 5 sí. El segundo calcula el tiempo de lectura: 300 palabras dan 2 minutos, redondeando hacia arriba. El tercero revisa que el chat solo restaure las conversaciones vigentes del usuario actual. Usamos Vitest en lugar de Jest porque el frontend es Expo con TypeScript, y la sintaxis es la misma: describe, it y expect.

## 4 Gestión de configuración

Presenta: Mathew Cordero.

---
## Ningún secreto vive en el repositorio

- Local: `.env` sin secretos, credenciales en `keys/`
- GitHub `production`: proyecto, región, precios y Firebase público
- Secret Manager guarda la URI de MongoDB y la key de OpenAI
- Cloud Run las monta como archivos en `/secrets`

**Elemento visual sugerido:** Captura de Secret Manager con los nombres de los secretos, sin valores.

**Notas del orador:** Separamos parámetros de secretos. En desarrollo, el archivo .env solo tiene valores como el modo de base de datos o los puertos, y las credenciales están en la carpeta keys, que git ignora. En producción, los parámetros públicos viven en el entorno production de GitHub, y los secretos en Secret Manager de Google Cloud. Cloud Run los monta como archivos, así el código lee la credencial igual en local y en la nube.

## 5 Gestión de versionamiento con Git

Presenta: José Luis Gramajo.

---
## GitHub Flow, y main ya no acepta atajos

- Una rama por funcionalidad, integración por pull request
- Ruleset: una aprobación, code owners y checks en verde
- Conventional Commits en el 68 % del historial
- Pendiente: etiqueta `v1.0.0` para la entrega

**Elemento visual sugerido:** Captura del PR 51 bloqueado por el ruleset hasta tener aprobación.

**Notas del orador:** Usamos GitHub Flow porque tenemos un solo entorno de producción: main es la rama estable y cada funcionalidad entra por pull request. Al revisar el historial encontramos un merge directo a main sin revisión, así que activamos el ruleset main protegida: pide una aprobación, revisión de code owners y los checks en verde. El 68 % de los commits sigue Conventional Commits. Lo que falta es etiquetar la entrega como versión 1.0.0.

## 6 Gestión de seguridad DevSecOps

Presenta: Josué Say.

---
## Siete controles automáticos, cero alertas abiertas

- CodeQL, gitleaks, Trivy, pip-audit y OWASP ZAP
- Corren en cada PR, en `main` y cada lunes
- Trivy encontró paquetes vulnerables dentro de la imagen
- Key de Firebase limitada a la app y 3 APIs

**Elemento visual sugerido:** Barras de alertas antes y después: 78, 18 y 1 contra 0.

**Notas del orador:** Agregamos un workflow de seguridad aparte con siete controles: análisis estático con CodeQL, búsqueda de secretos con gitleaks, dependencias con Trivy y pip-audit, escaneo de las imágenes que se despliegan y un DAST con OWASP ZAP contra la API levantada. Corre en cada PR, en main y cada lunes. Empezamos con 78 alertas de Dependabot, 18 de code scanning y 1 secreto expuesto, y cerramos todas. La key de Firebase quedó limitada a nuestra app y a tres APIs.

## 7 Gestión financiera FinOps

Presenta: Mathew Cordero.

---
## Octubre costó USD 3.69 entre nube e IA

- Google Cloud USD 2.15: la IP de NAT fue USD 2.10
- Cloud Run escala a cero: USD 0 netos
- OpenAI USD 1.54, presupuesto funcional de USD 20
- Piloto: 1,200 tokens de salida, meta 10 % menos

**Elemento visual sugerido:** Barras de costo por servicio en octubre.

**Notas del orador:** Revisamos los costos reales de octubre con los CSV de Google Cloud y de OpenAI. El total fue 3.69 dólares. Casi todo el gasto de Google fue la IP fija de Cloud NAT, que necesitamos para que Atlas acepte la conexión. Cloud Run no costó nada neto porque escala a cero. Para OpenAI tenemos un presupuesto de 20 dólares en la app y alertas de presupuesto en Google. La propuesta es probar un límite de 1,200 tokens por respuesta y medir si baja el gasto un 10 % sin empeorar las respuestas.

## Relación con ITIL

Presenta: Pedro Pablo Guzmán.

---
## Cuatro prácticas ITIL ordenan el flujo

- Habilitación de cambios: todo entra por PR con checks
- Gestión de despliegues: un solo camino a producción
- Seguridad de la información: escaneo por PR y semanal
- Mejora continua: líneas base medidas antes y después

**Elemento visual sugerido:** Ciclo solicitud, evaluación, aprobación, despliegue, verificación y medición.

**Notas del orador:** Todo esto se ordena con cuatro prácticas de ITIL. Un pull request funciona como solicitud de cambio, los checks son la evaluación de riesgo y la revisión es la aprobación. Hay un solo camino a producción. La seguridad corre en cada cambio y cada semana. Para mejorar de forma continua medimos una línea base antes de cada cambio y volvemos a medir después.

## Análisis y reflexión

Presentan: Josué Say en ventajas y retos, José Luis Gramajo en mejoras.

---
## El pipeline frenó fallas antes de producción

- CI rechazó 2 PR de Dependabot incompatibles con Expo
- Trivy vio en la imagen lo que pip-audit no veía
- La imagen de `news-api` bajó de 308 a 284 MB
- Cada cambio queda con evidencia y línea base

**Elemento visual sugerido:** Cuatro indicadores: 511 pruebas, 7 controles, 0 alertas y USD 3.69.

**Notas del orador:** La ventaja más visible es que los problemas aparecen antes de producción. El CI rechazó dos actualizaciones de Dependabot que habrían roto la app. Trivy encontró vulnerabilidades dentro de la imagen que no aparecían en los archivos de dependencias, y al corregirlas la imagen quedó más liviana. Cada decisión quedó medida y documentada.

---
## Falsos positivos y coordinación costaron más

- gitleaks marcó un nombre de contenedor como secreto
- minimatch y uuid sin corrección compatible con Expo 57
- El chatbot no arrancó en dos despliegues
- Cinco personas subiendo a main antes del ruleset

**Elemento visual sugerido:** Flujo de la falla del chatbot: la revisión nueva no arranca, Cloud Run mantiene la anterior y el run queda en rojo.

**Notas del orador:** Los retos vinieron sobre todo del proceso. gitleaks confundió un nombre de contenedor con una credencial y bloqueó PRs de otros. Dos dependencias no tienen corrección compatible con nuestra versión de Expo, así que las aceptamos como riesgo con justificación. En dos despliegues el chatbot no arrancó porque no conectó a MongoDB al iniciar; Cloud Run mantuvo la versión anterior y producción siguió respondiendo. Y con cinco personas subiendo a main, proteger la rama tuvo que esperar al cierre para no bloquear al equipo.

---
## Lo siguiente: monitorear, etiquetar y medir

- DevSecMonOps: alertas por 401, 429 y costo del chat
- Automatización: tag `v1.0.0` y CHANGELOG desde los commits
- CD: reintentar MongoDB al arrancar el chatbot
- FinOps: medir el piloto de tokens y revisar NAT

**Elemento visual sugerido:** Tres plazos: 1 semana, 2 semanas y 1 mes, con las tareas de cada uno.

**Notas del orador:** Proponemos cuatro mejoras. Monitoreo con alertas de Cloud Monitoring por accesos rechazados, exceso de peticiones y costo del chat, junto con un límite de peticiones en el chat. Etiquetar la entrega y generar el CHANGELOG desde los commits. Que el chatbot reintente la conexión a MongoDB al arrancar, que fue la falla que vimos dos veces. Y en FinOps, medir el piloto de tokens y comparar el costo de la IP de NAT con otras formas de conectar a Atlas.

## Cierre

Presenta: Gustavo Cruz.

---
## Abran la app y revisen el pipeline

- App: adfasdfasfd-1899a.web.app
- Repositorio: ai-project-u1g/ai-assisted-news-app
- Evidencias en `docs/deploy/plan-itil-devops`

**Elemento visual sugerido:** Enlaces a la app y al repositorio, con la pregunta al público en una tarjeta.

**Notas del orador:** La app está publicada y el repositorio es público, con todas las evidencias en la carpeta del plan. Los invitamos a abrirla desde el celular. Para cerrar: si tuvieran que agregar un solo control de estos a su propio proyecto, ¿cuál sería el primero?
