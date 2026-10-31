# Criterios de contenido

Parte de la [documentación de base de datos](README.md).

Reglas que rigen los datos de una noticia: su estado de publicación, su verificación, su
procedencia, su imagen y su alcance geográfico. Cada criterio define qué significa un valor y qué
debe cumplirse, no el procedimiento para llegar a él.

## Publicación

`news.status` tiene dos valores y no existe un estado intermedio de revisión.

| Valor | Significado |
| --- | --- |
| `draft` | La noticia solo existe en administración. No aparece en la aplicación móvil ni puede ser citada por el chat. |
| `published` | La noticia es visible en la aplicación móvil y puede ser citada por el chat. |

Reglas:

- Al pasar de `draft` a `published` se establece `publishedAt`.
- Mientras `status` sea `draft`, `publishedAt` vale `null`.
- Solo las noticias con `status = "published"` pueden aparecer en `chatSessions.messages[].responseMetadata.citedNewsIds`.

## Verificación

`news.verification.status` declara qué tan asentada está la información. La documentación fija el
significado de cada valor; no define con qué método se determina.

| Valor | Significado |
| --- | --- |
| `confirmed` | Noticia confirmada. |
| `developing` | Hecho en desarrollo, sujeto a cambios. |
| `insufficient_sources` | No hay respaldo suficiente. |
| `conflicting_sources` | Las fuentes disponibles se contradicen. |

Reglas:

- Una noticia se considera confirmada únicamente cuando `verification.status = "confirmed"`.
- Cualquier otro valor corresponde a una noticia incierta, y esa condición debe comunicarse de
  forma explícita donde se muestre la noticia.
- `reviewedBy`, `reviewedAt` y `notes` admiten `null` en el esquema, para datos históricos y
  borradores. El flujo administrativo vigente exige revisión explícita y notas al publicar,
  como se detalla abajo; no cambia el esquema ni reclasifica publicaciones anteriores.

### Procedimiento administrativo de publicación

El formulario y `POST /admin/news` implementan estos controles usando los campos existentes:

- Una noticia nueva comienza como `draft` y `developing`, sin revisión declarada.
- Publicar requiere `humanReviewed = true`, notas de contraste y al menos una fuente que indique
  en `supports` qué afirmación respalda. La persona autenticada con rol `admin` decide y asume
  la revisión; el servidor registra su ObjectId y la fecha, nunca una identidad enviada por cliente.
- `confirmed`: una persona debe revisar el material original, fechas, contexto, afirmaciones y
  contradicciones. El mínimo técnico es una fuente `official`/`primary_source` o fuentes de dos
  hosts distintos (ignorando el prefijo `www.`). No es una prueba automática: sitios diferentes
  pueden copiarse o pertenecer al mismo grupo; el revisor debe evaluar la independencia real.
- `developing`: puede publicarse con revisión y notas que separen lo respaldado de lo pendiente.
  Una fuente secundaria puede bastar para comunicar un anuncio incierto, sin declararlo confirmado.
- `insufficient_sources`: permanece en borrador hasta obtener respaldo; no aparece ni se cita.
- `conflicting_sources`: puede publicarse revisada si las notas explican las versiones y qué sigue
  sin resolver. El lector y el chat reciben el aviso; el modelo no decide cuál versión es verdadera.
- Guardar un borrador no exige estos mínimos de publicación. Los tipos/URLs de fuente e imagen
  sí se validan. No se agrega un estado de revisión ni un servicio automático de verificación.
- Las notas, las fuentes y la revisión se muestran en el detalle; las tarjetas muestran el estado
  antes de abrir. Los aportes IA se declaran por separado y una respuesta del modelo no es fuente.

La entrada administrativa admite `sources[]` con nombre, URL, tipo, fecha de publicación opcional,
fecha de consulta (si se omite, se registra la actual) y afirmación respaldada. La antigua pareja
`sourceName`/`sourceUrl` se conserva para borradores; no sustituye la evidencia exigida al publicar.

## Fuentes

`news.sources` contiene la procedencia de la noticia. Cada elemento declara de dónde proviene la
información.

| Valor de `sourceType` | Significado |
| --- | --- |
| `official` | Fuente institucional u oficial. |
| `media` | Medio de comunicación. |
| `primary_source` | Documento o material original. |
| `witness` | Testimonio directo. |
| `other` | Cualquier otro origen. |

