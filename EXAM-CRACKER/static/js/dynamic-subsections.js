// Dynamic Subsections Management
// Allows users to add custom subsections to any subject with password protection

let currentSubjectForSubsection = '';
let pageSection = '';
const SUBSECTION_PASSWORD = 'PRAVEEN001';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    detectPageSection();
    addPlusIconsToSubjects();
    
    // Load custom subsections FIRST before displaying files
    await loadCustomSubsections();
    console.log('✅ Custom subsections loaded, now calling displayUploadedFiles');
    
    // Trigger file display after subsections are loaded
    if (typeof displayUploadedFiles === 'function') {
        displayUploadedFiles();
    }
});

// Detect current section (Materials or Questions)
function detectPageSection() {
    const currentPage = window.location.pathname;
    if (currentPage.includes('materials.html')) {
        pageSection = 'Materials';
    } else if (currentPage.includes('questions.html')) {
        pageSection = 'Questions';
    } else {
        pageSection = 'Materials';
    }
}

// Add plus icons to all subject headers
function addPlusIconsToSubjects() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        // Skip if already has plus icon
        if (header.querySelector('.add-subsection-icon')) return;
        
        const plusIcon = document.createElement('i');
        plusIcon.className = 'fas fa-plus-circle add-subsection-icon';
        plusIcon.style.cssText = `
            color: var(--primary-red);
            margin-left: auto;
            margin-right: 10px;
            cursor: pointer;
            font-size: 1.2rem;
            transition: all 0.3s ease;
            z-index: 10;
        `;
        plusIcon.title = 'Add new subsection';
        
        // Hover effect
        plusIcon.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.2) rotate(90deg)';
            this.style.color = '#ff1744';
        });
        
        plusIcon.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
            this.style.color = 'var(--primary-red)';
        });
        
        // Click handler
        plusIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            const subjectName = header.querySelector('.subject-name').textContent.trim();
            currentSubjectForSubsection = subjectName;
            openPasswordModal();
        });
        
        // Insert before the toggle icon
        const toggleIcon = header.querySelector('.toggle-icon');
        header.insertBefore(plusIcon, toggleIcon);
    });
}

// Password Modal Functions
function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    const passwordInput = document.getElementById('subsectionPassword');
    const statusDiv = document.getElementById('passwordStatus');
    
    if (modal) {
        modal.style.display = 'flex';
        passwordInput.value = '';
        statusDiv.style.display = 'none';
        passwordInput.focus();
    }
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function verifyPassword() {
    const passwordInput = document.getElementById('subsectionPassword');
    const statusDiv = document.getElementById('passwordStatus');
    const password = passwordInput.value.trim();
    
    if (!password) {
        showStatus(statusDiv, 'Please enter password', 'error');
        return;
    }
    
    if (password === SUBSECTION_PASSWORD) {
        showStatus(statusDiv, 'Password verified!', 'success');
        
        setTimeout(() => {
            closePasswordModal();
            openSubsectionModal();
        }, 500);
    } else {
        showStatus(statusDiv, 'Incorrect password', 'error');
        passwordInput.value = '';
    }
}

// Subsection Modal Functions
function openSubsectionModal() {
    const modal = document.getElementById('subsectionModal');
    const subjectInfo = document.getElementById('subsectionSubjectInfo');
    const nameInput = document.getElementById('subsectionName');
    const statusDiv = document.getElementById('subsectionStatus');
    
    if (modal) {
        modal.style.display = 'flex';
        subjectInfo.textContent = currentSubjectForSubsection;
        nameInput.value = '';
        statusDiv.style.display = 'none';
        nameInput.focus();
    }
}

function closeSubsectionModal() {
    const modal = document.getElementById('subsectionModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function addNewSubsection() {
    const nameInput = document.getElementById('subsectionName');
    const statusDiv = document.getElementById('subsectionStatus');
    const subsectionName = nameInput.value.trim();
    
    if (!subsectionName) {
        showStatus(statusDiv, 'Please enter subsection name', 'error');
        return;
    }
    
    // Create the subsection
    createSubsection(currentSubjectForSubsection, subsectionName);
    
    // Save to Dropbox
    await saveCustomSubsection(currentSubjectForSubsection, subsectionName);
    
    // Save notification for home page
    await saveSubsectionNotification(currentSubjectForSubsection, subsectionName);
    
    showStatus(statusDiv, 'Subsection added successfully!', 'success');
    
    setTimeout(() => {
        closeSubsectionModal();
    }, 1000);
}

// Save subsection creation notification to show on home page
async function saveSubsectionNotification(subjectName, subsectionName) {
    try {
        const notificationData = {
            type: 'subsection',
            subsectionName: subsectionName,
            subject: subjectName,
            section: pageSection,
            createdDate: new Date().toISOString()
        };
        
        const filePath = '/ExamCracker/latest_update.json';
        const fileContent = JSON.stringify(notificationData, null, 2);
        
        const accessToken = await window.DROPBOX_AUTH.getValidAccessToken();
        
        await fetch('https://content.dropboxapi.com/2/files/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Dropbox-API-Arg': JSON.stringify({
                    path: filePath,
                    mode: 'overwrite',
                    autorename: false,
                    mute: false
                }),
                'Content-Type': 'application/octet-stream'
            },
            body: fileContent
        });
    } catch (error) {
        console.log('Could not save subsection notification:', error);
    }
}

