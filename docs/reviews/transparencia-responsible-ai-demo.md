# Demostración de transparencia y Responsible AI

Fecha: 2026-10-30. Corresponde a los cinco criterios de la página 2 de
`Proyecto_2_AI_Assisted_News_App (3).pdf`. Implementación local; no publica cambios de infraestructura.

## 1. Importancia, orden y prominencia

En **Inicio**, abrir **Cómo se ordena tu feed**. Cambiar ubicación y temas desde
**Personalizar feed** y comparar con otra cuenta sobre las mismas publicaciones.
La principal conserva la primera posición del servidor y tiene mayor tamaño;
la API entrega también el desglose del puntaje para inspeccionarlo al abrir una noticia del feed.
Los pesos y desempates están en
[03 Criterios de personalización](../design/database/03-criterios-de-personalizacion.md).

Elegir un único tema e inferir interés alto mediante lecturas. Comprobar que las posiciones
4 y 9 incorporan otras ubicaciones/internacional si existen candidatas, y que
**Panorama por territorio** sigue mostrando las publicaciones más recientes por alcance
sin filtrar temas ni quedar limitado a las 50 del ranking. Una búsqueda tampoco lo oculta.
La selección de país no se presenta como cobertura de ciudad. Si falta contenido, se informa.

**Límite explícito:** cobertura y actualidad son una protección frente a la burbuja, no un
detector de emergencias ni un juicio editorial de importancia pública. No existe campo de
prioridad manual. El panorama no asegura que esté todo lo importante ni promueve una noticia
por ser confirmada; la verificación se muestra como dimensión independiente.

Evidencia: `backend/news/tests/test_personalization.py`, `test_coverage.py`,
`test_editorial_policy.py` y `frontend/tests/newsFeedReading.test.tsx`.

## 2. Fuentes, texto publicado y aportes IA

En **Nueva noticia**, registrar varias fuentes con nombre, URL, tipo, fecha de publicación,
fecha de consulta y **Afirmación respaldada**. Si no se conoce la fecha de publicación,
dejarla vacía; si se omite la consulta, el servidor registra la fecha actual.
No usar una respuesta del modelo como fuente. Declarar por separado si resumen o temas
se generaron con IA.

En una publicación, mostrar el distintivo **Resumen generado con IA** o **Resumen de la
redacción**. En **Verificación y procedencia**, mostrar quién publicó el texto, los aportes
de IA declarados, las notas y las fechas. En **Fuentes originales**, abrir el documento o medio
externo y comparar la afirmación que respalda. Ese enlace es el original declarado por la
redacción; el sistema no afirma que haya autenticado su contenido.

El esquema actual registra asistencia de resumen/temas/imagen. No inventa una clasificación
de autoría del cuerpo ni afirma que todo texto publicado sea una investigación original.

Evidencia: `test_editorial_policy.py` conserva metadatos hasta MongoDB simulado;
`test_api.py` comprueba su lectura; las pruebas de pantalla comprueban enlaces y etiquetas.

## 3. Validación e incertidumbre

La persona revisora debe abrir la evidencia, comprobar fechas, contexto y afirmaciones,
detectar reproducciones de una misma fuente y explicar las limitaciones. El mínimo técnico
no sustituye ese trabajo. El formulario comienza como **borrador en desarrollo**, sin revisión.

| Caso para demostrar | Resultado exigido |
| --- | --- |
| Publicar sin marcar revisión humana o sin notas | Se rechaza; no se inserta noticia ni auditoría de creación. |
| Sin fuentes o sin afirmaciones respaldadas | Solo puede guardarse como borrador. |
| Una fuente secundaria y estado confirmada | Se rechaza; obtener más respaldo o declarar desarrollo. |
| Dos enlaces del mismo sitio, con/sin `www.` | No se consideran corroboración de sitios distintos. |
| Fuente oficial/primaria revisada o dos sitios distintos revisados | Permite confirmar con revisión y notas; la independencia y veracidad las evalúa una persona. |
| Fuentes insuficientes | Rechaza publicar; conservar borrador hasta obtener respaldo. |
| Versiones contradictorias | Puede publicarse con revisión y notas que expliquen las diferencias, sin declararlo confirmado. |
| Información en desarrollo | Puede publicarse revisada, señalando lo pendiente. |

Marcar **He contrastado las fuentes y revisado el contenido** al terminar. Editar de nuevo
el contenido, fuentes o clasificación desmarca la revisión y exige repetirla.
La identidad revisora se obtiene del usuario autenticado, no de un ID enviado por el cliente.
Los permisos siguen comprobándose en servidor.

Mostrar los estados inciertos **antes de abrir** la noticia y las notas completas al leerla.
El control también se aplica a peticiones HTTP directas. No se introduce otro estado de
publicación, no se reescriben noticias antiguas y no se afirma detectar automáticamente falsedades.

Evidencia: `test_editorial_policy.py` prueba las decisiones y el límite HTTP sin credenciales
ni datos reales; las pruebas de pantalla comprueban el aviso en el feed y las notas en detalle.

## 4. Límites de la IA en el chat

