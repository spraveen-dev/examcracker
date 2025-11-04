// Dropbox Token Management with Auto-Refresh
// This handles automatic token refresh for permanent connection

window.DROPBOX_AUTH = {
    APP_KEY: 'dsx7a6ez71grl6n',
    APP_SECRET: 'trs6eqpeizuuef4',
    REFRESH_TOKEN: 'dJAxNhlFqQUAAAAAAAAAAVmY3pM99CyxshWDI83y5RQMv57XDdTjwrzd0mVB01KN',
    ACCESS_TOKEN: null,
    TOKEN_EXPIRY: null,
    
    // Initialize and get valid access token
    async getValidAccessToken() {
        // Check if current token is still valid
        if (this.ACCESS_TOKEN && this.TOKEN_EXPIRY && Date.now() < this.TOKEN_EXPIRY) {
            return this.ACCESS_TOKEN;
        }
        
        // Token expired or doesn't exist, refresh it
        return await this.refreshAccessToken();
    },
    
    // Refresh the access token using refresh token
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
                const errorData = await response.text();
                throw new Error(`Token refresh failed: ${errorData}`);
            }
            
            const data = await response.json();
            
            // Store the new access token
            this.ACCESS_TOKEN = data.access_token;
            
            // Set expiry time (tokens typically last 4 hours, we'll set 3.5 hours to be safe)
            this.TOKEN_EXPIRY = Date.now() + (3.5 * 60 * 60 * 1000);
            
            console.log('✅ Dropbox access token refreshed successfully');
            return this.ACCESS_TOKEN;
            
        } catch (error) {
            console.error('❌ Failed to refresh Dropbox token:', error);
            throw error;
        }
    },
    
    // Check if we're connected to Dropbox
    async checkConnection() {
        try {
            const token = await this.getValidAccessToken();
            
            const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('Dropbox connection check failed:', error);
            return false;
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Get initial access token
        await window.DROPBOX_AUTH.getValidAccessToken();
        console.log('🔐 Dropbox authentication initialized');
    } catch (error) {
        console.error('Failed to initialize Dropbox authentication:', error);
    }
});