// Create a new subsection element
function createSubsection(subjectName, subsectionName) {
    try {
        console.log(`🔨 Creating subsection "${subsectionName}" for subject "${subjectName}"`);
        
        // Find the accordion item with this subject
        const accordionItems = document.querySelectorAll('.accordion-item');
        let targetAccordionContent = null;
        
        console.log(`Found ${accordionItems.length} accordion items`);
    
    accordionItems.forEach((item, index) => {
        const itemSubjectName = item.querySelector('.subject-name')?.textContent.trim();
        console.log(`  Item ${index}: subject name = "${itemSubjectName}"`);
        if (itemSubjectName === subjectName) {
            targetAccordionContent = item.querySelector('.accordion-content');
            console.log(`  ✅ Match found!`);
        }
    });
    
    if (!targetAccordionContent) {
        console.error(`❌ Subject not found: "${subjectName}"`);
        console.error('Available subjects:', Array.from(accordionItems).map(item => item.querySelector('.subject-name')?.textContent.trim()));
        return;
    }
    
    console.log('✅ Target accordion content found, creating subsection element...');
    
    // Create the subsection div
    const subsectionDiv = document.createElement('div');
    subsectionDiv.className = 'subcategory custom-subsection';
    subsectionDiv.setAttribute('data-custom', 'true');
    subsectionDiv.setAttribute('data-subject', subjectName);
    subsectionDiv.setAttribute('data-subsection', subsectionName);
    
    subsectionDiv.innerHTML = `
        <div class="subcategory-header" data-subcategory="${subsectionName}">
            <i class="fas fa-folder"></i>
            <span>${subsectionName}</span>
            <i class="fas fa-trash delete-subsection-icon" title="Delete subsection" style="color: #f44336; margin-left: auto; margin-right: 10px; cursor: pointer; font-size: 1rem; transition: all 0.3s ease; z-index: 10;"></i>
            <i class="fas fa-chevron-right"></i>
        </div>
        <div class="subcategory-content">
            <!-- Files will be added here dynamically -->
        </div>
    `;
    
    // Add to the accordion content
    targetAccordionContent.appendChild(subsectionDiv);
    
    // Reinitialize accordion functionality for the new subsection
    const newSubcategoryHeader = subsectionDiv.querySelector('.subcategory-header');
    newSubcategoryHeader.addEventListener('click', toggleSubcategory);
    
    // Add delete functionality
    const deleteIcon = subsectionDiv.querySelector('.delete-subsection-icon');
    deleteIcon.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.2)';
        this.style.color = '#ff1744';
    });
    deleteIcon.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.color = '#f44336';
    });
    deleteIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        deleteCustomSubsection(subjectName, subsectionName);
    });
    
    // Add upload button to the new subsection
    if (typeof addUploadButtons === 'function') {
        setTimeout(() => {
            addUploadButtons();
        }, 100);
    }
    
    console.log(`✅ Subsection "${subsectionName}" created successfully!`);
    
    } catch (error) {
        console.error(`❌ Error creating subsection "${subsectionName}":`, error);
        console.error('Error stack:', error.stack);
    }
}

// Save custom subsection to Dropbox (syncs across all devices)
async function saveCustomSubsection(subjectName, subsectionName) {
    try {
        // Get current subsections from Dropbox
        const customSubsections = await loadSubsectionsFromDropbox();
        
        if (!customSubsections[pageSection]) {
            customSubsections[pageSection] = {};
        }
        
        if (!customSubsections[pageSection][subjectName]) {
            customSubsections[pageSection][subjectName] = [];
        }
        
        // Avoid duplicates
        if (!customSubsections[pageSection][subjectName].includes(subsectionName)) {
            customSubsections[pageSection][subjectName].push(subsectionName);
        }
        
        // Save to Dropbox
        await saveSubsectionsToDropbox(customSubsections);
    } catch (error) {
        console.error('Error saving subsection:', error);
    }
}

