# Sistema de Autenticación Mejorado

## Cambios Realizados

### Backend
1. **Nuevo endpoint `/v1/auth/me`**: Permite obtener información del usuario autenticado actual
2. **Funciones de autenticación**:
   - `get_current_user_email()`: Extrae el email del token JWT
   - `get_current_user()`: Obtiene el usuario completo desde la base de datos
3. **Seguridad mejorada**: Validación automática de tokens con FastAPI dependencies

### Frontend
1. **Hook `useCurrentUser`**: Obtiene automáticamente el usuario desde el backend
2. **Hook `useAuth`**: Sistema completo de autenticación con contexto (opcional)
3. **API function `getCurrentUserApi`**: Función para llamar al endpoint `/v1/auth/me`

### Componentes Actualizados
- **EmotionAnalyzer**: Ahora obtiene el nombre del usuario automáticamente
- **Sidebar**: Usa el hook para mostrar el nombre y tiene logout funcional
- **AnalyzePage**: Simplificado, ya no maneja estado de usuario manualmente

## Cómo Usar

### En cualquier componente:
```jsx
import { useCurrentUser } from '../hooks/useAuth';

const MyComponent = () => {
  const { user, loading, error } = useCurrentUser();
  
  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>Hola, {user?.nombre}!</div>;
};
```

### Para proteger rutas:
```jsx
import { useAuth } from '../hooks/useAuth';

const ProtectedComponent = () => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }
  
  return <div>Contenido protegido para {user.nombre}</div>;
};
```

## Ventajas
- ✅ Nombre del usuario siempre actualizado desde el backend
- ✅ No depende de localStorage para información del usuario
- ✅ Validación automática de tokens
- ✅ Fácil manejo de sesiones expiradas
- ✅ Código más limpio y mantenible

## Prueba
1. Iniciar el backend: `uvicorn server.app.main:app --reload`
2. Ir a http://127.0.0.1:8000/docs para ver el nuevo endpoint
3. Hacer login en el frontend y verificar que aparezca el nombre correcto