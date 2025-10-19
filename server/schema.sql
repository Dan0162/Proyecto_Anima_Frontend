DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS password_recovery CASCADE;

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Tabla para códigos de recuperación de contraseña
CREATE TABLE password_recovery (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES usuario(id)
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_recovery_code ON password_recovery(code, user_id, is_used);
CREATE INDEX idx_recovery_expires ON password_recovery(expires_at);