// Delete custom subsection with password protection
async function deleteCustomSubsection(subjectName, subsectionName) {
    const password = prompt('Enter password to delete this subsection:');
    
    if (!password) {
        return;
    }
    
    if (password !== SUBSECTION_PASSWORD) {
        alert('Incorrect password');
        return;
    }
    
    const confirmDelete = confirm(`Are you sure you want to delete "${subsectionName}"?\n\nThis will also remove all files in this subsection from Dropbox.`);
    
    if (!confirmDelete) {
        return;
    }
    
    try {
        // Remove from Dropbox
        const customSubsections = await loadSubsectionsFromDropbox();
        
        if (customSubsections[pageSection] && customSubsections[pageSection][subjectName]) {
            const index = customSubsections[pageSection][subjectName].indexOf(subsectionName);
            if (index > -1) {
                customSubsections[pageSection][subjectName].splice(index, 1);
                
                // Remove subject key if no subsections left
                if (customSubsections[pageSection][subjectName].length === 0) {
                    delete customSubsections[pageSection][subjectName];
                }
                
                // Save updated data
                await saveSubsectionsToDropbox(customSubsections);
                
                // Delete files from Dropbox folder
                await deleteSubsectionFilesFromDropbox(subjectName, subsectionName);
                
                // Remove from UI
                const subsectionElement = document.querySelector(
                    `.custom-subsection[data-subject="${subjectName}"][data-subsection="${subsectionName}"]`
                );
                if (subsectionElement) {
                    subsectionElement.remove();
                }
                
                showNotification('Subsection deleted successfully!', 'success');
            }
        }
    } catch (error) {
        console.error('Error deleting subsection:', error);
        showNotification('Failed to delete subsection', 'error');
    }
}

// Delete subsection files from Dropbox
async function deleteSubsectionFilesFromDropbox(subjectName, subsectionName) {
    try {
        const sanitizedSubject = sanitizePathForDropbox(subjectName);
        const sanitizedSubcategory = sanitizePathForDropbox(subsectionName);
        const sanitizedSection = sanitizePathForDropbox(pageSection);
        
        const folderPath = `/ExamCracker/${sanitizedSection}/${sanitizedSubject}/${sanitizedSubcategory}`;
        
        const accessToken = await window.DROPBOX_AUTH.getValidAccessToken();
        
        const response = await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: folderPath })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error_summary && errorData.error_summary.includes('not_found')) {
                console.log('Folder does not exist in Dropbox (may have been empty or already deleted)');
            } else {
                throw new Error(`Dropbox delete failed: ${errorData.error_summary || response.statusText}`);
            }
        }
    } catch (error) {
        console.log('Note: Dropbox folder deletion result:', error.message);
    }
}

// Helper function to sanitize path for Dropbox (matching upload.js)
function sanitizePathForDropbox(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x00-\x7F]/g, '')
        .replace(/[^a-zA-Z0-9-_\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100) || 'file';
}

// Enhanced notification system
function showNotification(message, type = 'info', duration = 4000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-triangle',
        warning: 'exclamation-circle',
        info: 'info-circle'
    };
    
    const colors = {
        success: 'linear-gradient(135deg, #4caf50, #388e3c)',
        error: 'linear-gradient(135deg, #f44336, #d32f2f)',
        warning: 'linear-gradient(135deg, #ff9800, #f57c00)',
        info: 'linear-gradient(135deg, #2196f3, #1976d2)'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${icons[type] || icons.info}"></i>
            <div class="notification-text">
                <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '100px',
        right: '20px',
        background: colors[type] || colors.info,
        color: 'white',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4), 0 5px 15px rgba(0, 0, 0, 0.2)',
        zIndex: '10000',
        transform: 'translateX(450px) scale(0.8)',
        transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        minWidth: '300px',
        maxWidth: '400px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        opacity: '0'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0) scale(1)';
        notification.style.opacity = '1';
    }, 100);
    
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: rgba(255, 255, 255, 0.5);
        width: 100%;
        transition: width ${duration}ms linear;
        border-radius: 0 0 12px 12px;
    `;
    notification.appendChild(progressBar);
    
    setTimeout(() => {
        progressBar.style.width = '0%';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(450px) scale(0.8)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 400);
    }, duration);
}

const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    
    .notification-content > i {
        font-size: 1.5rem;
        flex-shrink: 0;
    }
    
    .notification-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .notification-text strong {
        font-size: 0.95rem;
        font-weight: 600;
    }
    
    .notification-text span {
        font-size: 0.9rem;
        opacity: 0.95;
        line-height: 1.4;
    }
    
    .notification-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
    }
    
    .notification-close i {
        font-size: 0.8rem;
    }
    
    @media (max-width: 768px) {
        .notification {
            right: 10px !important;
            left: 10px !important;
            min-width: auto !important;
            max-width: calc(100% - 20px) !important;
        }
    }
`;
document.head.appendChild(notificationStyles);

