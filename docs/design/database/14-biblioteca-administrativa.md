# Biblioteca de imágenes para administración

La aplicación permite obtener una imagen dentro de la edición de una noticia mediante una
biblioteca finita de fotografías contextuales de Wikimedia Commons. No requiere generación IA,
credenciales nuevas, almacenamiento propio ni cambios de esquema MongoDB.

## Datos y procedencia

`backend/news/image_library.py` reutiliza seis assets revisados de `demo_images.py`, sin incorporar
texto de las noticias ficticias. Conserva URL HTTPS, autor, página original y licencia de cada
archivo. Cambia el pie específico de demo por una advertencia contextual para la noticia en edición.

| Imagen | Página original | Licencia registrada |
| --- | --- | --- |
| Jardín | [Garden.jpg](https://commons.wikimedia.org/wiki/File:Garden.jpg) | CC BY-SA 2.5 |
| Cancha de fútbol | [Football pitch.jpg](https://commons.wikimedia.org/wiki/File:Football_pitch.jpg) | CC BY-SA 4.0 |
| Sala de reuniones | [Meeting room.jpg](https://commons.wikimedia.org/wiki/File:Meeting_room.jpg) | CC BY-SA 4.0 |
| Guitarra | [Acoustic guitar.jpg](https://commons.wikimedia.org/wiki/File:Acoustic_guitar.jpg) | Dominio público declarado por el autor |
| Estanterías | [Two bookshelves…](https://commons.wikimedia.org/wiki/File:Two_bookshelves_full_of_books_belonging_to_Unitedmissionary_%282010%29.jpg) | CC BY-SA 3.0 |
| Bicicletas | [Three rusty bicycles.jpg](https://commons.wikimedia.org/wiki/File:Three_rusty_bicycles.jpg) | CC BY-SA 4.0 |

Las páginas originales se revisaron en este loop. El revisor debe consultar las condiciones de
cada archivo y evaluar su uso. La presencia en Commons no sustituye esa revisión. Los campos
`image.credit` y `image.rights` mantienen autoría, enlaces y notas de reproducción ya documentadas.
No se descargan ni transforman archivos en el servidor; la vista previa muestra el recurso remoto
sin recortarlo. Las tarjetas existentes pueden recortar su presentación visual y conservan crédito,
derechos y pie de contexto en el detalle.

## Consulta y selección

- `GET /admin/image-library` exige Firebase y rol `admin` del servidor. Devuelve candidatos con
  identificador, título, categorías, página original e `image` compatible con el modelo vigente.
- `?topic=` filtra por el catálogo de temas existente. Una categoría desconocida devuelve 400;
  una categoría sin candidatos devuelve una lista vacía. **Ver toda la biblioteca** permite
  ampliar la selección sin inventar resultados.
- La selección del catálogo no hace búsqueda remota, descarga en backend, generación, escritura
  de noticias/auditorías ni registro `aiUsage`. La autenticación conserva la resolución de usuario
  existente. La imagen escogida se guarda cuando se crea la noticia por el endpoint existente,
  con sus metadatos en `news.image`.
- Las sugerencias por categoría no certifican pertinencia, ubicación ni relación con el hecho.
  Todas son fotografías contextuales y no documentan el acontecimiento de la noticia.

## Flujo de interfaz

1. En **Nueva noticia → Imagen y contexto visual**, pulsar **Obtener imagen**.
2. Consultar las sugerencias de la categoría o abrir toda la biblioteca. Se muestra carga,
   error con reintento o ausencia de resultados según corresponda.
3. Pulsar **Previsualizar** sobre un candidato. Revisar fotografía, pie contextual, crédito,
   licencia y enlace a la página original.
4. Confirmar **Revisé procedencia, derechos y pertinencia de esta imagen de contexto**.
   **Usar esta imagen** solo se habilita cuando la previsualización cargó y se marcó esa revisión.
5. Al aceptar se actualizan juntos URL, tipo, alt, crédito, derechos y declaración de IA.
   La revisión editorial general queda desmarcada y debe confirmarse tras terminar la noticia.
6. Cancelar conserva la imagen previa y todos los textos de la noticia. Respuestas tardías de
   la consulta se ignoran al cancelar o cambiar la selección de categoría.

Un error del CDN no permite adjuntar una vista previa no comprobada. El editor puede reintentar,
elegir otra imagen o cancelar y guardar el borrador. No se adjunta nada automáticamente.

## Trazabilidad y pruebas

Se conservan las siete colecciones, modelos, validators, índices, seeders y TTL. El catálogo es
código de lectura, no una colección ni un seed nuevo. `aiAssistance.imageGenerated` permanece
falso para estas fotografías. El tipo IA sigue disponible para URLs manuales con declaración.

Pruebas en `backend/news/tests/test_image_library.py` cubren autorización, filtro, metadatos,
ausencia de escritura durante la consulta y persistencia exacta al guardar. Las pruebas de
pantalla en `frontend/tests/newsFeedReading.test.tsx` cubren aceptación, cancelación, revisión,
error de consulta, resultados vacíos, imagen no disponible y respuestas tardías.
