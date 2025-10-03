from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime

app = Flask(__name__, static_folder='EXAM CRACKER', static_url_path='')
CORS(app)

DATABASE = 'exam_cracker.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            icon TEXT NOT NULL,
            display_order INTEGER DEFAULT 0
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subsections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subject_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            icon TEXT NOT NULL,
            display_order INTEGER DEFAULT 0,
            FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subsection_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            upload_method TEXT NOT NULL,
            file_url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (subsection_id) REFERENCES subsections (id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute("SELECT COUNT(*) as count FROM users WHERE username = 'praveen'")
    if cursor.fetchone()['count'] == 0:
        cursor.execute("INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)", 
                      ('praveen', 'PRAVEEN@1234', 1))
    
    cursor.execute("SELECT COUNT(*) as count FROM subjects")
    if cursor.fetchone()['count'] == 0:
        default_subjects = [
            ('தமிழ்', 'fa-book', 1),
            ('English', 'fa-language', 2),
            ('Mathematics', 'fa-calculator', 3),
            ('Physics', 'fa-atom', 4),
            ('Chemistry', 'fa-flask', 5),
            ('Biology', 'fa-dna', 6),
            ('Computer Science', 'fa-desktop', 7),
        ]
        cursor.executemany("INSERT INTO subjects (name, icon, display_order) VALUES (?, ?, ?)", 
                          default_subjects)
        
        subsections_data = [
            (1, 'தமிழ் கையேடு 2025-2026', 'fa-folder', 1),
            (2, 'English Material', 'fa-book', 1),
            (3, 'Maths Villupuram DST Average Material', 'fa-square-root-alt', 1),
            (3, 'Maths Formula Book', 'fa-square-root-alt', 2),
            (3, 'Maths COME Book', 'fa-square-root-alt', 3),
            (3, 'Maths Ram Maths Guide VOL-1', 'fa-square-root-alt', 4),
            (3, 'Maths Ram Maths Guide VOL-2', 'fa-square-root-alt', 5),
            (3, 'Maths Sura Guide', 'fa-square-root-alt', 6),
            (4, 'Physics Sura Guide', 'fa-cog', 1),
            (5, 'Chemistry Success Material', 'fa-leaf', 1),
            (6, 'Botany', 'fa-seedling', 1),
            (6, 'Zoology', 'fa-paw', 2),
            (7, 'Computer Science Material', 'fa-laptop', 1),
        ]
        cursor.executemany("INSERT INTO subsections (subject_id, name, icon, display_order) VALUES (?, ?, ?, ?)", 
                          subsections_data)
        
        documents_data = [
            (1, 'தமிழ் கையேடு 2025-2026', 'link', 'https://u.pcloud.link/publink/show?code=XZUXHs5ZMOsMQRHFsckhcYzxhmtNhHVylrJk'),
            (2, 'English Material', 'link', 'https://u.pcloud.link/publink/show?code=XZb5Hs5ZY2WrMvnHsR8cSXYVlCNtg8lJUsk7'),
            (3, 'Maths Villupuram DST Average Material', 'link', 'https://u.pcloud.link/publink/show?code=XZBFHs5ZzAt8eyzOOjj9RC403TxhEHhGj1T7'),
            (4, 'Maths Formula Book', 'link', 'https://u.pcloud.link/publink/show?code=XZlFHs5Z77uTfOQiezHi2LRksgP6iylFB9pV'),
            (5, 'Maths COME Book', 'link', 'https://u.pcloud.link/publink/show?code=XZTpHs5ZPFKUB33S6IpuiwUvRl0N6YN4FNV7'),
            (6, 'Maths Ram Maths Guide VOL-1', 'link', 'https://u.pcloud.link/publink/show?code=XZYHHs5ZYRreO6p8vW86KYoQ7vrtQBxyC7py'),
            (7, 'Maths Ram Maths Guide VOL-2', 'link', 'https://u.pcloud.link/publink/show?code=XZdHHs5ZbvPGYuNTKc8zFU8SLpORBpzPWImy'),
            (8, 'Maths Sura Guide', 'link', 'https://u.pcloud.link/publink/show?code=XZYzHs5ZGOpBGy2fQGFxfqsvCylGj8NKOMfV'),
            (9, 'Physics Sura Guide', 'link', 'https://u.pcloud.link/publink/show?code=XZzLHs5Z5zM8LaptnoVJY7Ft6C9vb7SeG3Wy'),
        ]
        cursor.executemany("INSERT INTO documents (subsection_id, name, upload_method, file_url) VALUES (?, ?, ?, ?)", 
                          documents_data)
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
    user = cursor.fetchone()
    
    if user:
        conn.close()
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'is_admin': bool(user['is_admin'])
            }
        })
    
    cursor.execute("INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)", 
                  (username, password, 0))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    
    return jsonify({
        'success': True,
        'user': {
            'id': user_id,
            'username': username,
            'is_admin': False
        }
    })

@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM subjects ORDER BY display_order")
    subjects = [dict(row) for row in cursor.fetchall()]
    
    for subject in subjects:
        cursor.execute("SELECT * FROM subsections WHERE subject_id = ? ORDER BY display_order", 
                      (subject['id'],))
        subsections = [dict(row) for row in cursor.fetchall()]
        
        for subsection in subsections:
            cursor.execute("SELECT * FROM documents WHERE subsection_id = ? ORDER BY created_at DESC", 
                          (subsection['id'],))
            subsection['documents'] = [dict(row) for row in cursor.fetchall()]
        
        subject['subsections'] = subsections
    
    conn.close()
    return jsonify({'subjects': subjects})

@app.route('/api/subsections', methods=['POST'])
def add_subsection():
    data = request.json
    subject_id = data.get('subject_id')
    name = data.get('name')
    icon = data.get('icon', 'fa-folder')
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT MAX(display_order) as max_order FROM subsections WHERE subject_id = ?", 
                  (subject_id,))
    result = cursor.fetchone()
    next_order = (result['max_order'] or 0) + 1
    
    cursor.execute("INSERT INTO subsections (subject_id, name, icon, display_order) VALUES (?, ?, ?, ?)",
                  (subject_id, name, icon, next_order))
    conn.commit()
    subsection_id = cursor.lastrowid
    conn.close()
    
    return jsonify({'success': True, 'id': subsection_id})

@app.route('/api/subsections/<int:subsection_id>', methods=['DELETE'])
def delete_subsection(subsection_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM subsections WHERE id = ?", (subsection_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/documents', methods=['POST'])
def add_document():
    data = request.json
    subsection_id = data.get('subsection_id')
    name = data.get('name')
    upload_method = data.get('upload_method')
    file_url = data.get('file_url')
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO documents (subsection_id, name, upload_method, file_url) VALUES (?, ?, ?, ?)",
                  (subsection_id, name, upload_method, file_url))
    conn.commit()
    document_id = cursor.lastrowid
    conn.close()
    
    return jsonify({'success': True, 'id': document_id})

@app.route('/api/documents/<int:document_id>', methods=['DELETE'])
def delete_document(document_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE id = ?", (document_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
