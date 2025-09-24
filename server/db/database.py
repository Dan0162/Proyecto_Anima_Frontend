from sqlalchemy import text
from server.db.session import engine

def init_db_from_sql():
    with engine.connect() as connection:
        with open("server/schema.sql", "r") as file:
            sql_script = file.read()
            connection.execute(text(sql_script))
            connection.commit()