# 🎵 Ánima – Música que refleja cómo te sentís

Ánima es una aplicación web que detecta tu emoción a partir de una foto o utilizando tu cámara y recomienda música personalizada acorde a tu estado de ánimo.  
Su objetivo es ofrecer una experiencia distinta a las playlists estáticas: aquí la música **escucha tu momento presente**.  

---

## 🚀 Características principales

- **Cuenta y acceso** → Registro, login y logout.
- **Análisis de emoción** → Captura o subida de una foto y detección de la emoción dominante (con confianza).
- **Recomendaciones musicales** → Playlist personalizada mediante la aplicacion **Spotify**.
- **Historial personal** → Guarda análisis y playlists para repetir o comparar.
- **Navegación simple** → Flujo: Inicio → Analizar → Resultado → Historial/Perfil.

---

## 🛠️ Tecnologías utilizadas

### Frontend
- [React](https://react.dev/)  
- Componentes reutilizables y estados controlados  

### Backend
- [Python](https://www.python.org/)  
- API REST con JWT, manejo de historial y recomendaciones  

### Base de Datos
- [PostgreSQL](https://www.postgresql.org/)  

### Integraciones
- [AWS Rekognition](https://aws.amazon.com/es/rekognition/) → Análisis de emociones en imágenes  
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) → Recomendaciones musicales  

### Deploy
- AWS / Azure / Google Cloud (pendiente de selección)  

---

## ⚡ Instalación y ejecución local

### Requisitos previos
- Python 
- PostgreSQL
- Cuenta y credenciales en **AWS Rekognition**
- Credenciales de **Spotify Web API**

