// Configuration
const API_BASE_URL = 'http://localhost:5000';
let currentEditNoteId = null;

// DOM Elements
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const addBtn = document.getElementById('add-btn');
const clearBtn = document.getElementById('clear-btn');
const notesContainer = document.getElementById('notes-container');
const notesCount = document.getElementById('notes-count');
const errorMessage = document.getElementById('error-message');
const editModal = document.getElementById('edit-modal');
const closeModal = document.querySelector('.close');
const cancelEdit = document.getElementById('cancel-edit');
const saveEdit = document.getElementById('save-edit');
const editTitle = document.getElementById('edit-title');
const editContent = document.getElementById('edit-content');

// Character Count Elements
const titleCount = document.getElementById('title-count');
const contentCount = document.getElementById('content-count');
const editTitleCount = document.getElementById('edit-title-count');
const editContentCount = document.getElementById('edit-content-count');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    setupEventListeners();
    setupCharacterCounters();
});

// Event Listeners Setup
function setupEventListeners() {
    // Add note button
    addBtn.addEventListener('click', addNote);
    
    // Clear form button
    clearBtn.addEventListener('click', clearForm);
    
    // Enter key to add note
    titleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !addBtn.disabled) addNote();
    });
    
    contentInput.addEventListener('keypress', (e) => {
        if (e.ctrlKey && e.key === 'Enter' && !addBtn.disabled) addNote();
    });
    
    // Form validation on input
    titleInput.addEventListener('input', validateForm);
    contentInput.addEventListener('input', validateForm);
    
    // Modal events
    closeModal.addEventListener('click', () => editModal.style.display = 'none');
    cancelEdit.addEventListener('click', () => editModal.style.display = 'none');
    saveEdit.addEventListener('click', saveEditedNote);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });
}

// Setup character counters
function setupCharacterCounters() {
    titleInput.addEventListener('input', () => {
        titleCount.textContent = `${titleInput.value.length}/100`;
    });
    
    contentInput.addEventListener('input', () => {
        contentCount.textContent = `${contentInput.value.length}/500`;
    });
    
    editTitle.addEventListener('input', () => {
        editTitleCount.textContent = `${editTitle.value.length}/100`;
    });
    
    editContent.addEventListener('input', () => {
        editContentCount.textContent = `${editContent.value.length}/500`;
    });
}

// Form Validation
function validateForm() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    addBtn.disabled = !(title && content);
    
    if (title && content) {
        errorMessage.classList.remove('show');
    }
}

// Clear Form
function clearForm() {
    titleInput.value = '';
    contentInput.value = '';
    titleCount.textContent = '0/100';
    contentCount.textContent = '0/500';
    addBtn.disabled = true;
    errorMessage.classList.remove('show');
    titleInput.focus();
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Load Notes from Backend
async function loadNotes() {
    try {
        // Show loading state
        notesContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;
        
        const response = await fetch(`${API_BASE_URL}/notes`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const notes = await response.json();
        displayNotes(notes);
        
        // Update count
        notesCount.textContent = notes.length;
        
        if (notes.length === 0) {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        showError('Failed to load notes. Make sure the backend server is running.');
        showEmptyState();
    }
}

// Display Notes
function displayNotes(notes) {
    if (!notes || notes.length === 0) {
        showEmptyState();
        return;
    }
    
    // Sort notes by timestamp (newest first)
    notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    notesContainer.innerHTML = '';
    
    notes.forEach(note => {
        const noteElement = createNoteElement(note);
        notesContainer.appendChild(noteElement);
    });
}

// Show Empty State
function showEmptyState() {
    notesContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <h3>No notes yet</h3>
            <p>Add your first note to get started! ✨</p>
        </div>
    `;
    notesCount.textContent = '0';
}

// Create Note Element
function createNoteElement(note) {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note-card';
    noteDiv.dataset.id = note.id;
    
    // Format timestamp for display
    const timestamp = new Date(note.timestamp);
    const formattedTime = timestamp.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    noteDiv.innerHTML = `
        <div class="note-header">
            <div class="note-title">${escapeHtml(note.title)}</div>
            <div class="note-actions">
                <button class="btn btn-success edit-btn" title="Edit note">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-btn" title="Delete note">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="note-content">${escapeHtml(note.content).replace(/\n/g, '<br>')}</div>
        <div class="note-footer">
            <div class="note-timestamp">
                <i class="far fa-clock"></i> ${formattedTime}
            </div>
            <div class="note-id">#${note.id}</div>
        </div>
    `;
    
    // Add event listeners to buttons
    const deleteBtn = noteDiv.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteNote(note.id));
    
    const editBtn = noteDiv.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => openEditModal(note));
    
    return noteDiv;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show Error Message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Add Note
async function addNote() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title || !content) {
        showError('Please fill in both title and content');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, content })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add note');
        }
        
        const newNote = await response.json();
        
        // Clear form and show success
        clearForm();
        showToast('Note added successfully!', 'success');
        
        // Reload notes
        loadNotes();
        
    } catch (error) {
        console.error('Error adding note:', error);
        showError(error.message);
    }
}

// Delete Note
async function deleteNote(noteId) {
    // Confirmation dialog
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete note');
        }
        
        showToast('Note deleted successfully!', 'success');
        
        // Remove note from DOM immediately
        const noteElement = document.querySelector(`.note-card[data-id="${noteId}"]`);
        if (noteElement) {
            noteElement.style.opacity = '0';
            noteElement.style.transform = 'scale(0.9)';
            
            setTimeout(() => {
                noteElement.remove();
                loadNotes(); // Reload to update count
            }, 300);
        } else {
            loadNotes();
        }
        
    } catch (error) {
        console.error('Error deleting note:', error);
        showError('Failed to delete note');
    }
}

// Open Edit Modal
function openEditModal(note) {
    currentEditNoteId = note.id;
    editTitle.value = note.title;
    editContent.value = note.content;
    editTitleCount.textContent = `${note.title.length}/100`;
    editContentCount.textContent = `${note.content.length}/500`;
    editModal.style.display = 'block';
}

// Save Edited Note
async function saveEditedNote() {
    if (!currentEditNoteId) return;
    
    const title = editTitle.value.trim();
    const content = editContent.value.trim();
    
    if (!title || !content) {
        showToast('Title and content cannot be empty', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/notes/${currentEditNoteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, content })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update note');
        }
        
        // Close modal and show success
        editModal.style.display = 'none';
        showToast('Note updated successfully!', 'success');
        
        // Reload notes
        loadNotes();
        
    } catch (error) {
        console.error('Error updating note:', error);
        showToast('Failed to update note', 'error');
    }
}

// Initialize with sample data if empty (for demo purposes)
async function initializeSampleData() {
    try {
        const response = await fetch(`${API_BASE_URL}/notes`);
        const notes = await response.json();
        
        if (notes.length === 0) {
            // Add a welcome note
            const welcomeNote = {
                title: "Welcome to Notes Manager!",
                content: "This is your first note. You can:\n• Add new notes using the form above\n• Edit notes by clicking the edit button\n• Delete notes by clicking the trash icon\n\nTry creating your own notes!"
            };
            
            await fetch(`${API_BASE_URL}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(welcomeNote)
            });
            
            loadNotes();
        }
    } catch (error) {
        console.log("Backend not available or already has notes");
    }
}

// Call sample data initialization after a delay
setTimeout(initializeSampleData, 1000);