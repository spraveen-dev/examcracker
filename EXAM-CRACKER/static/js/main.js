// Display Dropbox connection notification
function showDropboxConnectionNotification() {
    const container = document.querySelector('.container-fluid');
    if (!container) return null;
    
    const existingNotif = document.getElementById('dropboxConnectionNotification');
    if (existingNotif) {
        existingNotif.remove();
    }
    
    const notification = document.createElement('div');
    notification.id = 'dropboxConnectionNotification';
    notification.style.cssText = `
        display: block;
        background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h4 style="margin: 0 0 5px 0; font-size: 1rem;">
                    <i class="fas fa-sync fa-spin"></i> Connecting to Server...
                </h4>
                <p style="margin: 0; opacity: 0.9; font-size: 0.9rem;">
                    Please wait while we establish connection to Dropbox
                </p>
            </div>
        </div>
    `;
    
    const firstElement = container.firstElementChild;
    container.insertBefore(notification, firstElement);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    return notification;
}

// Hide Dropbox connection notification
function hideDropboxConnectionNotification(notification) {
    if (!notification) return;
    
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Check Dropbox connection with new token system
async function checkDropboxConnection() {
    const connectionNotification = showDropboxConnectionNotification();
    
    try {
        if (!window.DROPBOX_AUTH) {
            // Hide blue notification first, then show error
            hideDropboxConnectionNotification(connectionNotification);
            setTimeout(() => {
                showDropboxErrorMessage('Dropbox authentication not initialized');
            }, 400);
            return false;
        }
        
        const accessToken = await window.DROPBOX_AUTH.getValidAccessToken();
        
        const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(null)
        });
        
        if (response.ok) {
            // Hide blue notification first, then show success
            hideDropboxConnectionNotification(connectionNotification);
            setTimeout(() => {
                showDropboxSuccessMessage();
            }, 400);
            return true;
        } else {
            const errorText = await response.text();
            console.error('Dropbox connection failed:', errorText);
            // Hide blue notification first, then show error
            hideDropboxConnectionNotification(connectionNotification);
            setTimeout(() => {
                showDropboxErrorMessage('Unable to connect to Dropbox server. Please check your internet connection and try again.');
            }, 400);
            return false;
        }
    } catch (error) {
        console.error('Dropbox connection error:', error);
        // Hide blue notification first, then show error
        hideDropboxConnectionNotification(connectionNotification);
        setTimeout(() => {
            showDropboxErrorMessage('Unable to connect to Dropbox server. Please check your internet connection and try again.');
        }, 400);
        return false;
    }
}

// Show Dropbox error message on materials and questions pages
function showDropboxErrorMessage(customMessage) {
    const container = document.querySelector('.container-fluid');
    if (!container) return;
    
    const existingError = document.getElementById('dropboxErrorMessage');
    if (existingError) {
        existingError.remove();
    }
    
    const errorMessage = document.createElement('div');
    errorMessage.id = 'dropboxErrorMessage';
    errorMessage.style.cssText = `
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        border-left: 4px solid #991b1b;
    `;
    
    const displayMessage = customMessage || 'Unable to connect to Dropbox server. Please check your internet connection and try again.';
    
    errorMessage.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem;"></i>
            <div>
                <h4 style="margin: 0 0 5px 0; font-size: 1rem; font-weight: 600;">
                    Connection Error
                </h4>
                <p style="margin: 0; opacity: 0.95; font-size: 0.9rem;">
                    ${displayMessage}
                </p>
            </div>
        </div>
    `;
    
    const firstElement = container.firstElementChild;
    container.insertBefore(errorMessage, firstElement);
    
    setTimeout(() => {
        errorMessage.style.opacity = '1';
        errorMessage.style.transform = 'translateY(0)';
    }, 100);
}

// Show Dropbox success message
function showDropboxSuccessMessage() {
    const container = document.querySelector('.container-fluid');
    if (!container) return;
    
    const existingError = document.getElementById('dropboxErrorMessage');
    if (existingError) {
        existingError.remove();
    }
    
    const successMessage = document.createElement('div');
    successMessage.id = 'dropboxSuccessMessage';
    successMessage.style.cssText = `
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        border-left: 4px solid #047857;
    `;
    
    successMessage.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-check-circle" style="font-size: 1.5rem;"></i>
            <div>
                <h4 style="margin: 0 0 5px 0; font-size: 1rem; font-weight: 600;">
                    Connected Successfully
                </h4>
                <p style="margin: 0; opacity: 0.95; font-size: 0.9rem;">
                    Successfully connected to Dropbox server.
                </p>
            </div>
        </div>
    `;
    
    const firstElement = container.firstElementChild;
    container.insertBefore(successMessage, firstElement);
    
    setTimeout(() => {
        successMessage.style.opacity = '1';
        successMessage.style.transform = 'translateY(0)';
    }, 100);
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
        successMessage.style.opacity = '0';
        successMessage.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (successMessage.parentNode) {
                successMessage.parentNode.removeChild(successMessage);
            }
        }, 300);
    }, 3000);
}

