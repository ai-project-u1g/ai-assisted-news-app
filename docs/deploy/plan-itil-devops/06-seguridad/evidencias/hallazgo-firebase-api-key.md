# Hallazgo: API key de Firebase en `frontend/google-services.json`

Referencia oficial: [Información sobre las claves de API de Firebase](https://firebase.google.com/docs/projects/api-keys).

## Detección

| Campo | Valor |
| --- | --- |
| Archivo | `frontend/google-services.json`, línea 31 (`api_key.current_key`) |
| Commit de entrada | `27f8cec` («FEAT> Completado apk», PR #10) |
| Detectado por | GitHub secret scanning, alerta #1 «Google API Key» (abierta el 21 de octubre de 2026), y gitleaks en la línea base (regla `gcp-api-key`) |
| Estado en GitHub | `publicly_leaked = true`: el repositorio es público y la key está en el historial |
| Key afectada | «Android key (auto created by Firebase)» del proyecto de Firebase de la app |

En este documento no se reproduce el valor de la key.

## Por qué está en el repositorio

- `frontend/app.json` declara `"googleServicesFile": "./google-services.json"` para el build Android
  con EAS.
- `deploy/expo/build-ci.sh` exige que el archivo exista en el checkout de CI antes de generar el APK.
- Google y Firebase diseñan esta key para ir embebida en la app. Cualquier usuario puede extraerla
  del APK, así que identifica al proyecto pero no autoriza por sí sola el acceso a los datos.

## Evaluación de riesgo

La key no da acceso a MongoDB, a Secret Manager ni a Cloud Run. Esos secretos están en Secret
Manager y en `keys/`, que nunca se commitea. El riesgo es el abuso de las APIs que la key permite:

- consumo de cuota o costos en las APIs habilitadas;
- registro de cuentas de Firebase Authentication desde clientes que no son la app.

Estado verificado el 13 de noviembre de 2026 con `gcloud services api-keys describe`, en modo de solo
lectura:

| Control | Estado |
| --- | --- |
| Restricción de aplicación (paquete Android + SHA-1) | Ninguna: `androidKeyRestrictions: {}` |
| Restricción de APIs | 27 APIs de Firebase y Google Cloud, entre ellas `identitytoolkit`, `securetoken`, `firestore`, `firebasestorage`, `sqladmin` y `logging` |
| APIs que usa la app | Firebase Authentication: `identitytoolkit.googleapis.com` y `securetoken.googleapis.com` |

Conclusión: no se trata de una credencial privilegiada filtrada, pero la key está más abierta de lo
necesario. Cualquiera que la copie del repositorio puede llamar a 27 APIs desde cualquier cliente.

## Verificación de compromiso

| Revisión | Responsable | Estado |
| --- | --- | --- |
| Restricciones actuales de la key | Josué Say | Hecho, ver la tabla anterior |
| Métricas de uso de la key (APIs y servicios > Credenciales > key > Métricas) desde el 21 de octubre | Mathew Cordero | Pendiente |
| Usuarios de Firebase Authentication desconocidos | Mathew Cordero | Pendiente |
| Cargos inesperados en facturación del proyecto | Mathew Cordero | Pendiente |

## Propuesta

| Prioridad | Medida | Detalle |
| :---: | --- | --- |
| 1 | Restringir la key | Restricción de aplicación Android con el paquete `com.aina.news` y el SHA-1 del certificado de EAS. Limitar las APIs a `identitytoolkit.googleapis.com` y `securetoken.googleapis.com`. Es el control efectivo, porque la key seguirá dentro del APK. |
| 2 | Quitar el archivo del repositorio | `git rm --cached frontend/google-services.json` y agregar `frontend/google-services.json` a `.gitignore`. En CI, guardar el contenido como secreto del entorno `production` (por ejemplo, en base64) y escribir el archivo antes de `deploy/expo/build-ci.sh`. Para builds locales, cada integrante lo descarga de la consola de Firebase. Actualizar `docs/deploy/android-apk-paso-a-paso.md`. |
| 3 | Rotar la key | Quitar el archivo del árbol no lo borra del historial público (`27f8cec`). Si las métricas muestran uso ajeno, crear una key nueva restringida, regenerar `google-services.json` y eliminar la anterior. |
| 4 | Cerrar la alerta #1 | Tras aplicar las medidas 1 y 2, cerrar la alerta de secret scanning con la justificación de este documento. |
