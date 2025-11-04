// Upload functionality for Exam Cracker
// Educational project - Dropbox credentials included for school testing

// Dropbox Configuration with Auto-Refresh Token Support
window.DROPBOX_AUTH = {
    APP_KEY: 'dsx7a6ez71grl6n',
    APP_SECRET: 'trs6eqpeizuuef4',
    REFRESH_TOKEN: 'dJAxNhlFqQUAAAAAAAAAAVmY3pM99CyxshWDI83y5RQMv57XDdTjwrzd0mVB01KN',
    ACCESS_TOKEN: null,
    TOKEN_EXPIRY: null,
    
    async getValidAccessToken() {
        if (this.ACCESS_TOKEN && this.TOKEN_EXPIRY && Date.now() < this.TOKEN_EXPIRY) {
            return this.ACCESS_TOKEN;
        }
        return await this.refreshAccessToken();
    },
    
    async refreshAccessToken() {
        try {
            const response = await fetch('https://api.dropbox.com/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: this.REFRESH_TOKEN,
                    client_id: this.APP_KEY,
                    client_secret: this.APP_SECRET
                })
            });
            
            if (!response.ok) {
                throw new Error('Token refresh failed');
            }
            
            const data = await response.json();
            this.ACCESS_TOKEN = data.access_token;
            this.TOKEN_EXPIRY = Date.now() + (3.5 * 60 * 60 * 1000);
            
            console.log('✅ Dropbox token refreshed');
            return this.ACCESS_TOKEN;
        } catch (error) {
            console.error('❌ Token refresh error:', error);
            throw error;
        }
    }
};

let currentSubject = '';
let currentSubcategory = '';
let currentSection = '';

let isDisplayingFiles = false;

document.addEventListener('DOMContentLoaded', function() {
    detectSection();
    addUploadButtons();
    // Don't call displayUploadedFiles here - let dynamic-subsections.js handle it
    // This ensures custom subsections are loaded first
});

function detectSection() {
    const currentPage = window.location.pathname;
    if (currentPage.includes('materials.html')) {
        currentSection = 'Materials';
    } else if (currentPage.includes('questions.html')) {
        currentSection = 'Questions';
    } else {
        currentSection = 'Materials';
    }
    console.log('📍 Current Section:', currentSection, '| Page:', currentPage);
}

function addUploadButtons() {
    const subcategoryHeaders = document.querySelectorAll('.subcategory-header');
    
    subcategoryHeaders.forEach(header => {
        if (header.querySelector('.upload-btn-icon')) return;
        
        const uploadIcon = document.createElement('i');
        uploadIcon.className = 'fas fa-upload upload-btn-icon';
        uploadIcon.style.cssText = 'color: var(--primary-red); margin-left: 10px; cursor: pointer; font-size: 1.1rem;';
        uploadIcon.title = 'Upload new file';
        
        uploadIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            const subject = header.closest('.accordion-item').querySelector('.subject-name').textContent.trim();
            const subcategory = header.querySelector('span').textContent.trim();
            openUploadModal(subject, subcategory);
        });
        
        header.appendChild(uploadIcon);
    });
}

function openUploadModal(subject, subcategory) {
    currentSubject = subject;
    currentSubcategory = subcategory;
    
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('uploadFileTitle').value = '';
        document.getElementById('uploadFileInput').value = '';
        document.getElementById('uploadSubjectInfo').textContent = `${subject} - ${subcategory}`;
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function submitUpload() {
    const titleInput = document.getElementById('uploadFileTitle');
    const fileInput = document.getElementById('uploadFileInput');
    
    const title = titleInput.value.trim();
    const file = fileInput.files[0];
    
    if (!title) {
        showUploadStatus('Please enter a title', 'error');
        return;
    }
    
    if (!file) {
        showUploadStatus('Please select a file', 'error');
        return;
    }
    
    const maxSize = 150 * 1024 * 1024;
    if (file.size > maxSize) {
        showUploadStatus(`File too large. Max size: 150MB`, 'error');
        return;
    }
    
    showUploadStatus('Uploading to Dropbox...', 'info');
    
    try {
        await uploadToDropbox(title, file);
    } catch (error) {
        console.error('Upload error:', error);
        showUploadStatus(`Upload failed: ${error.message}`, 'error');
    }
}

function sanitizePathForDropbox(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x00-\x7F]/g, '')
        .replace(/[^a-zA-Z0-9-_\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100) || 'file';
}