// Display latest upload notification and shortcut on home page
async function displayLatestUpload() {
    try {
        const latestUpload = await loadLatestUploadFromDropbox();
        
        if (latestUpload) {
            const notificationDiv = document.getElementById('latestUploadNotification');
            const notificationText = document.getElementById('latestUploadText');
            
            if (notificationDiv && notificationText) {
                const sectionName = latestUpload.section || 'Materials';
                notificationText.textContent = `"${latestUpload.title}" uploaded to ${sectionName} > ${latestUpload.subject} > ${latestUpload.subcategory}`;
                notificationDiv.style.display = 'block';
                
                setTimeout(() => {
                    notificationDiv.style.opacity = '1';
                    notificationDiv.style.transform = 'translateY(0)';
                }, 100);
            }
            
            const cardDiv = document.getElementById('latestUploadCard');
            const titleElement = document.getElementById('latestUploadTitle');
            const detailsElement = document.getElementById('latestUploadDetails');
            const linkElement = document.getElementById('latestUploadLink');
            
            if (cardDiv && titleElement && detailsElement && linkElement) {
                const sectionName = latestUpload.section || 'Materials';
                const uploadDate = new Date(latestUpload.uploadDate);
                const timeAgo = getTimeAgo(uploadDate);
                
                titleElement.textContent = latestUpload.title;
                detailsElement.innerHTML = `
                    <strong>${sectionName}</strong> > ${latestUpload.subject} > ${latestUpload.subcategory}
                    <br>
                    <small style="opacity: 0.7;">Uploaded ${timeAgo}</small>
                `;
                linkElement.onclick = function(e) {
                    e.preventDefault();
                    directDownload(latestUpload.downloadLink, latestUpload.fileName);
                };
                cardDiv.style.display = 'block';
                
                setTimeout(() => {
                    cardDiv.style.opacity = '1';
                    cardDiv.style.transform = 'translateY(0)';
                }, 200);
            }
        }
    } catch (error) {
        console.log('Error displaying notifications:', error);
    }
}

// Load latest upload notification from Dropbox
async function loadLatestUploadFromDropbox() {
    try {
        if (!window.DROPBOX_AUTH) {
            return null;
        }
        
        const accessToken = await window.DROPBOX_AUTH.getValidAccessToken();
        const filePath = '/ExamCracker/latest_upload.json';
        
        const response = await fetch('https://content.dropboxapi.com/2/files/download', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Dropbox-API-Arg': JSON.stringify({ path: filePath })
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

// Helper function to get time ago
function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkLoginStatus();
    
    // Initialize page animations
    initPageAnimations();
    
    // Handle navigation highlighting
    highlightActiveNav();
    
    // Load user profile data
    loadProfileData();
    
    // Check if on home page
    const currentPage = window.location.pathname;
    if (currentPage.includes('home.html')) {
        // Display latest upload on home page
        displayLatestUpload();
    } else if (currentPage.includes('materials.html') || currentPage.includes('questions.html')) {
        // Show connection notification on materials and questions pages
        checkDropboxConnection();
    }
});

function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentPage = window.location.pathname;
    
    // Redirect to login if not logged in and not on intro/login page
    if (!isLoggedIn && !currentPage.includes('login') && !currentPage.includes('intro') && !currentPage.includes('index')) {
        window.location.href = 'login.html';
    }
}

function initPageAnimations() {
    // Add fade-in animation to main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.add('fade-in');
    }
    
    // Add slide-up animation to cards
    const cards = document.querySelectorAll('.dashboard-card, .accordion-item');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('slide-up');
        }, index * 100);
    });
}

function highlightActiveNav() {
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link, .nav-item');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        const href = link.getAttribute('href');
        const isExternal = link.getAttribute('target') === '_blank' || (href && (href.startsWith('http://') || href.startsWith('https://')));
        
        // Skip external links
        if (!isExternal && href && currentPage.includes(href.split('/').pop())) {
            link.classList.add('active');
        }
    });
}

