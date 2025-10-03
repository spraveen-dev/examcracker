let isAdmin = false;
let subjects = [];

document.addEventListener('DOMContentLoaded', function() {
    const userIsAdmin = localStorage.getItem('isAdmin') === 'true';
    isAdmin = userIsAdmin;
    
    loadMaterials();
});

async function loadMaterials() {
    try {
        const response = await fetch('/api/subjects');
        const data = await response.json();
        subjects = data.subjects;
        
        renderMaterials();
    } catch (error) {
        console.error('Error loading materials:', error);
        showNotification('Failed to load materials', 'error');
    }
}

function renderMaterials() {
    const container = document.getElementById('materialsContainer');
    container.innerHTML = '';
    
    subjects.forEach(subject => {
        const subjectHTML = createSubjectHTML(subject);
        container.insertAdjacentHTML('beforeend', subjectHTML);
    });
    
    attachEventListeners();
}

function createSubjectHTML(subject) {
    let subsectionsHTML = '';
    
    if (subject.subsections && subject.subsections.length > 0) {
        subject.subsections.forEach(subsection => {
            subsectionsHTML += createSubsectionHTML(subject.id, subsection);
        });
    }
    
    const addSubsectionButton = isAdmin ? `
        <button class="add-subsection-btn" onclick="showAddSubsectionModal(${subject.id}, '${subject.name}')">
            <i class="fas fa-plus"></i> Add New Subsection
        </button>
    ` : '';
    
    return `
        <div class="accordion-item">
            <div class="accordion-header" data-subject="${subject.name}">
                <i class="fas ${subject.icon} subject-icon"></i>
                <span class="subject-name">${subject.name}</span>
                <i class="fas fa-chevron-down toggle-icon"></i>
            </div>
            <div class="accordion-content">
                ${addSubsectionButton}
                ${subsectionsHTML}
            </div>
        </div>
    `;
}

function createSubsectionHTML(subjectId, subsection) {
    let documentsHTML = '';
    
    if (subsection.documents && subsection.documents.length > 0) {
        subsection.documents.forEach(doc => {
            const deleteBtn = isAdmin ? `
                <button class="delete-doc-btn" onclick="deleteDocument(${doc.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            ` : '';
            
            const uploadIcon = doc.upload_method === 'drive' 
                ? '<i class="fas fa-file-alt"></i>' 
                : '<i class="fas fa-file-pdf"></i>';
            
            documentsHTML += `
                <div class="material-item" data-doc-id="${doc.id}">
                    ${uploadIcon}
                    <a href="${doc.file_url}" target="_blank" class="material-link">
                        <span>${doc.name}</span>
                    </a>
                    <div class="material-actions">
                        <a href="${doc.file_url}" target="_blank">
                            <button class="download-btn" onclick="downloadFile('${doc.name}')">
                                <i class="fas fa-download"></i>
                            </button>
                        </a>
                        ${deleteBtn}
                    </div>
                </div>
            `;
        });
    }
    
    const uploadBtn = isAdmin ? `
        <button class="upload-doc-btn" onclick="showUploadModal(${subsection.id}, '${subsection.name}', '${subsection.subject_id}')">
            <i class="fas fa-upload"></i> Upload Document
        </button>
    ` : '';
    
    const deleteSubsectionBtn = isAdmin ? `
        <button class="delete-subsection-btn" onclick="deleteSubsection(${subsection.id})" title="Delete Section">
            <i class="fas fa-trash"></i>
        </button>
    ` : '';
    
    return `
        <div class="subcategory" data-subsection-id="${subsection.id}">
            <div class="subcategory-header" data-subcategory="${subsection.name}">
                <i class="fas ${subsection.icon}"></i>
                <span>${subsection.name}</span>
                <div class="subsection-actions">
                    ${deleteSubsectionBtn}
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
            <div class="subcategory-content">
                ${uploadBtn}
                ${documentsHTML}
            </div>
        </div>
    `;
}

function showAddSubsectionModal(subjectId, subjectName) {
    const modal = document.getElementById('addSubsectionModal');
    document.getElementById('addSubsectionSubjectName').textContent = subjectName;
    document.getElementById('addSubsectionSubjectId').value = subjectId;
    document.getElementById('subsectionNameInput').value = '';
    document.getElementById('subsectionIconInput').value = 'fa-folder';
    modal.style.display = 'flex';
}

