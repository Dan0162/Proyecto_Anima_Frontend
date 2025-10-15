import asyncio
from sqlalchemy import text
from server.db.session import engine

async def init_db_from_sql():
    # Ejecutar operaciones de I/O en un thread separado
    await asyncio.to_thread(_sync_init_db)

def _sync_init_db():
    """Función síncrona que se ejecuta en thread separado"""
    with engine.connect() as connection:
        with open("server/schema.sql", "r", encoding="utf-8") as file:
            sql_script = file.read()
            connection.execute(text(sql_script))
            connection.commit()