// Download file function
function downloadFile(filename) {
    // Create a temporary download link
    const link = document.createElement('a');
    link.href = '#';
    link.download = filename;
    
    // Show download notification
    showNotification(`Downloading ${filename}...`, 'info');
    
    // Simulate download delay
    setTimeout(() => {
        showNotification(`${filename} downloaded successfully!`, 'success');
    }, 1500);
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? 'var(--primary-red)' : 'var(--dark-gray)',
        color: 'var(--white)',
        padding: '1rem 1.5rem',
        borderRadius: '10px',
        boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transform: 'translateX(400px)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-triangle';
        case 'warning': return 'exclamation-circle';
        default: return 'info-circle';
    }
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        document.title = 'Come back! - Exam Cracker';
    } else {
        document.title = document.title.replace('Come back! - ', '');
    }
});

// Profile functionality
function loadProfileData() {
    const username = localStorage.getItem('username') || 'User';
    const password = localStorage.getItem('password') || '';
    const loginTime = localStorage.getItem('loginTime') || 'Just now';
    
    // Update navigation profile
    const navUsername = document.getElementById('navUsername');
    const bottomUsername = document.getElementById('bottomUsername');
    const headerUsername = document.getElementById('headerUsername');
    const navUsernameMobile = document.getElementById('navUsernameMobile');
    
    if (navUsername) navUsername.textContent = username;
    if (bottomUsername) bottomUsername.textContent = username;
    if (headerUsername) headerUsername.textContent = username;
    if (navUsernameMobile) navUsernameMobile.textContent = username;
    
    // Update profile section (if on home page)
    const profileUsername = document.getElementById('profileUsername');
    const profilePassword = document.getElementById('profilePassword');
    const loginTimeElement = document.getElementById('loginTime');
    
    if (profileUsername) profileUsername.textContent = username;
    if (profilePassword) {
        profilePassword.textContent = '••••••••';
        profilePassword.setAttribute('data-password', password);
    }
    if (loginTimeElement) loginTimeElement.textContent = loginTime;
}

function togglePassword() {
    const passwordElement = document.getElementById('profilePassword');
    const passwordIcon = document.getElementById('passwordIcon');
    const actualPassword = passwordElement.getAttribute('data-password');
    
    if (passwordElement.textContent === '••••••••') {
        passwordElement.textContent = actualPassword;
        passwordIcon.className = 'fas fa-eye-slash';
    } else {
        passwordElement.textContent = '••••••••';
        passwordIcon.className = 'fas fa-eye';
    }
}

