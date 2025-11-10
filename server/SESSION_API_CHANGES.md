
# Cambios en la API de Sesiones para Integración con el Frontend

## Resumen
Estos cambios agregan el seguimiento de sesiones al backend. Cuando un usuario inicia sesión, se crea un nuevo registro en la tabla `sesion` de la base de datos. El ID de la sesión se devuelve en la respuesta del login y debe usarse para futuras acciones, incluido el cierre de sesión. Esto permite rastrear la actividad y duración de cada sesión de usuario.

## Cambios en el Backend
- **Inicio de sesión:**
  - Cuando un usuario inicia sesión, se inserta un nuevo registro en la tabla `sesion`.
  - La API de login ahora devuelve un campo `session_id` en la respuesta.
- **Cierre de sesión:**
  - Hay un nuevo endpoint `/logout` disponible.
  - El frontend debe enviar el `session_id` a este endpoint para marcar la sesión como finalizada (se actualiza el campo `fecha_fin`).

## Detalles de la API

### Login
- **Endpoint:** `/login` (POST)
- **Solicitud:**
  ```json
  {
    "email": "usuario@ejemplo.com",
    "password": "tucontraseña"
  }
  ```
- **Respuesta:**
  ```json
  {
    "access_token": "...",
    "token_type": "bearer",
    "session_id": 123
  }
  ```
- **Acción en el frontend:**
  - Guarda el `session_id` recibido al iniciar sesión. Lo necesitarás para el cierre de sesión y otras acciones relacionadas con la sesión.

### Logout
- **Endpoint:** `/logout` (POST)
- **Solicitud:**
  ```json
  {
    "session_id": 123
  }
  ```
- **Respuesta:**
  ```json
  {
    "success": true
  }
  ```
- **Acción en el frontend:**
  - Al cerrar sesión, envía el `session_id` guardado al endpoint `/logout`.
  - Esto marcará la sesión como finalizada en el backend.

## Notas de uso
- El `session_id` es obligatorio para cualquier acción relacionada con la sesión en el backend.
- Si necesitas asociar otras acciones (por ejemplo, análisis, recomendaciones) a una sesión, utiliza el `session_id` como referencia.
- Si el usuario cierra sesión y vuelve a iniciar, se creará una nueva sesión y se devolverá un nuevo `session_id`.

## Ejemplo de integración
```js
// Al iniciar sesión
const { access_token, session_id } = await api.login(email, password);
localStorage.setItem('session_id', session_id);

// Al cerrar sesión
const session_id = localStorage.getItem('session_id');
await api.logout({ session_id });
localStorage.removeItem('session_id');
```

## Contacto
Si tienes dudas sobre la API de sesiones del backend, contacta al equipo de backend.
