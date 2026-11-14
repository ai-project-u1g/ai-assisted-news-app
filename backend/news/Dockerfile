FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend

WORKDIR /app/backend

# Parches de seguridad del sistema base publicados después de la imagen oficial.
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY backend/news/requirements*.txt /tmp/news-requirements/
RUN pip install --no-cache-dir -r /tmp/news-requirements/requirements.txt

# Herramientas de desarrollo: pruebas, seeders y scripts de make (docker-compose).
FROM base AS tools

RUN pip install --no-cache-dir -r /tmp/news-requirements/requirements-dev.txt

COPY backend /app/backend

RUN chown -R nobody:nogroup /app
USER nobody

EXPOSE 8020

CMD ["python", "-m", "uvicorn", "news.api:app", "--host", "0.0.0.0", "--port", "8020"]

# Imagen de Cloud Run (etapa por defecto): solo el paquete news y sin pip, que en
# runtime no se usa y trae dependencias propias con vulnerabilidades.
FROM base AS runtime

COPY backend/news /app/backend/news

RUN python -m pip uninstall -y pip \
    && chown -R nobody:nogroup /app
USER nobody

EXPOSE 8020

CMD ["python", "-m", "uvicorn", "news.api:app", "--host", "0.0.0.0", "--port", "8020"]
