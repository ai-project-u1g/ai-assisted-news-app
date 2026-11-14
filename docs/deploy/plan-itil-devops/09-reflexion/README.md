# Análisis y reflexión

Cada integrante agrega la subsección de su componente bajo cada pregunta.

## 1. ¿Cuáles son las principales ventajas obtenidas con las prácticas implementadas?

### Gestión de seguridad (DevSecOps)

- **La seguridad se volvió un gate automático y no una revisión manual.** El workflow `security`
  corre en cada pull request, en `main` y cada lunes. En el primer escaneo detuvo el PR #13 con 18
  alertas altas; ningún cambio llega a `main` sin pasar por los mismos 7 controles.
- **Los hallazgos se midieron y se cerraron con evidencia.** En un día se pasó de 78 alertas de
  Dependabot, 18 de code scanning y 1 de secret scanning a 0 abiertas, con 2 riesgos aceptados y
  justificados. Detalle en [6 Gestión de seguridad](../06-seguridad/README.md#estado-y-resultado).
- **Analizar el artefacto desplegado encontró lo que el análisis de archivos no veía.** pip-audit
  sobre `requirements.txt` no reportó nada, pero Trivy sobre la imagen de Cloud Run encontró
  `urllib3` y `msgpack` vulnerables dentro de pip. La corrección redujo la imagen de `news-api` de
  308 MB a 284 MB y quitó herramientas que no se usan en producción.
- **El pipeline también protegió la estabilidad, no solo la seguridad.** Dependabot propuso React
  Native 0.88, incompatible con el SDK 57 de Expo, y el typecheck del CI rechazó el PR #39 antes de
  que llegara a producción.
- **Los cambios de configuración en la nube quedaron gestionados.** La restricción de la API key de
  Firebase siguió el flujo de habilitación de cambios de ITIL (riesgo, reversa, autorización,
  verificación y cierre) y se comprobó con login en web y Android.

## 2. ¿Cuáles fueron los retos o dificultades más importantes durante su implementación?

### Gestión de seguridad (DevSecOps)

- **Falsos positivos.** gitleaks confundió con una API key el nombre temporal del contenedor dentro
  del reporte de ZAP, y como en CI revisa todas las ramas, hizo fallar PRs ajenos. La primera
  excepción se ató al SHA del commit y dejó de servir tras el squash merge; se resolvió con una
  excepción por patrón en `.gitleaks.toml`. Aprendizaje: una excepción debe describir el patrón
  falso, no el commit donde apareció.
- **Dependencias que no se pueden corregir sin romper la plataforma.** `minimatch` y `uuid` solo
  tienen corrección en versiones incompatibles con Expo 57. Se aceptaron como riesgo con
  justificación verificada en el código, en lugar de forzar una actualización que rompiera el APK.
- **Ruido de las herramientas automáticas.** La primera corrida de Dependabot abrió 23 PRs, varios
  con saltos mayores. Hubo que agrupar actualizaciones y excluir los paquetes que administra Expo.
- **Coordinar con el equipo.** La API key estaba en el proyecto de Google Cloud de otro integrante;
  el cambio esperó su autorización y su prueba en el teléfono. La protección de `main` se pospuso
  al cierre para no bloquear al resto del equipo, que integra documentación directamente.
- **Separar riesgo real de riesgo aparente.** La key de Firebase en el repositorio es configuración
  pública del APK; el problema real no era que estuviera visible, sino que no tenía restricciones.

## 3. ¿Qué mejoras implementarían para evolucionar su solución?

### Gestión de seguridad (DevSecOps)

| Prioridad | Mejora | Enfoque | Responsable | Plazo |
| :---: | --- | --- | --- | --- |
| 1 | Ruleset en `main`: pull request, una aprobación y checks de `security` obligatorios | Automatización | Josué Say | Al cierre de la entrega |
| 2 | Desactivar `/docs` y `/openapi.json` en producción, como exige el ADR 0001 | DevSecOps | Josué Say | 1 semana |
| 3 | Alertas de Cloud Monitoring por picos de respuestas 401 y 429 y por costo del chat, con rate limit en `/chat` | DevSecMonOps, monitoreo y FinOps | Josué Say con el responsable de FinOps | 2 semanas |
| 4 | Restringir la Browser key de Firebase a los dominios de Hosting | DevSecOps | Mathew Cordero | 1 semana |
| 5 | Lockfile de Python con hashes para builds reproducibles | Automatización | Josué Say | 2 semanas |
| 6 | SBOM y firma de imágenes en Artifact Registry | Cadena de suministro | Josué Say | 1 mes |
| 7 | Migrar de SDK de Expo para cerrar `minimatch` y `uuid` | Mantenimiento | Responsable del frontend | Siguiente SDK estable |
