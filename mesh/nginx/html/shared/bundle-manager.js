/**
 * GameHub Shared Bundle Manager
 * Provides bundle loading and caching functionality for GameHub applications
 */

class BundleManager {
    constructor() {
        this.loadedBundles = new Map();
        this.bundleConfigs = new Map();
        this.bundleCache = new Map();
    }

    /**
     * Discover bundle URL from HTML page
     */
    async discoverBundleFromHTML(htmlUrl) {
        try {
            // Add cache-busting parameter to HTML URL to ensure fresh content
            const url = new URL(htmlUrl, window.location.origin);
            url.searchParams.set('_t', Date.now().toString());

            const response = await fetch(url.toString(), {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch HTML: ${response.status}`);
            }

            const html = await response.text();

            // Create a temporary DOM element to parse HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Find the main module script
            const scriptTag = tempDiv.querySelector('script[type="module"][crossorigin]');
            if (!scriptTag) {
                throw new Error('Main bundle script not found in HTML');
            }

            const src = scriptTag.getAttribute('src');
            // Convert relative htmlUrl to absolute URL if needed
            const baseUrl = htmlUrl.startsWith('http') ? htmlUrl : window.location.origin + htmlUrl;
            return new URL(src, baseUrl).href;
        } catch (error) {
            console.error('Bundle discovery failed:', error);
            throw error;
        }
    }

    /**
     * Load and execute a JavaScript bundle
     */
    async loadBundle(bundleId, config, forceRefresh = false) {
        try {
            // Check cache first (but allow force refresh to bypass)
            const cacheKey = `${bundleId}_${config.discoveryUrl}`;
            const cached = this.bundleCache.get(cacheKey);
            const cacheDuration = forceRefresh ? 0 : 60000; // 1 minute cache, or 0 if force refresh

            if (!forceRefresh && cached && (Date.now() - cached.timestamp) < cacheDuration) {
                return cached.result;
            }

            let bundleUrl;

            // Primary: HTML parsing discovery
            if (config.discoveryMethod === 'html-parse') {
                bundleUrl = await this.discoverBundleFromHTML(config.discoveryUrl);
            } else {
                throw new Error(`Unsupported discovery method: ${config.discoveryMethod}`);
            }

            // Add cache-busting parameter to bundle URL
            const url = new URL(bundleUrl);
            url.searchParams.set('_t', Date.now().toString());
            bundleUrl = url.toString();

            // Load and execute the bundle
            const result = await this.loadScriptBundle(bundleUrl, config.configFunction);

            // Cache the result
            this.bundleCache.set(cacheKey, {
                result,
                timestamp: Date.now()
            });

            return result;

        } catch (error) {
            console.warn(`Bundle loading failed for ${bundleId}:`, error);

            // Return error status
            return {
                configured: false,
                configuredGroups: {},
                error: error.message
            };
        }
    }

    /**
     * Load script bundle and execute configuration function
     */
    async loadScriptBundle(bundleUrl, functionName) {
        return new Promise((resolve, reject) => {
            // Create a unique callback name to avoid conflicts
            const callbackName = `bundleCallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const script = document.createElement('script');
            script.type = 'module';
            script.crossOrigin = 'anonymous';

            // Create a timeout for the operation
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Bundle loading timeout'));
            }, 10000);

            const cleanup = () => {
                clearTimeout(timeout);
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                delete window[callbackName];
            };

            script.onload = () => {
                try {
                    // Try to access the function from the global scope
                    const configFunction = window[functionName];
                    if (typeof configFunction === 'function') {
                        const result = configFunction();
                        cleanup();
                        resolve(result);
                    } else {
                        cleanup();
                        reject(new Error(`Function ${functionName} not found or not callable`));
                    }
                } catch (error) {
                    cleanup();
                    reject(error);
                }
            };

            script.onerror = () => {
                cleanup();
                reject(new Error(`Failed to load bundle: ${bundleUrl}`));
            };

            script.src = bundleUrl;
            document.head.appendChild(script);
        });
    }

    /**
     * Get bundle status
     */
    async getBundleStatus(bundleId, config, forceRefresh = false) {
        try {
            const result = await this.loadBundle(bundleId, config, forceRefresh);
            return {
                configured: result.configured || false,
                configuredGroups: result.configuredGroups || {},
                lastChecked: new Date().toISOString(),
                error: result.error
            };
        } catch (error) {
            return {
                configured: false,
                configuredGroups: {},
                lastChecked: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Clear bundle cache for a specific bundle or all bundles
     */
    clearBundleCache(bundleId = null) {
        if (bundleId) {
            // Clear specific bundle cache
            for (const [key] of this.bundleCache) {
                if (key.startsWith(`${bundleId}_`)) {
                    this.bundleCache.delete(key);
                }
            }
        } else {
            // Clear all bundle cache
            this.bundleCache.clear();
        }
    }
}

// Export for use in both apps
window.BundleManager = BundleManager; 