async function uploadToDropbox(title, file) {
    try {
        const accessToken = await window.DROPBOX_AUTH.getValidAccessToken();
        
        const fileContent = await readFileAsArrayBuffer(file);
        const sanitizedSubject = sanitizePathForDropbox(currentSubject);
        const sanitizedSubcategory = sanitizePathForDropbox(currentSubcategory);
        const sanitizedSection = sanitizePathForDropbox(currentSection);
        
        const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
        const sanitizedTitle = sanitizePathForDropbox(title);
        const customFileName = sanitizedTitle + fileExtension;
        
        const dropboxPath = `/ExamCracker/${sanitizedSection}/${sanitizedSubject}/${sanitizedSubcategory}/${customFileName}`;
        console.log('📤 Uploading to:', dropboxPath);
        
        const uploadResponse = await fetch('https://content.dropboxapi.com/2/files/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Dropbox-API-Arg': JSON.stringify({
                    path: dropboxPath,
                    mode: 'add',
                    autorename: true,
                    mute: false
                }),
                'Content-Type': 'application/octet-stream'
            },
            body: fileContent
        });
        
        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.text();
            throw new Error(`Upload failed: ${errorData}`);
        }
        
        const uploadResult = await uploadResponse.json();
        
        const sharedLink = await createSharedLink(uploadResult.path_display);
        
        const downloadLink = convertToDirectDownload(sharedLink);
        const latestUpload = {
            title: title,
            fileName: customFileName,
            downloadLink: downloadLink,
            subject: currentSubject,
            subcategory: currentSubcategory,
            section: currentSection,
            uploadDate: new Date().toISOString()
        };
        
        await saveLatestUploadToDropbox(latestUpload);
        
        showUploadStatus('File uploaded to Dropbox successfully!', 'success');
        
        setTimeout(() => {
            closeUploadModal();
            displayUploadedFiles();
        }, 1500);
        
    } catch (error) {
        throw new Error(`Dropbox upload failed: ${error.message}`);
    }
}

async function createSharedLink(path) {
    try {
        const accessToken = await window.DROPBOX_AUTH.getValidAccessToken();
        
        const response = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: path,
                settings: {
                    requested_visibility: 'public',
                    audience: 'public',
                    access: 'viewer'
                }
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            return result.url;
        } else if (response.status === 409) {
            const existingLink = await getExistingSharedLink(path);
            return existingLink;
        } else {
            const errorData = await response.text();
            throw new Error(`Failed to create shared link: ${errorData}`);
        }
    } catch (error) {
        throw new Error(`Shared link creation failed: ${error.message}`);
    }
}

async function getExistingSharedLink(path) {
    const accessToken = await window.DROPBOX_AUTH.getValidAccessToken();
    
    const response = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: path,
            direct_only: false
        })
    });
    
    if (response.ok) {
        const result = await response.json();
        if (result.links && result.links.length > 0) {
            return result.links[0].url;
        }
    }
    
    throw new Error('No existing shared link found');
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function showUploadStatus(message, type) {
    const statusDiv = document.getElementById('uploadStatus');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `upload-status ${type}`;
        statusDiv.style.display = 'block';
    }
}