Abrir una noticia incierta y seleccionar **Preguntar al asistente**. Solicitar una explicación
o resumen. Mostrar la etiqueta **Elaborada con IA**, el prefacio que declara que la IA no
verifica los hechos y el aviso de incertidumbre que procede de los datos.
Las consultas resueltas por código conservan **Datos de la base** y no requieren una llamada IA.

El **respaldo documental** se calcula por código usando verificación y fuentes. No es una
probabilidad de verdad. Una respuesta elocuente no cambia el estado de la noticia, no publica
y no resuelve contradicciones. Las citas llevan al detalle y luego a sus fuentes originales.
El prompt también recibe notas, afirmaciones respaldadas y naturaleza de imágenes; esos
metadatos son datos y no instrucciones que puedan sustituir las reglas del asistente.

La prueba `test_model_cannot_promote_conflicting_news_to_confirmed` utiliza un proveedor
simulado que afirma que todo es verdadero: el resultado conserva el estado contradictorio,
el respaldo limitado, las notas y el prefacio independiente del texto del modelo.
Esto demuestra el límite de autoridad; no promete eliminar todas las afirmaciones erróneas
que un modelo pueda generar. La supervisión humana sigue siendo necesaria.

Evidencia: `backend/assistant/tests/test_news_chat.py` y `test_news_conversation.py`.
Estas pruebas no llaman a OpenAI. Una demostración con proveedor real sí consume el presupuesto
configurado y registra el uso mediante el mecanismo existente.

## 5. Imágenes generadas o alteradas

En el panel, probar **Sin imagen**, **Fotografía**, **Ilustración**, **Generada con IA** y
**Alterada con IA**. Una URL no se clasifica automáticamente como fotografía.
Para publicar con imagen se requieren descripción, crédito y derechos; los tipos IA además
necesitan una declaración sobre cómo se produjo o alteró el visual.

En tarjetas principales, compactas y detalle, comprobar el aviso **Generada/Alterada con IA ·
no es evidencia del hecho**. En detalle mostrar también el pie contextual, declaración,
autoría y derechos. Una fotografía reutilizada debe explicarse en el pie; su apariencia no
la autentica. Una imagen histórica sin tipo declarado no se reclasifica automáticamente.

Para una noticia sin imagen, pulsar **Obtener imagen**. La biblioteca contextual permite filtrar
por categoría, abrir toda la biblioteca, previsualizar y consultar procedencia/licencia. Marcar
la revisión de derechos y pertinencia antes de **Usar esta imagen**. Mostrar que cancelar conserva
texto e imagen previa y que una imagen que falla al cargar no se puede aceptar.

Se eligió obtención desde biblioteca; no se genera una imagen nueva mediante IA. Los metadatos
se adjuntan a los campos existentes y la revisión editorial general se solicita después.
Detalle en [14 Biblioteca administrativa](../design/database/14-biblioteca-administrativa.md).

Evidencia: los cinco tipos se conservan en `test_editorial_policy.py`; la etiqueta visible de
ambos tipos IA en tarjetas compactas se comprueba en `frontend/tests/editorialImages.test.tsx`.

## Ejecución y límites de la evidencia

- `make db-test`: suite de noticias existente, con configuración de desarrollo segura.
- Desde `backend/assistant`, ejecutar `python -m pytest tests`; el smoke real permanece separado.
- Desde `frontend`, ejecutar `npm test` y `npm run typecheck`.
- Compilación web: `CI=1 EXPO_NO_DOTENV=1 npm run export:web -- --output-dir /tmp/news-editorial-web-export`.
- La revisión de navegador utiliza componentes reales con límites de red/Firebase sustituidos
  por fixtures. No demuestra autenticación real, conectividad Atlas ni apariencia nativa.
- El catálogo/dataset vigente puede carecer de noticias locales o internacionales: se muestran
  vacíos honestos. Para la clase, el equipo debe preparar contenido real revisado en los ámbitos
  que quiera demostrar, o identificar explícitamente cualquier escenario ficticio.
- Las noticias demo históricas son sintéticas; sus fuentes e imágenes temáticas no prueban
  acontecimientos reales. No presentarlas como periodismo verificado.
- Este loop no lee `keys/`, no ejecuta reseed ni limpieza y no llama a proveedores de IA.

## Controles y trazabilidad

| Riesgo | Control y evidencia |
| --- | --- |
| Omitir el formulario y publicar por HTTP | Revisión/fuentes/notas exigidas en request validado; prueba HTTP sin inserciones en rechazo. |
| Falsa revisión atribuida a otro usuario | Revisor y autor proceden de identidad autenticada y rol de DB; pruebas de autorización existentes. |
| Modelo que asegura que algo es verdad | Estado y respaldo calculados por servidor; prefacio/advertencia persistidos y prueba adversa simulada. |
| Imagen sintética presentada como evidencia | Tipo explícito, declaración obligatoria, etiqueta visible y pruebas de almacenamiento/presentación. |
| Preferencia que concentra el feed | Reservas 4/9 y panorama separado por territorio, probados con más de 50 candidatas. |

MongoDB mantiene los mismos modelos, validators, índices, referencias, TTL y seeders.
No se agregan secretos ni dependencias de producción. Los puntajes y el panorama son
proyecciones de lectura; el [diagrama](../design/database/07-diagrama.md) conserva su estructura.