function closeAddSubsectionModal() {
    document.getElementById('addSubsectionModal').style.display = 'none';
}

async function createSubsection() {
    const subjectId = document.getElementById('addSubsectionSubjectId').value;
    const name = document.getElementById('subsectionNameInput').value.trim();
    const icon = document.getElementById('subsectionIconInput').value.trim();
    
    if (!name) {
        showNotification('Please enter a subsection name', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/subsections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject_id: subjectId, name, icon })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Subsection added successfully!', 'success');
            closeAddSubsectionModal();
            await loadMaterials();
        }
    } catch (error) {
        console.error('Error creating subsection:', error);
        showNotification('Failed to create subsection', 'error');
    }
}

async function deleteSubsection(subsectionId) {
    if (!confirm('Are you sure you want to delete this subsection and all its documents?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/subsections/${subsectionId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Subsection deleted successfully!', 'success');
            await loadMaterials();
        }
    } catch (error) {
        console.error('Error deleting subsection:', error);
        showNotification('Failed to delete subsection', 'error');
    }
}

function showUploadModal(subsectionId, subsectionName, subjectId) {
    const modal = document.getElementById('uploadModal');
    document.getElementById('uploadSubsectionName').textContent = subsectionName;
    document.getElementById('uploadSubsectionId').value = subsectionId;
    document.getElementById('documentNameInput').value = '';
    document.getElementById('documentUrlInput').value = '';
    document.getElementById('uploadMethodSelect').value = 'link';
    updateUploadMethodUI('link');
    modal.style.display = 'flex';
}

function updateUploadMethodUI(method) {
    const urlGroup = document.getElementById('urlInputGroup');
    const urlInput = document.getElementById('documentUrlInput');
    const urlLabel = document.getElementById('urlInputLabel');
    
    if (method === 'drive') {
        urlLabel.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Google Drive URL:';
        urlInput.placeholder = 'Paste your Google Drive share link here...';
        urlGroup.style.display = 'block';
    } else {
        urlLabel.innerHTML = '<i class="fas fa-link"></i> File URL:';
        urlInput.placeholder = 'https://...';
        urlGroup.style.display = 'block';
    }
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

async function uploadDocument() {
    const subsectionId = document.getElementById('uploadSubsectionId').value;
    const name = document.getElementById('documentNameInput').value.trim();
    const url = document.getElementById('documentUrlInput').value.trim();
    const method = document.getElementById('uploadMethodSelect').value;
    
    if (!name || !url) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subsection_id: subsectionId,
                name,
                file_url: url,
                upload_method: method
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Document uploaded successfully!', 'success');
            closeUploadModal();
            await loadMaterials();
        }
    } catch (error) {
        console.error('Error uploading document:', error);
        showNotification('Failed to upload document', 'error');
    }
}

async function deleteDocument(documentId) {
    if (!confirm('Are you sure you want to delete this document?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/documents/${documentId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Document deleted successfully!', 'success');
            await loadMaterials();
        }
    } catch (error) {
        console.error('Error deleting document:', error);
        showNotification('Failed to delete document', 'error');
    }
}

function attachEventListeners() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', toggleAccordion);
    });
    
    const subcategoryHeaders = document.querySelectorAll('.subcategory-header');
    subcategoryHeaders.forEach(header => {
        header.addEventListener('click', toggleSubcategory);
    });
}

function toggleAccordion(e) {
    const header = e.currentTarget;
    const item = header.parentElement;
    const content = item.querySelector('.accordion-content');
    const toggleIcon = header.querySelector('.toggle-icon');
    
    item.classList.toggle('active');
    
    if (item.classList.contains('active')) {
        content.style.maxHeight = content.scrollHeight + 'px';
        toggleIcon.style.transform = 'rotate(180deg)';
    } else {
        content.style.maxHeight = '0';
        toggleIcon.style.transform = 'rotate(0deg)';
    }
}

function toggleSubcategory(e) {
    const header = e.currentTarget;
    const subcategory = header.parentElement;
    const content = subcategory.querySelector('.subcategory-content');
    const toggleIcon = header.querySelector('.fa-chevron-right');
    
    subcategory.classList.toggle('active');
    
    if (subcategory.classList.contains('active')) {
        content.style.maxHeight = content.scrollHeight + 'px';
        toggleIcon.style.transform = 'rotate(90deg)';
    } else {
        content.style.maxHeight = '0';
        toggleIcon.style.transform = 'rotate(0deg)';
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
