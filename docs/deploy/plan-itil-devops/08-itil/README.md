# Relación con ITIL

**Prácticas de ITIL y aplicación concreta:**

| Práctica de ITIL 4 | Cómo la aplicamos |
| --- | --- |
| Habilitación del cambio | Todo cambio entra por pull request con pruebas, controles de seguridad y una aprobación (ruleset `main-protegida`). Los cambios en la nube, como la restricción de la API key de Firebase, siguen riesgo, reversa, autorización, verificación y cierre. |
| Gestión de liberaciones y despliegue | CD automático desde `main` al entorno `production`, verificación posterior y procedimiento para volver atrás. |
| Gestión de la configuración del servicio | Variables por entorno, secretos en Secret Manager e infraestructura como código en el repositorio. |
| Seguridad de la información | Controles automáticos en cada cambio y gestión de vulnerabilidades con riesgos aceptados y justificados. |
| Gestión financiera de servicios | Costos reales por proveedor, presupuestos con alertas y límites de uso de la IA. |
| Mejora continua | Cada apartado mide un antes y un después y deja propuestas priorizadas con responsable y plazo. |

Estas prácticas apoyan la gestión de cambios (nada llega a producción sin revisión ni pruebas), la calidad del servicio (pruebas, verificación posterior y escaneo de seguridad antes de publicar) y la mejora continua (indicadores medidos y propuestas priorizadas).

**Seguimiento:**

| Indicador | Meta | Revisa | Frecuencia |
| --- | --- | --- | --- |
| Tasa de éxito del pipeline | 90 % o más | Pedro Pablo Guzmán | Semanal |
| Pruebas aprobadas en cada PR | 100 % | Gustavo Cruz | En cada PR |
| Alertas de seguridad abiertas sin justificar | 0 | Josué Say | Semanal (escaneo de los lunes) |
| Commits con Conventional Commits | 90 % o más | José Gramajo | Mensual |
| Costo mensual frente al presupuesto | Por debajo de USD 25 | Mathew Cordero | Mensual |