async function displayUploadedFiles() {
    if (isDisplayingFiles) {
        console.log('⏳ Already displaying files, skipping...');
        return;
    }
    
    isDisplayingFiles = true;
    
    const subcategoryHeaders = document.querySelectorAll('.subcategory-header');
    console.log('🔍 Displaying files for section:', currentSection, '| Found', subcategoryHeaders.length, 'subcategories');
    
    for (const header of subcategoryHeaders) {
        const headerSubject = header.closest('.accordion-item').querySelector('.subject-name').textContent.trim();
        const headerSubcategory = header.querySelector('span').textContent.trim();
        const contentDiv = header.nextElementSibling;
        
        if (!contentDiv) continue;
        
        contentDiv.querySelectorAll('.material-item.uploaded').forEach(item => item.remove());
        
        const sanitizedSubject = sanitizePathForDropbox(headerSubject);
        const sanitizedSubcategory = sanitizePathForDropbox(headerSubcategory);
        const sanitizedSection = sanitizePathForDropbox(currentSection);
        
        const folderPath = `/ExamCracker/${sanitizedSection}/${sanitizedSubject}/${sanitizedSubcategory}`;
        console.log('📂 Checking path:', folderPath);
        
        const allFiles = await listDropboxFiles(folderPath);
        
        if (allFiles.length > 0) {
            console.log(`✅ Found ${allFiles.length} file(s) in ${headerSubject} > ${headerSubcategory}`);
        }
        
        allFiles.forEach(fileInfo => {
            const materialItem = document.createElement('div');
            materialItem.className = 'material-item uploaded';
            materialItem.setAttribute('data-file-path', fileInfo.path);
            
            const displayTitle = fileInfo.name.replace(/\.[^/.]+$/, '');
            
            materialItem.innerHTML = `
                <span>${displayTitle}</span>
                <button class="download-btn" onclick="directDownload('${fileInfo.downloadLink}', '${fileInfo.name}'); event.stopPropagation()">
                    <i class="fas fa-download"></i>
                </button>
            `;
            contentDiv.appendChild(materialItem);
        });
    }
    
    isDisplayingFiles = false;
}

async function listDropboxFiles(folderPath) {
    try {
        const accessToken = await window.DROPBOX_AUTH.getValidAccessToken();
        
        const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: folderPath,
                recursive: false,
                include_deleted: false
            })
        });
        
        if (!response.ok) {
            throw new Error('Folder not found or empty');
        }
        
        const result = await response.json();
        const files = [];
        
        for (const entry of result.entries) {
            if (entry['.tag'] === 'file') {
                try {
                    const sharedLink = await getExistingSharedLink(entry.path_display);
                    const downloadLink = convertToDirectDownload(sharedLink);
                    
                    files.push({
                        name: entry.name,
                        path: entry.path_display,
                        downloadLink: downloadLink,
                        sharedLink: sharedLink
                    });
                } catch (error) {
                    const newSharedLink = await createSharedLink(entry.path_display);
                    const downloadLink = convertToDirectDownload(newSharedLink);
                    
                    files.push({
                        name: entry.name,
                        path: entry.path_display,
                        downloadLink: downloadLink,
                        sharedLink: newSharedLink
                    });
                }
            }
        }
        
        return files;
    } catch (error) {
        return [];
    }
}

// Helper function to convert Dropbox shared links to direct download links
function convertToDirectDownload(sharedLink) {
    // Remove any existing dl parameter
    let downloadLink = sharedLink.replace(/[?&]dl=0/g, '').replace(/[?&]dl=1/g, '');
    
    // Change domain to direct download domain
    downloadLink = downloadLink.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    
    // Add raw=1 parameter for direct download
    const separator = downloadLink.includes('?') ? '&' : '?';
    downloadLink += `${separator}raw=1`;
    
    return downloadLink;
}

// Save latest upload notification to Dropbox
async function saveLatestUploadToDropbox(uploadData) {
    try {
        const accessToken = await window.DROPBOX_AUTH.getValidAccessToken();
        
        const filePath = '/ExamCracker/latest_upload.json';
        const fileContent = JSON.stringify(uploadData, null, 2);
        
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
            console.error('Failed to save latest upload to Dropbox');
        }
    } catch (error) {
        console.error('Error saving latest upload:', error);
    }
}

// Function to trigger direct download
function directDownload(url, filename) {
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        })
        .catch(error => {
            console.error('Download error:', error);
            window.open(url, '_blank');
        });
}

window.onclick = function(event) {
    const modal = document.getElementById('uploadModal');
    if (event.target === modal) {
        closeUploadModal();
    }
}
