# Acceso a AI News desde el navegador del teléfono

Decisión del equipo, 2026-10-30: la vía para iPhone es la versión web móvil.
En este alcance no se desarrolla ni distribuye un instalador iOS.

**Enlace directo para compartir:** [Abrir AI News](https://adfasdfasfd-1899a.web.app/).

## Cómo usarla

1. Abrir el enlace en Safari desde iPhone o en el navegador del teléfono.
   Usar el navegador completo si un enlace abierto dentro de otra app impide el acceso Google.
2. Pulsar **Iniciar sesión con Google** y completar la autenticación. Regresar a la pestaña
   de AI News si Google abre otra ventana. La identidad y los permisos se resuelven con Firebase.
3. En una pantalla móvil sin ruta explícita, la app abre el asistente después del acceso.
   Usar **Inicio** para el feed, abrir una noticia para leerla y **Personalizar feed** para
   elegir ubicación simulada y temas. La ubicación es manual, sin GPS.
4. Para compartir una noticia, copiar su enlace desde el navegador. Un enlace directo conserva
   su ruta al entrar. No hace falta instalar Expo Go ni una app iPhone.

Si el navegador bloquea la ventana de Google, permitirla para este sitio y volver a pulsar
el botón. El acceso invitado está disponible cuando Firebase Anonymous está habilitado,
pero para la demostración del acceso Google se debe utilizar el botón correspondiente.

## Enlaces directos

| Destino | Enlace |
| --- | --- |
| Aplicación | [Abrir AI News](https://adfasdfasfd-1899a.web.app/) |
| Asistente | [Abrir chat](https://adfasdfasfd-1899a.web.app/#/asistente) |
| Feed | [Abrir noticias](https://adfasdfasfd-1899a.web.app/#/inicio) |
| Crear noticia | [Abrir panel administrativo](https://adfasdfasfd-1899a.web.app/#/admin/nueva) |

El enlace del panel requiere una cuenta con rol `admin` en el servidor; compartirlo no concede
permisos. No compartir tokens ni credenciales junto con estos enlaces.

## Alcance de la comprobación

El dominio se obtuvo del Project ID público de `frontend/google-services.json`, consistente
con el esquema de Hosting configurado en los scripts del proyecto. La raíz respondió HTTP 200
y contenido HTML en la comprobación de este loop. No se inició sesión con cuentas reales.
La revisión local de la web usa escenarios controlados; no constituye una prueba física de Safari.

La web publicada solo incorpora cambios que hayan sido desplegados. El nuevo selector de
imágenes de este loop queda preparado localmente y requiere publicar backend y frontend para
estar disponible en el enlace anterior. Este documento no afirma que exista una app iOS nativa.