function logout() {
    // Clear all stored data
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    localStorage.removeItem('loginTime');
    
    // Show logout message
    showNotification('Logged out successfully!', 'info');
    
    // Redirect to intro after short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Hamburger Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const mainNav = document.getElementById('mainNav');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const navClose = document.getElementById('navClose');
    
    if (hamburgerMenu && mainNav && mobileOverlay) {
        // Toggle menu function
        function toggleMenu() {
            const isActive = hamburgerMenu.classList.contains('active');
            
            if (isActive) {
                // Close menu with smooth animation
                const navLinks = mainNav.querySelectorAll('a');
                navLinks.forEach((link, index) => {
                    link.style.animation = `navItemFadeOut 0.3s ease forwards ${index * 0.05}s`;
                });
                
                setTimeout(() => {
                    hamburgerMenu.classList.remove('active');
                    mainNav.classList.remove('active');
                    mobileOverlay.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    
                    navLinks.forEach(link => {
                        link.style.animation = '';
                    });
                }, 300);
            } else {
                // Open menu
                hamburgerMenu.classList.add('active');
                mainNav.classList.add('active');
                mobileOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
        
        // Event listeners
        hamburgerMenu.addEventListener('click', toggleMenu);
        mobileOverlay.addEventListener('click', toggleMenu);
        if (navClose) {
            navClose.addEventListener('click', toggleMenu);
        }
        
        // Debug: Log navigation structure
        console.log('Navigation structure:', {
            hamburgerMenu: hamburgerMenu,
            mainNav: mainNav,
            mobileOverlay: mobileOverlay,
            navLinks: mainNav.querySelectorAll('a, .nav-profile')
        });
        
        // Close menu when clicking on nav links
        const navLinks = mainNav.querySelectorAll('a, .nav-profile');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Allow the link to work normally
                console.log('Navigation link clicked:', link.href);
                
                // Ensure the link can navigate
                if (link.href && link.href !== window.location.href) {
                    console.log('Navigating to:', link.href);
                    
                    // Only close menu on mobile
                    if (window.innerWidth <= 768) {
                        // Small delay to ensure navigation happens
                        setTimeout(() => {
                            toggleMenu();
                        }, 100);
                    }
                }
            });
        });
        
        // Close menu on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                hamburgerMenu.classList.remove('active');
                mainNav.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
        
        // Add smooth scroll behavior for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Test navigation functionality
        function testNavigation() {
            const testLinks = mainNav.querySelectorAll('a[href$=".html"]');
            testLinks.forEach(link => {
                console.log('Navigation link found:', {
                    href: link.href,
                    text: link.textContent.trim(),
                    element: link
                });
                
                // Add a test click handler
                link.addEventListener('click', function(e) {
                    console.log('Link clicked:', this.href);
                    // Don't prevent default - let it navigate
                });
            });
        }
        
        // Run navigation test
        testNavigation();
    }
    
    // Add loading animation for page transitions
    const pageLinks = document.querySelectorAll('a[href$=".html"]');
    pageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.href !== window.location.href) {
                // Add loading effect
                document.body.style.opacity = '0.7';
                document.body.style.transition = 'opacity 0.3s ease';
                
                setTimeout(() => {
                    document.body.style.opacity = '1';
                }, 100);
            }
        });
    });
    
    
    const downloadButtons = document.querySelectorAll('.download-btn');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const fileName = this.getAttribute('data-file');
            if (fileName) {
                // Simulate download (you can replace this with actual download logic)
                console.log(`Downloading: ${fileName}`);
                
                // Add download animation
                this.innerHTML = '<i class="fas fa-check"></i>';
                this.style.background = 'var(--primary-red)';
                this.style.color = 'white';
                
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-download"></i>';
                    this.style.background = '';
                    this.style.color = '';
                }, 2000);
            }
        });
    });
    
    // Notification Banner Functionality
    function initNotificationBanner() {
        const notificationBanner = document.getElementById('notificationBanner');
        const notificationClose = document.getElementById('notificationClose');
        
        if (notificationBanner && notificationClose) {
            // Show notification banner after a short delay
            setTimeout(() => {
                notificationBanner.classList.add('show');
                
                // Auto-hide after 8 seconds
                setTimeout(() => {
                    hideNotification();
                }, 8000);
            }, 1000);
            
            // Close button functionality
            notificationClose.addEventListener('click', hideNotification);
            
            // Function to hide notification
            function hideNotification() {
                notificationBanner.classList.remove('show');
                
                // Store in localStorage to remember user dismissed it
                localStorage.setItem('notificationDismissed', 'true');
                localStorage.setItem('notificationDismissedTime', Date.now());
            }
            
            // Check if user has already dismissed the notification
            const isDismissed = localStorage.getItem('notificationDismissed');
            const dismissedTime = localStorage.getItem('notificationDismissedTime');
            const currentTime = Date.now();
            const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            
            // If dismissed more than 24 hours ago, show again
            if (isDismissed && dismissedTime && (currentTime - dismissedTime) < oneDay) {
                notificationBanner.style.display = 'none';
            }
        }
    }
    
    // Initialize notification banner
    initNotificationBanner();
    });
// ...existing code...

document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const mainNav = document.getElementById('mainNav');
    const mobileOverlay = document.getElementById('mobileOverlay');

    // Hamburger menu toggle
    if (hamburgerMenu && mainNav && mobileOverlay) {
        hamburgerMenu.addEventListener('click', function() {
            mainNav.classList.toggle('open');
            mobileOverlay.classList.toggle('active');
        });

        // Close menu when overlay is clicked
        mobileOverlay.addEventListener('click', function() {
            mainNav.classList.remove('open');
            mobileOverlay.classList.remove('active');
        });

        // Close menu when a nav-link is clicked
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                mainNav.classList.remove('open');
                mobileOverlay.classList.remove('active');
            });
        });
    }
});

// Download Latest Document function
async function downloadLatestDocument(event) {
    if (event) {
        event.preventDefault();
    }
    
    try {
        const latestUpload = await loadLatestUploadFromDropbox();
        
        if (latestUpload && latestUpload.downloadLink) {
            // Show downloading message
            const downloadBtn = document.getElementById('navDownload');
            if (downloadBtn) {
                const originalHTML = downloadBtn.innerHTML;
                downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Downloading...</span>';
                
                // Trigger download
                directDownload(latestUpload.downloadLink, latestUpload.fileName);
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    downloadBtn.innerHTML = originalHTML;
                }, 2000);
            } else {
                // Direct download if button not found
                directDownload(latestUpload.downloadLink, latestUpload.fileName);
            }
        } else {
            alert('No recent documents available for download.');
        }
    } catch (error) {
        console.error('Error downloading latest document:', error);
        alert('Unable to download document. Please try again later.');
    }
}

// Helper function for direct download
function directDownload(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
