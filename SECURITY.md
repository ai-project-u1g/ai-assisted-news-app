# Política de seguridad

Referencia oficial: [Reporte privado de vulnerabilidades en GitHub](https://docs.github.com/es/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability).

## Versiones con soporte

| Versión | Soporte |
| --- | --- |
| `main` (desplegada en Cloud Run, Firebase Hosting y el APK de Android) | Sí |
| Ramas de trabajo y versiones anteriores | No |

## Cómo reportar una vulnerabilidad

No abras un issue público ni un pull request con los detalles.

Usa el reporte privado de GitHub:
[Report a vulnerability](https://github.com/ai-project-u1g/ai-assisted-news-app/security/advisories/new).

Incluye, si es posible:

- componente afectado (API de noticias, chatbot, frontend web o app de Android);
- pasos para reproducir y el impacto esperado;
- versión o commit donde lo observaste.

No incluyas credenciales reales ni datos personales de terceros en el reporte.

## Qué esperar

| Paso | Plazo |
| --- | --- |
| Confirmación de recepción | 5 días hábiles |
| Evaluación de severidad y respuesta inicial | 10 días hábiles |
| Corrección o mitigación | Según la severidad, por pull request con los controles de `security.yml` |

Cada reporte se trata como un incidente de seguridad: se registra, se evalúa su impacto, la
corrección entra como cambio revisado y se cierra con la verificación. El flujo y los controles están
descritos en [6 Gestión de seguridad DevSecOps](docs/deploy/plan-itil-devops/06-seguridad/README.md).

## Fuera de alcance

- La API key de Firebase en `frontend/google-services.json`: es configuración pública del APK y está
  restringida a la app y a las APIs necesarias. Ver
  [el hallazgo documentado](docs/deploy/plan-itil-devops/06-seguridad/evidencias/hallazgo-firebase-api-key.md).
- Vulnerabilidades en dependencias que ya tienen una alerta abierta o descartada con justificación en
  Dependabot.
