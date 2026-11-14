# Datos generales

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

