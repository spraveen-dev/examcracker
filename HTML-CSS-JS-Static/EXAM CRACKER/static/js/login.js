// Login page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn) {
        window.location.href = 'home.html';
        return;
    }
    
    // Initialize login form
    initLoginForm();
    
    // Add enter key support
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    });
});

function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    
    loginForm.addEventListener('submit', handleLogin);
    
    // Clear error on input
    const inputs = loginForm.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            hideError();
        });
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginBtn = document.querySelector('.login-btn');
    const originalBtnText = loginBtn.innerHTML;
    
    // Validation
    if (!username || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    // Show loading state
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    loginBtn.disabled = true;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('isAdmin', data.user.is_admin ? 'true' : 'false');
            localStorage.setItem('loginTime', new Date().toLocaleString());
            
            // Show success message
            loginBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
            loginBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
            
        } else {
            throw new Error('Login failed');
        }
        
    } catch (error) {
        // Error handling
        showError('Login failed. Please try again.');
        loginBtn.innerHTML = originalBtnText;
        loginBtn.disabled = false;
        
        // Add shake animation
        const loginForm = document.getElementById('loginForm');
        loginForm.classList.add('shake');
        setTimeout(() => {
            loginForm.classList.remove('shake');
        }, 500);
    }
}

function showError(message) {
    const loginError = document.getElementById('loginError');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    loginError.style.display = 'block';
    
    // Add animation
    loginError.style.opacity = '0';
    loginError.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
        loginError.style.opacity = '1';
        loginError.style.transform = 'translateY(0)';
        loginError.style.transition = 'all 0.3s ease';
    }, 100);
}

function hideError() {
    const loginError = document.getElementById('loginError');
    loginError.style.display = 'none';
}

// Add CSS for shake animation
const shakeCSS = `
.shake {
    animation: shake 0.5s ease-in-out;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
`;

// Inject shake CSS
const style = document.createElement('style');
style.textContent = shakeCSS;
document.head.appendChild(style);

// Handle demo credentials click
document.addEventListener('click', function(e) {
    if (e.target.closest('.login-footer p')) {
        document.getElementById('username').value = 'admin';
        document.getElementById('password').value = 'password';
        
        // Focus on login button
        document.querySelector('.login-btn').focus();
    }
});
