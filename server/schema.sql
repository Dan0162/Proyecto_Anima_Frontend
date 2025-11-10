DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS recuperacion_contrasena CASCADE;
DROP TABLE IF EXISTS emocion CASCADE;
DROP TABLE IF EXISTS sesion CASCADE;
DROP TABLE IF EXISTS cancion CASCADE;
DROP TABLE IF EXISTS analisis CASCADE;
DROP TABLE IF EXISTS analisis_cancion CASCADE;

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL
);

CREATE TABLE emocion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sesion(
    id SERIAL PRIMARY KEY,
    ID_usuario INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP
);

CREATE TABLE analisis (
    id SERIAL PRIMARY KEY,
    ID_sesion INTEGER NOT NULL REFERENCES sesion(id) ON DELETE CASCADE,
    ID_emocion INTEGER NOT NULL REFERENCES emocion(id) ON DELETE CASCADE,
    fecha_analisis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence FLOAT DEFAULT 0.0,
    emotions_detected JSONB
);

CREATE TABLE cancion (
    id SERIAL PRIMARY KEY,
    ID_emocion INTEGER NOT NULL REFERENCES emocion(id) ON DELETE CASCADE,
    titulo VARCHAR(100) NOT NULL,
    artista VARCHAR(100),
    album VARCHAR(100)
);

CREATE TABLE analisis_cancion (
    ID_analisis INTEGER NOT NULL REFERENCES analisis(id) ON DELETE CASCADE,
    ID_cancion INTEGER NOT NULL REFERENCES cancion(id) ON DELETE CASCADE,
    PRIMARY KEY (ID_analisis, ID_cancion)
);

-- Tabla para códigos de recuperación de contraseña
CREATE TABLE recuperacion_contrasena (
    id SERIAL PRIMARY KEY,
    ID_usuario INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    codigo VARCHAR(6) NOT NULL,
    hora_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hora_expiracion TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_user FOREIGN KEY (ID_usuario) REFERENCES usuario(id)
);

-- Índices para búsquedas rápidas (usar IF NOT EXISTS para evitar errores si ya existen)
CREATE INDEX IF NOT EXISTS idx_recovery_code ON recuperacion_contrasena(codigo, ID_usuario, usado);
CREATE INDEX IF NOT EXISTS idx_recovery_expires ON recuperacion_contrasena(hora_expiracion);
CREATE INDEX IF NOT EXISTS idx_analisis_sesion ON analisis(ID_sesion);
CREATE INDEX IF NOT EXISTS idx_analisis_emocion ON analisis(ID_emocion);
CREATE INDEX IF NOT EXISTS idx_analisis_cancion_analisis ON analisis_cancion(ID_analisis);
CREATE INDEX IF NOT EXISTS idx_analisis_cancion_cancion ON analisis_cancion(ID_cancion);