const https = require('https');

let tokenCache = {
  accessToken: null,
  expiresAt: null
};

async function getValidAccessToken() {
  const now = Date.now();
  
  if (tokenCache.accessToken && tokenCache.expiresAt && now < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }
  
  const refreshToken = 'dJAxNhlFqQUAAAAAAAAAAVmY3pM99CyxshWDI83y5RQMv57XDdTjwrzd0mVB01KN';
  const appKey = 'dsx7a6ez71grl6n';
  const appSecret = 'trs6eqpeizuuef4';
  
  const tokenData = await refreshAccessToken(refreshToken, appKey, appSecret);
  
  tokenCache.accessToken = tokenData.access_token;
  tokenCache.expiresAt = now + (tokenData.expires_in * 1000) - 60000;
  
  return tokenCache.accessToken;
}

function refreshAccessToken(refreshToken, appKey, appSecret) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }).toString();
    
    const auth = Buffer.from(`${appKey}:${appSecret}`).toString('base64');
    
    const options = {
      hostname: 'api.dropboxapi.com',
      path: '/oauth2/token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };
    
    const request = https.request(options, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Token refresh failed: ${data}`));
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.write(postData);
    request.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileContent, filePath } = req.body;

    if (!fileName || !fileContent || !filePath) {
      return res.status(400).json({ 
        error: 'Missing required fields: fileName, fileContent, filePath' 
      });
    }
    
    const accessToken = await getValidAccessToken();
    const fileBuffer = Buffer.from(fileContent, 'base64');
    const dropboxPath = `/${filePath}/${fileName}`;

    await uploadToDropbox(accessToken, dropboxPath, fileBuffer);
    const shareResult = await createSharedLink(accessToken, dropboxPath);
    
    res.status(200).json({
      success: true,
      fileName: fileName,
      dropboxPath: dropboxPath,
      sharedLink: shareResult.url,
      downloadLink: shareResult.url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '?dl=1')
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message 
    });
  }
};

function uploadToDropbox(accessToken, path, fileBuffer) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'content.dropboxapi.com',
      path: '/2/files/upload',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: path,
          mode: 'add',
          autorename: true,
          mute: false
        }),
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileBuffer.length
      }
    };

    const request = https.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        if (response.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Dropbox upload failed: ${data}`));
        }
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.write(fileBuffer);
    request.end();
  });
}

function createSharedLink(accessToken, path) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      path: path,
      settings: {
        requested_visibility: 'public',
        audience: 'public',
        access: 'viewer'
      }
    });

    const options = {
      hostname: 'api.dropboxapi.com',
      path: '/2/sharing/create_shared_link_with_settings',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const request = https.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        const result = JSON.parse(data);
        if (response.statusCode === 200 || response.statusCode === 409) {
          // 409 means link already exists, get it instead
          if (response.statusCode === 409) {
            getExistingSharedLink(accessToken, path)
              .then(resolve)
              .catch(reject);
          } else {
            resolve(result);
          }
        } else {
          reject(new Error(`Failed to create shared link: ${data}`));
        }
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.write(postData);
    request.end();
  });
}

function getExistingSharedLink(accessToken, path) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      path: path,
      direct_only: false
    });

    const options = {
      hostname: 'api.dropboxapi.com',
      path: '/2/sharing/list_shared_links',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const request = https.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        const result = JSON.parse(data);
        if (response.statusCode === 200 && result.links && result.links.length > 0) {
          resolve(result.links[0]);
        } else {
          reject(new Error('No existing shared link found'));
        }
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.write(postData);
    request.end();
  });
}
