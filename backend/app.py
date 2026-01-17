from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend-backend communication

# In-memory storage for notes
notes = []
current_id = 1

# Helper function to save notes to JSON file (optional persistence)
def save_notes_to_file():
    try:
        with open('notes_data.json', 'w') as f:
            json.dump(notes, f)
    except:
        pass  # If file operations fail, continue with in-memory

# Load notes from file if exists
try:
    if os.path.exists('notes_data.json'):
        with open('notes_data.json', 'r') as f:
            notes = json.load(f)
            if notes:
                current_id = max(note['id'] for note in notes) + 1
except:
    notes = []
    current_id = 1

@app.route('/')
def home():
    return "Notes App Backend is running!"

@app.route('/notes', methods=['GET'])
def get_notes():
    """Get all notes"""
    return jsonify(notes)

@app.route('/notes', methods=['POST'])
def add_note():
    """Add a new note"""
    global current_id
    
    data = request.json
    
    # Validation
    if not data or 'title' not in data or 'content' not in data:
        return jsonify({'error': 'Title and content are required'}), 400
    
    title = data['title'].strip()
    content = data['content'].strip()
    
    if not title or not content:
        return jsonify({'error': 'Title and content cannot be empty'}), 400
    
    # Create new note
    new_note = {
        'id': current_id,
        'title': title,
        'content': content,
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    notes.append(new_note)
    current_id += 1
    
    # Save to file
    save_notes_to_file()
    
    return jsonify(new_note), 201

@app.route('/notes/<int:note_id>', methods=['DELETE'])
def delete_note(note_id):
    """Delete a note by ID"""
    global notes
    
    # Find and remove note
    for i, note in enumerate(notes):
        if note['id'] == note_id:
            deleted_note = notes.pop(i)
            save_notes_to_file()
            return jsonify({'message': 'Note deleted successfully', 'deleted_note': deleted_note})
    
    return jsonify({'error': 'Note not found'}), 404

@app.route('/notes/<int:note_id>', methods=['PUT'])
def update_note(note_id):
    """Update a note (Bonus feature)"""
    data = request.json
    
    # Find the note
    for note in notes:
        if note['id'] == note_id:
            if 'title' in data and data['title'].strip():
                note['title'] = data['title'].strip()
            if 'content' in data and data['content'].strip():
                note['content'] = data['content'].strip()
            
            note['timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            save_notes_to_file()
            return jsonify(note)
    
    return jsonify({'error': 'Note not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)