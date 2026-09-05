import sys
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text('ALTER TABLE users ADD COLUMN vector_embedding TEXT;'))
        conn.commit()
        print('Column added successfully!')
    except Exception as e:
        print('Error:', e)
