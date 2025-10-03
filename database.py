import sqlite3
import json
from datetime import datetime

class Database:
    def __init__(self, db_file='exam_cracker.db'):
        self.db_file = db_file
        self.init_db()
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_file)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS subsections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                name TEXT NOT NULL,
                icon TEXT DEFAULT 'fa-folder',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                subcategory TEXT NOT NULL,
                name TEXT NOT NULL,
                link TEXT NOT NULL,
                drive_id TEXT,
                uploaded_by TEXT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def add_subsection(self, category, name, icon='fa-folder'):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO subsections (category, name, icon) VALUES (?, ?, ?)',
            (category, name, icon)
        )
        subsection_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return subsection_id
    
    def get_subsections(self, category=None):
        conn = self.get_connection()
        cursor = conn.cursor()
        if category:
            cursor.execute('SELECT * FROM subsections WHERE category = ? ORDER BY created_at', (category,))
        else:
            cursor.execute('SELECT * FROM subsections ORDER BY created_at')
        subsections = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return subsections
    
    def delete_subsection(self, subsection_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT category, name FROM subsections WHERE id = ?', (subsection_id,))
        subsection = cursor.fetchone()
        if subsection:
            cursor.execute('DELETE FROM documents WHERE category = ? AND subcategory = ?', 
                          (subsection['category'], subsection['name']))
            cursor.execute('DELETE FROM subsections WHERE id = ?', (subsection_id,))
        conn.commit()
        conn.close()
        return True
    
    def add_document(self, category, subcategory, name, link, drive_id=None, uploaded_by=None):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO documents (category, subcategory, name, link, drive_id, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
            (category, subcategory, name, link, drive_id, uploaded_by)
        )
        doc_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return doc_id
    
    def get_documents(self, category=None, subcategory=None):
        conn = self.get_connection()
        cursor = conn.cursor()
        if category and subcategory:
            cursor.execute('SELECT * FROM documents WHERE category = ? AND subcategory = ? ORDER BY uploaded_at DESC', 
                          (category, subcategory))
        elif category:
            cursor.execute('SELECT * FROM documents WHERE category = ? ORDER BY uploaded_at DESC', (category,))
        else:
            cursor.execute('SELECT * FROM documents ORDER BY uploaded_at DESC')
        documents = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return documents
    
    def delete_document(self, doc_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM documents WHERE id = ?', (doc_id,))
        conn.commit()
        conn.close()
        return True