// Load custom subsections from Dropbox
async function loadCustomSubsections() {
    try {
        console.log('🔄 Loading custom subsections for section:', pageSection);
        const customSubsections = await loadSubsectionsFromDropbox();
        console.log('📦 Loaded subsections data:', customSubsections);
        
        // Remove existing custom subsections first
        document.querySelectorAll('.custom-subsection').forEach(el => el.remove());
        
        // Create each saved subsection for current section
        if (customSubsections[pageSection]) {
            console.log(`✅ Found ${Object.keys(customSubsections[pageSection]).length} subjects with custom subsections`);
            for (const subjectName in customSubsections[pageSection]) {
                const subsectionNames = customSubsections[pageSection][subjectName];
                console.log(`Creating ${subsectionNames.length} subsections for ${subjectName}:`, subsectionNames);
                subsectionNames.forEach(subsectionName => {
                    createSubsection(subjectName, subsectionName);
                });
            }
        } else {
            console.log('⚠️ No custom subsections found for section:', pageSection);
        }
    } catch (error) {
        console.error('❌ Error loading custom subsections:', error);
    }
}

// Load subsections data from Dropbox
async function loadSubsectionsFromDropbox() {
    try {
        const filePath = '/ExamCracker/custom_subsections.json';
        console.log('📥 Attempting to load from Dropbox:', filePath);
        
        const accessToken = await window.DROPBOX_AUTH.getValidAccessToken();
        
        const response = await fetch('https://content.dropboxapi.com/2/files/download', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Dropbox-API-Arg': JSON.stringify({ path: filePath })
            }
        });
        
        console.log('📥 Dropbox response status:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Successfully loaded subsections data from Dropbox');
            return data;
        } else {
            const errorText = await response.text();
            console.log('⚠️ File not found or error:', errorText);
            return {};
        }
    } catch (error) {
        console.error('❌ Error loading from Dropbox:', error);
        return {};
    }
}

// Save subsections data to Dropbox
async function saveSubsectionsToDropbox(data) {
    try {
        const filePath = '/ExamCracker/custom_subsections.json';
        const fileContent = JSON.stringify(data, null, 2);
        
        const accessToken = await window.DROPBOX_AUTH.getValidAccessToken();
        
        const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Dropbox-API-Arg': JSON.stringify({
                    path: filePath,
                    mode: 'overwrite',
                    autorename: false,
                    mute: false
                }),
                'Content-Type': 'application/octet-stream'
            },
            body: fileContent
        });
        
        if (!response.ok) {
            throw new Error('Failed to save subsections to Dropbox');
        }
        
        return true;
    } catch (error) {
        console.error('Error saving to Dropbox:', error);
        throw error;
    }
}

// Helper function to show status messages
function showStatus(statusDiv, message, type) {
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `upload-status ${type}`;
        statusDiv.style.display = 'block';
    }
}

// Extend toggleSubcategory function to work with dynamic subsections
function toggleSubcategory(e) {
    const header = e.currentTarget;
    const content = header.nextElementSibling;
    const parentAccordion = header.closest('.accordion-content');
    
    // Toggle active class
    header.classList.toggle('active');
    content.classList.toggle('active');
    
    // Animate content
    if (content.classList.contains('active')) {
        content.style.maxHeight = content.scrollHeight + 'px';
    } else {
        content.style.maxHeight = null;
    }
    
    // Adjust parent accordion height
    setTimeout(() => {
        if (parentAccordion && parentAccordion.classList.contains('active')) {
            parentAccordion.style.maxHeight = parentAccordion.scrollHeight + 'px';
        }
    }, 300);
    
    // Add ripple effect
    addRippleEffect(header, e);
}

// Enhanced circular ripple effect - contained within element
function addRippleEffect(element, event) {
    // Ensure element has proper positioning for ripple containment
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.position === 'static') {
        element.style.position = 'relative';
    }
    if (computedStyle.overflow !== 'hidden') {
        element.style.overflow = 'hidden';
    }
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 800);
}

// Handle Enter key for password and subsection inputs
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const passwordModal = document.getElementById('passwordModal');
        const subsectionModal = document.getElementById('subsectionModal');
        
        if (passwordModal && passwordModal.style.display === 'flex') {
            verifyPassword();
        } else if (subsectionModal && subsectionModal.style.display === 'flex') {
            addNewSubsection();
        }
    }
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const passwordModal = document.getElementById('passwordModal');
    const subsectionModal = document.getElementById('subsectionModal');
    
    if (event.target === passwordModal) {
        closePasswordModal();
    }
    
    if (event.target === subsectionModal) {
        closeSubsectionModal();
    }
});
