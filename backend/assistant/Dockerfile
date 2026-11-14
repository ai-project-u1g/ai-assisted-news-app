# Contexto de build: backend/ (ver docker-compose.yml). El modo news reutiliza
# los modelos y la configuración de backend/news.
FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Parches de seguridad del sistema base publicados después de la imagen oficial.
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY assistant/requirements.txt assistant/requirements-dev.txt ./assistant/
COPY news/requirements.txt news/requirements-dev.txt ./news/
RUN pip install --no-cache-dir -r assistant/requirements.txt -r news/requirements.txt

COPY assistant ./assistant
COPY news ./news

RUN chown -R nobody:nogroup /app
USER nobody

FROM base AS test

USER root
RUN pip install --no-cache-dir -r assistant/requirements-dev.txt -r news/requirements-dev.txt
USER nobody

FROM base AS runtime

# pip no se usa en runtime y trae dependencias propias con vulnerabilidades.
USER root
RUN python -m pip uninstall -y pip
USER nobody

EXPOSE 8010

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8010/health')"

CMD ["python", "-m", "assistant.news_chat.run"]
