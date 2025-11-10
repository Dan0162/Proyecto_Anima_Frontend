import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Cargar variables del archivo .env ubicado en la carpeta "server"
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=env_path)

engine = None

def init_database():
    """
    Inicializa la conexión a la base de datos usando DATABASE_URL del entorno.
    Si no existe, intenta cargarla desde el archivo .env.
    """
    global engine
    database_url = os.environ.get("DATABASE_URL")

    if not database_url:
        raise RuntimeError(f"DATABASE_URL no está configurada en el entorno ni en {env_path}.")

    try:
        engine = create_engine(database_url, connect_args={})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Conexión a la base de datos exitosa.")
    except Exception as e:
        raise RuntimeError(f"❌ Error al conectar con la base de datos: {e}")


