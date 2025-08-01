const express = require('express');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const { authenticate, loadAuthenticationConfigurations } = require('./authenticate');

// Constants
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(__dirname, '../storage');
const AUTH_DIR = process.env.AUTH_DIR || path.join(__dirname, '../auth');

// Ensure storage and auth directories exist
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
}

process.on('SIGINT', () => {
    console.log('\n\nStopping content store\n');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\nStopping content store\n');
    process.exit(0);
});

// Initialize the app
const app = express();
const server = http.createServer(app);

app.set('port', process.env.PORT || 8081);
app.use(express.json());
app.use(express.text());
app.use(cors());
app.use(
    fileUpload({
        createParentPath: true,
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    })
);

// Load authentication configuration
async function initializeAuthentication() {
    try {
        const { configs, allowAnonymous } = await loadAuthenticationConfigurations(AUTH_DIR);
        console.log(`Loaded ${configs.length} authentication configurations`);

        // Create authentication middleware
        const authMiddleware = authenticate(configs, allowAnonymous);
        console.log(
            `Authentication initialized. Anonymous access: ${allowAnonymous ? 'allowed' : 'not allowed'}`
        );

        // Upload endpoint - protected by authentication
        app.post('/upload', authMiddleware, (req, res) => {
            try {
                if (!req.files || Object.keys(req.files).length === 0) {
                    return res.status(400).json({ error: 'No files were uploaded' });
                }

                const uploadedFile = req.files.file;

                // Determine content type (use provided or from file)
                let contentType = req.body.contentType || uploadedFile.mimetype;

                // Generate hash from file data
                const contentHash = generateHash(uploadedFile.data);

                // Sanitize content type for use in filename
                const sanitizedContentType = sanitizeContentType(contentType);

                // Create filename with hash and content type
                const filename = `${contentHash}.${sanitizedContentType}`;
                const filepath = path.join(STORAGE_DIR, filename);

                // Check if file already exists (idempotent operation)
                if (!fs.existsSync(filepath)) {
                    // Move file to storage directory with the hash as filename
                    uploadedFile.mv(filepath);
                }

                // Return the content hash for future retrieval
                return res.status(200).json({
                    contentHash,
                    contentType,
                    size: uploadedFile.size,
                    message: 'File uploaded successfully',
                });
            } catch (error) {
                console.error('Upload error:', error);
                return res.status(500).json({ error: 'File upload failed' });
            }
        });

        // Content retrieval endpoint - public access (no authentication required)
        app.get('/content/:hash', (req, res) => {
            try {
                const hash = req.params.hash;

                // Find the file with the matching hash prefix in the storage directory
                const files = fs.readdirSync(STORAGE_DIR);
                const matchingFile = files.find((file) => file.startsWith(hash));

                if (!matchingFile) {
                    return res.status(404).json({ error: 'Content not found' });
                }

                const filepath = path.join(STORAGE_DIR, matchingFile);

                // Extract content type from filename
                const filenameParts = matchingFile.split('.');
                if (filenameParts.length < 2) {
                    return res.status(500).json({ error: 'Invalid filename format' });
                }

                // Remove hash and dot from filename to get content type
                const contentTypeEncoded = matchingFile.substring(hash.length + 1);
                const contentType = decodeURIComponent(contentTypeEncoded);

                // Set content type header and send file
                res.setHeader('Content-Type', contentType);
                res.sendFile(filepath);
            } catch (error) {
                console.error('Retrieval error:', error);
                return res.status(500).json({ error: 'Content retrieval failed' });
            }
        });

        // Health check endpoint - public access (no authentication required)
        app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                service: 'content-store',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0',
            });
        });

        // Configuration status endpoint - public access (no authentication required)
        app.get('/configured', (req, res) => {
            try {
                // Check secrets configuration - verify AUTH_DIR contains required secrets
                let secretsConfigured = false;

                try {
                    if (fs.existsSync(AUTH_DIR)) {
                        const authFiles = fs.readdirSync(AUTH_DIR);
                        // Check for at least one authentication provider file or allow-anonymous file
                        const hasProviders = authFiles.some(
                            (file) => file.endsWith('.provider') || file === 'allow-anonymous'
                        );
                        secretsConfigured = hasProviders;
                    }
                } catch (error) {
                    console.error('Error reading auth directory:', error);
                    secretsConfigured = false;
                }

                const configuredGroups = {
                    secrets: secretsConfigured,
                };

                const allConfigured = secretsConfigured;

                res.status(200).json({
                    service: 'content-store',
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    configured: allConfigured,
                    configuredGroups,
                    ready: allConfigured, // Service is ready when configured
                });
            } catch (error) {
                console.error('Error checking configuration:', error);
                res.status(500).json({
                    service: 'content-store',
                    status: 'error',
                    timestamp: new Date().toISOString(),
                    configured: false,
                    configuredGroups: {
                        secrets: false,
                    },
                    ready: false,
                    error: error.message || 'Unknown error',
                });
            }
        });

        // Readiness check endpoint - public access (no authentication required)
        app.get('/ready', (req, res) => {
            try {
                // Check if authentication is properly configured
                let ready = false;

                try {
                    if (fs.existsSync(AUTH_DIR)) {
                        const authFiles = fs.readdirSync(AUTH_DIR);
                        // Check for at least one authentication provider file or allow-anonymous file
                        const hasProviders = authFiles.some(
                            (file) => file.endsWith('.provider') || file === 'allow-anonymous'
                        );
                        ready = hasProviders;
                    }
                } catch (error) {
                    console.error('Error reading auth directory:', error);
                    ready = false;
                }

                if (ready) {
                    res.status(200).json({
                        status: 'ready',
                        message: 'Content store is ready to serve requests',
                        timestamp: new Date().toISOString(),
                    });
                } else {
                    res.status(503).json({
                        status: 'not ready',
                        message: 'Content store is not ready yet - authentication not configured',
                        timestamp: new Date().toISOString(),
                    });
                }
            } catch (error) {
                console.error('Error checking readiness:', error);
                res.status(503).json({
                    status: 'not ready',
                    message: 'Error checking readiness',
                    timestamp: new Date().toISOString(),
                    error: error.message || 'Unknown error',
                });
            }
        });
    } catch (error) {
        console.warn(`Authentication initialization failed: ${error.message}`);
    }
}

// Utility function to generate SHA-256 hash from file data
function generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Utility function to sanitize content type for use in filenames
function sanitizeContentType(contentType) {
    return encodeURIComponent(contentType);
}

// Initialize authentication and start the server
(async () => {
    try {
        await initializeAuthentication();

        server.listen(app.get('port'), () => {
            console.log(
                `  Content Store is running at http://localhost:${app.get('port')} in ${app.get('env')} mode`
            );
            console.log('  Press CTRL-C to stop\n');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
})();
