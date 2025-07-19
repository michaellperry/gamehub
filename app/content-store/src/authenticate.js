const chardet = require('chardet');
const fs = require('fs').promises;
const iconv = require('iconv-lite');
const { decode, JwtPayload, verify } = require('jsonwebtoken');
const path = require('path');

/**
 * Authentication middleware for Express
 * @param {Array} configs - Array of authentication configurations
 * @param {boolean} allowAnonymous - Whether to allow anonymous access
 * @returns {Function} Express middleware function
 */
function authenticate(configs, allowAnonymous) {
    return (req, res, next) => {
        let possibleConfigs = configs;

        try {
            if (req.method === 'OPTIONS') {
                next();
                return;
            }
            const authorization = req.headers.authorization;
            if (authorization) {
                const match = authorization.match(/^Bearer (.*)$/);
                if (match) {
                    const token = match[1];
                    const payload = decode(token);
                    if (!payload || typeof payload !== 'object') {
                        res.set('Access-Control-Allow-Origin', '*');
                        res.status(401).send('Invalid token');
                        return;
                    }

                    // Validate the subject.
                    const subject = payload.sub;
                    if (typeof subject !== 'string') {
                        res.set('Access-Control-Allow-Origin', '*');
                        res.status(401).send('Invalid subject');
                        return;
                    }

                    // Validate the issuer and audience.
                    const issuer = payload.iss;
                    possibleConfigs = configs.filter((config) => config.issuer === issuer);
                    if (possibleConfigs.length === 0) {
                        res.set('Access-Control-Allow-Origin', '*');
                        res.status(401).send('Invalid issuer');
                        return;
                    }
                    const audience = payload.aud;
                    possibleConfigs = possibleConfigs.filter(
                        (config) => config.audience === audience
                    );
                    if (possibleConfigs.length === 0) {
                        res.set('Access-Control-Allow-Origin', '*');
                        res.status(401).send('Invalid audience');
                        return;
                    }

                    let verified = undefined;
                    let provider = '';
                    try {
                        const config = possibleConfigs.find(
                            (config) =>
                                config.keyId === decode(token, { complete: true }).header.kid
                        );
                        if (!config) {
                            res.set('Access-Control-Allow-Origin', '*');
                            res.status(401).send('Invalid key ID');
                            return;
                        }
                        provider = config.provider;
                        verified = verify(token, config.key);
                    } catch (error) {
                        res.set('Access-Control-Allow-Origin', '*');
                        res.status(401).send('Invalid signature');
                        return;
                    }

                    // Pass the user record to the next handler.
                    req.user = {
                        id: subject,
                        provider: provider,
                        profile: {
                            displayName: payload.display_name ?? '',
                        },
                    };
                }
            } else if (!allowAnonymous) {
                res.set('Access-Control-Allow-Origin', '*');
                res.status(401).send('No token');
                return;
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * Load authentication configurations from a directory
 * @param {string} dir - Directory path containing authentication configuration files
 * @returns {Promise<Object>} Object containing configs array and allowAnonymous boolean
 */
async function loadAuthenticationConfigurations(dir) {
    const { providerFiles, hasAllowAnonymousFile } = await findProviderFiles(dir);

    if (!hasAllowAnonymousFile && providerFiles.length === 0) {
        throw new Error(`No authentication configurations found in ${dir}.`);
    }

    const configs = [];
    for (const fileName of providerFiles) {
        const config = await loadConfigurationFromFile(fileName);
        configs.push(config);
    }

    if (hasAllowAnonymousFile) {
        console.log(`--------- Anonymous access is allowed!!! --------`);
    }

    return { configs, allowAnonymous: hasAllowAnonymousFile };
}

/**
 * Find provider files in a directory recursively
 * @param {string} dir - Directory to search
 * @returns {Promise<Object>} Object containing providerFiles array and hasAllowAnonymousFile boolean
 */
async function findProviderFiles(dir) {
    const providerFiles = [];
    let hasAllowAnonymousFile = false;

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const result = await findProviderFiles(fullPath);
            providerFiles.push(...result.providerFiles);
            hasAllowAnonymousFile = hasAllowAnonymousFile || result.hasAllowAnonymousFile;
        } else if (entry.isFile()) {
            if (entry.name.endsWith('.provider')) {
                providerFiles.push(fullPath);
            } else if (entry.name === 'allow-anonymous') {
                hasAllowAnonymousFile = true;
            }
        }
    }

    return { providerFiles, hasAllowAnonymousFile };
}

/**
 * Load configuration from a file
 * @param {string} filePath - Path to the configuration file
 * @returns {Promise<Object>} Authentication configuration object
 */
async function loadConfigurationFromFile(filePath) {
    try {
        console.log(`Searching for authentication files in ${filePath}`);

        const buffer = await fs.readFile(filePath);
        const encoding = chardet.detect(buffer) || 'utf-8';
        const content = iconv.decode(buffer, encoding);
        const config = JSON.parse(content);

        const missingFields = [];
        if (!config.provider) missingFields.push('provider');
        if (!config.issuer) missingFields.push('issuer');
        if (!config.audience) missingFields.push('audience');
        if (!config.key_id) missingFields.push('key_id');
        if (!config.key) missingFields.push('key');

        if (missingFields.length > 0) {
            throw new Error(
                `Invalid authentication configuration in ${filePath}: Missing required fields: ${missingFields.join(', ')}`
            );
        }

        return {
            provider: config.provider,
            issuer: config.issuer,
            audience: config.audience,
            keyId: config.key_id,
            key: config.key,
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error loading configuration from ${filePath}: ${error.message}`);
        } else {
            throw new Error(`Error loading configuration from ${filePath}: ${String(error)}`);
        }
    }
}

module.exports = {
    authenticate,
    loadAuthenticationConfigurations,
};
