# test_connection.py
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("SELECT 1"))
    print("Successfully connected!")