Reglas:

- `accessedAt` siempre está presente: indica cuándo se consultó la fuente.
- `publishedAt` admite `null` porque no toda fuente declara fecha de publicación.
- `supports` indica qué afirmación de la noticia respalda esa fuente, y admite `null`.
- La trazabilidad de una respuesta del chat se resuelve en dos saltos:
  `citedNewsIds` apunta a las noticias utilizadas y cada noticia contiene sus propias `sources`.

## Imagen

`news.image.type` declara la naturaleza de la imagen.

| Valor | Significado |
| --- | --- |
| `photograph` | Fotografía real. |
| `illustration` | Ilustración no fotográfica. |
| `ai_generated` | Imagen generada con IA. |
| `ai_modified` | Imagen real alterada con IA. |
| `none` | La noticia no tiene imagen. |

Reglas:

- Cuando `type` vale `ai_generated` o `ai_modified`, `aiDisclosure` debe tener contenido.
- Una imagen con `type` `ai_generated` o `ai_modified` no puede presentarse como fotografía real.
- Cuando `type` vale `none`, `url` y `alt` valen `null`.
- `credit` y `rights` registran autoría y condiciones de uso cuando existen.
- El panel exige clasificar explícitamente una URL (`imageType`); no la convierte automáticamente
  en fotografía. Al publicar exige alt, crédito y derechos. `imageAiDisclosure` se conserva en
  `image.aiDisclosure`; `imageGenerated` se deriva únicamente de `ai_generated`.
- Las tarjetas, incluso compactas, y el detalle etiquetan generación/alteración con IA como
  contenido que no es evidencia del hecho. El detalle muestra pie contextual, declaración,
  crédito y derechos. Una fotografía reutilizada tampoco se autentica por su apariencia.
- No se reclasifican imágenes históricas sin evidencia ni se incorpora un detector de IA.
- El panel ofrece **Obtener imagen** mediante la
  [biblioteca administrativa](14-biblioteca-administrativa.md). La selección exige vista previa
  cargada y revisión humana de procedencia, derechos y pertinencia; conserva el formulario al
  cancelar. Solo al aceptar se adjuntan juntos los metadatos existentes de `news.image`.
- En el dataset demo, `credit` incluye la página del archivo y `rights` la licencia con su URL;
  el `alt` declara que la imagen es ilustrativa y no documenta el acontecimiento ficticio. Detalle
  en [13 Imágenes del dataset demo](13-imagenes-demo.md).

## Uso declarado de IA

`news.aiAssistance` deja constancia de qué partes de la noticia se produjeron con asistencia de IA.

| Campo | Qué declara |
| --- | --- |
| `summaryGenerated` | El resumen se generó con IA. |
| `topicsGenerated` | Los temas se generaron con IA. |
| `imageGenerated` | La imagen se generó con IA. |
| `humanReviewed` | Una persona revisó el contenido asistido por IA. |

Reglas:

- Los cuatro campos son booleanos y siempre están presentes.
- `imageGenerated` y `image.type` deben ser coherentes entre sí: una imagen declarada como
  generada por IA se refleja en ambos lugares.

## Alcance geográfico

`news.geographicScope` define a qué territorio pertenece la noticia.

| Valor de `level` | Significado |
| --- | --- |
| `city` | Alcance de ciudad. |
| `region` | Alcance regional. |
| `country` | Alcance nacional. |
| `international` | Alcance internacional. |

Reglas:

- `locationIds` referencia entradas de `locations` y puede contener más de una.
- Cuando `level` vale `international`, la noticia no depende de coincidir con una ciudad concreta.
- La comparación entre el alcance de la noticia y la ubicación del usuario se documenta en
  [criterios de personalización](03-criterios-de-personalizacion.md).

## Temas y palabras clave

- `topics` es la lista de temas de la noticia y es el campo que se compara con
  `users.onboarding.selectedTopics` y con `users.inferredInterests[].topic`.
- `keywords` acompaña a la noticia para su localización, sin participar en la definición de
  intereses.
- Ambos son arreglos de cadenas y comparten vocabulario con los temas ofrecidos en el onboarding.
