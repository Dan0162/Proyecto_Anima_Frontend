FROM python:3.11-slim

# Evita archivos .pyc y buffer en stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema (solo las necesarias)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       gcc \
       libpq-dev \
       libjpeg-dev \
       zlib1g-dev \
       curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements.txt desde la carpeta server/
COPY server/requirements.txt ./

# Instalar dependencias Python
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# Copiar todo el código de la carpeta server al contenedor
COPY ./server /app/server

# Crear usuario no root
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

# Comando para iniciar el servidor
CMD ["uvicorn", "server.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
