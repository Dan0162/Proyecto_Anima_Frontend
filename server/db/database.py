from sqlalchemy import text
from server.db.session import engine

def init_db_from_sql():
    sql_file_path = "server/schema.sql"
    with engine.connect() as connection:
        # reemplazar la apertura del archivo SQL por una que especifique la codificación
        with open(sql_file_path, "r", encoding="utf-8") as file:
            sql_script = file.read()
            connection.execute(text(sql_script))
            connection.commit()