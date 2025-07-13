/**
 * GameHub Status Dashboard
 * HTTP polling-based service monitoring dashboard
 */

/**
 * Bundle Manager for loading and executing JavaScript bundles
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
            const response = await fetch(htmlUrl);
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
    async loadBundle(bundleId, config) {
        try {
            // Check cache first
            const cacheKey = `${bundleId}_${config.discoveryUrl}`;
            const cached = this.bundleCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minute cache
                return cached.result;
            }

            let bundleUrl;

            // Primary: HTML parsing discovery
            if (config.discoveryMethod === 'html-parse') {
                bundleUrl = await this.discoverBundleFromHTML(config.discoveryUrl);
            } else {
                throw new Error(`Unsupported discovery method: ${config.discoveryMethod}`);
            }

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
    async getBundleStatus(bundleId, config) {
        try {
            const result = await this.loadBundle(bundleId, config);
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
}

class StatusDashboard {
    constructor() {
        this.pollingInterval = null;
        this.pollingIntervalMs = 10000; // 10 seconds
        this.autoRefresh = true;
        this.lastData = null;
        this.isPolling = false;
        this.consecutiveErrors = 0;
        this.maxConsecutiveErrors = 5;
        this.retryDelayMs = 5000; // 5 seconds retry delay

        // Bundle management
        this.bundleManager = new BundleManager();
        this.bundleCache = new Map();

        this.initializeElements();
        this.bindEvents();
        this.startPolling();
    }

    initializeElements() {
        // Connection status elements
        this.connectionStatus = document.getElementById('connectionStatus');
        this.connectionDot = document.getElementById('connectionDot');
        this.connectionText = document.getElementById('connectionText');

        // Control elements
        this.refreshBtn = document.getElementById('refreshBtn');
        this.autoRefreshToggle = document.getElementById('autoRefreshToggle');
        this.retryBtn = document.getElementById('retryBtn');

        // Content elements
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.errorMessage = document.getElementById('errorMessage');
        this.servicesGrid = document.getElementById('servicesGrid');
        this.summarySection = document.getElementById('summarySection');
        this.lastUpdated = document.getElementById('lastUpdated');

        // Summary elements
        this.totalServices = document.getElementById('totalServices');
        this.healthyServices = document.getElementById('healthyServices');
        this.configuredServices = document.getElementById('configuredServices');
        this.readyServices = document.getElementById('readyServices');
        this.overallStatus = document.getElementById('overallStatus');

        // Tooltip
        this.tooltip = document.getElementById('tooltip');
        this.tooltipContent = document.getElementById('tooltipContent');
    }

    bindEvents() {
        // Refresh button
        this.refreshBtn.addEventListener('click', () => {
            this.refreshStatus();
        });

        // Auto-refresh toggle
        this.autoRefreshToggle.addEventListener('change', (e) => {
            this.autoRefresh = e.target.checked;
            if (this.autoRefresh) {
                this.startPolling();
            } else {
                this.stopPolling();
            }
        });

        // Retry button
        this.retryBtn.addEventListener('click', () => {
            this.startPolling();
        });

        // Tooltip events
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('info-icon')) {
                this.showTooltip(e);
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('info-icon')) {
                this.hideTooltip();
            }
        });

        // Handle page visibility changes - resume polling when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.autoRefresh && !this.pollingInterval) {
                this.startPolling();
            } else if (document.hidden && this.pollingInterval) {
                // Optionally pause polling when page is hidden to save resources
                // this.stopPolling();
            }
        });
    }

    startPolling() {
        this.stopPolling(); // Clear any existing interval
        this.updateConnectionStatus('connecting', 'Connecting...');
        this.showLoading();

        // Initial fetch
        this.fetchStatus();

        // Set up polling interval if auto-refresh is enabled
        if (this.autoRefresh) {
            this.pollingInterval = setInterval(() => {
                if (this.autoRefresh && !this.isPolling) {
                    this.fetchStatus();
                }
            }, this.pollingIntervalMs);

            console.log(`HTTP polling started with ${this.pollingIntervalMs / 1000}s interval`);
        }
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('HTTP polling stopped');
        }
        this.updateConnectionStatus('disconnected', 'Polling stopped');
    }

    async fetchStatus() {
        if (this.isPolling) return; // Prevent concurrent requests

        this.isPolling = true;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

            const response = await fetch('/relay', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.handleStatusUpdate(data);
            this.consecutiveErrors = 0;
            this.updateConnectionStatus('connected', `Polling every ${this.pollingIntervalMs / 1000}s`);

        } catch (error) {
            console.error('Status fetch failed:', error);
            this.consecutiveErrors++;

            if (error.name === 'AbortError') {
                console.warn('Request timed out');
                this.updateConnectionStatus('connecting', 'Request timeout, retrying...');
            } else if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
                this.stopPolling();
                this.showError(`Failed to fetch status after ${this.maxConsecutiveErrors} attempts: ${error.message}`);
                this.updateConnectionStatus('disconnected', 'Connection failed');

                // Schedule a retry after delay
                setTimeout(() => {
                    if (this.autoRefresh) {
                        console.log('Attempting to restart polling after error...');
                        this.consecutiveErrors = 0;
                        this.startPolling();
                    }
                }, this.retryDelayMs);
            } else {
                this.updateConnectionStatus('connecting', `Retrying... (${this.consecutiveErrors}/${this.maxConsecutiveErrors})`);
            }
        } finally {
            this.isPolling = false;
        }
    }

    async refreshStatus() {
        if (this.refreshBtn.classList.contains('loading')) return;

        this.refreshBtn.classList.add('loading');

        try {
            // Try force refresh via HTTP POST to relay service first
            const refreshResponse = await fetch('/relay/refresh', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                this.handleStatusUpdate(data);
                console.log('Manual refresh completed via POST');
            } else {
                // Fallback to regular GET request
                await this.fetchStatus();
                console.log('Manual refresh completed via GET fallback');
            }
        } catch (error) {
            console.error('Manual refresh failed:', error);
            // Fallback to regular fetch
            await this.fetchStatus();
        } finally {
            setTimeout(() => {
                this.refreshBtn.classList.remove('loading');
            }, 500);
        }
    }

    async handleStatusUpdate(data) {
        this.lastData = data;
        this.hideLoading();
        this.hideError();
        this.showContent();

        this.updateLastUpdated(data.timestamp);

        // Always scan for bundles independently of relay service
        const bundleStatuses = await this.scanBundles();

        this.renderServices(data.services || {}, bundleStatuses);
        this.renderSummary(data.summary || {});

        console.log('Status updated:', {
            timestamp: data.timestamp,
            services: Object.keys(data.services || {}).length,
            bundles: Object.keys(bundleStatuses).length,
            overallStatus: data.summary?.overallStatus
        });
    }

    async scanBundles() {
        const bundleStatuses = {};

        // Bundle configurations defined in status page
        const bundleConfigs = {
            'admin-portal': {
                name: 'Admin Portal',
                discoveryUrl: '/portal/',
                discoveryMethod: 'html-parse',
                configFunction: 'getConfigured'
            }
        };

        // Scan each configured bundle
        for (const [bundleId, config] of Object.entries(bundleConfigs)) {
            try {
                const status = await this.bundleManager.getBundleStatus(bundleId, config);
                bundleStatuses[bundleId] = {
                    ...status,
                    name: config.name,
                    type: 'bundle'
                };
            } catch (error) {
                console.error(`Failed to scan bundle ${bundleId}:`, error);
                bundleStatuses[bundleId] = {
                    configured: false,
                    configuredGroups: {},
                    lastChecked: new Date().toISOString(),
                    error: error.message,
                    name: config.name,
                    type: 'bundle'
                };
            }
        }

        return bundleStatuses;
    }

    renderServices(services, bundles = {}) {
        this.servicesGrid.innerHTML = '';

        // Render service cards
        Object.entries(services).forEach(([serviceId, serviceData]) => {
            const card = this.createServiceCard(serviceId, serviceData);
            this.servicesGrid.appendChild(card);
        });

        // Render bundle cards
        Object.entries(bundles).forEach(([bundleId, bundleData]) => {
            const card = this.createBundleCard(bundleId, bundleData);
            this.servicesGrid.appendChild(card);
        });
    }

    createServiceCard(serviceId, data) {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.setAttribute('data-service', serviceId);

        const serviceName = this.getServiceDisplayName(serviceId);
        const serviceIcon = this.getServiceIcon(serviceId);

        card.innerHTML = `
            <div class="service-header">
                <h3 class="service-name">${serviceName}</h3>
                <div class="service-icon">${serviceIcon}</div>
            </div>
            <div class="service-status">
                <div class="status-item">
                    <span class="status-label">Health</span>
                    <div class="status-indicator">
                        <span class="status-dot-large ${this.getHealthClass(data.health)}"></span>
                        <span class="status-text">${this.getHealthText(data.health)}</span>
                    </div>
                </div>
                <div class="status-item">
                    <span class="status-label">Configuration</span>
                    <div class="status-indicator">
                        <span class="status-dot-large ${this.getConfigClass(data.configured, data.configuredGroups)}"></span>
                        <span class="status-text">${this.getConfigText(data.configured, data.configuredGroups)}</span>
                        ${data.configuredGroups ? '<span class="info-icon" data-tooltip="config">ⓘ</span>' : ''}
                    </div>
                </div>
                <div class="status-item">
                    <span class="status-label">Ready</span>
                    <div class="status-indicator">
                        <span class="status-dot-large ${this.getReadyClass(data.ready)}"></span>
                        <span class="status-text">${this.getReadyText(data.ready)}</span>
                    </div>
                </div>
            </div>
            <div class="service-meta">
                <span>Last checked: ${this.formatTime(data.lastChecked)}</span>
                <span>Response: ${data.responseTime || 'N/A'}ms</span>
            </div>
        `;

        // Store configuration data for tooltip
        if (data.configuredGroups) {
            card.setAttribute('data-config', JSON.stringify(data.configuredGroups));
        }

        return card;
    }

    createBundleCard(bundleId, data) {
        const card = document.createElement('div');
        card.className = 'service-card bundle-card';
        card.setAttribute('data-bundle', bundleId);

        const bundleName = data.name || this.getBundleDisplayName(bundleId);
        const bundleIcon = this.getBundleIcon(bundleId);

        card.innerHTML = `
            <div class="service-header">
                <h3 class="service-name">${bundleName}</h3>
                <div class="service-icon">${bundleIcon}</div>
            </div>
            <div class="service-status">
                <div class="status-item">
                    <span class="status-label">Health</span>
                    <div class="status-indicator">
                        <span class="status-text">N/A</span>
                    </div>
                </div>
                <div class="status-item">
                    <span class="status-label">Configuration</span>
                    <div class="status-indicator">
                        <span class="status-dot-large ${this.getConfigClass(data.configured, data.configuredGroups)}"></span>
                        <span class="status-text">${this.getConfigText(data.configured, data.configuredGroups)}</span>
                        ${data.configuredGroups && Object.keys(data.configuredGroups).length > 0 ? '<span class="info-icon" data-tooltip="config">ⓘ</span>' : ''}
                    </div>
                </div>
                <div class="status-item">
                    <span class="status-label">Ready</span>
                    <div class="status-indicator">
                        <span class="status-text">N/A</span>
                    </div>
                </div>
            </div>
            <div class="service-meta">
                <span>Last checked: ${this.formatTime(data.lastChecked)}</span>
                <span>Type: Bundle</span>
                ${data.error ? `<span class="error-text">Error: ${data.error}</span>` : ''}
            </div>
        `;

        // Store configuration data for tooltip
        if (data.configuredGroups && Object.keys(data.configuredGroups).length > 0) {
            card.setAttribute('data-config', JSON.stringify(data.configuredGroups));
        }

        return card;
    }

    renderSummary(summary) {
        this.totalServices.textContent = summary.totalServices || 0;
        this.healthyServices.textContent = summary.healthyServices || 0;
        this.configuredServices.textContent = summary.configuredServices || 0;
        this.readyServices.textContent = summary.readyServices || 0;

        const overallStatus = summary.overallStatus || 'unknown';
        this.overallStatus.textContent = this.capitalizeFirst(overallStatus);
        this.overallStatus.className = `stat-value ${overallStatus}`;
    }

    showTooltip(event) {
        const target = event.target;
        const serviceCard = target.closest('.service-card');

        if (!serviceCard) return;

        const configData = serviceCard.getAttribute('data-config');
        if (!configData) return;

        try {
            const config = JSON.parse(configData);
            const content = this.generateTooltipContent(config);

            this.tooltipContent.innerHTML = content;
            this.tooltip.style.display = 'block';

            // Position tooltip
            const rect = target.getBoundingClientRect();
            this.tooltip.style.left = `${rect.left + window.scrollX}px`;
            this.tooltip.style.top = `${rect.top + window.scrollY - this.tooltip.offsetHeight - 10}px`;

        } catch (error) {
            console.error('Error showing tooltip:', error);
        }
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    generateTooltipContent(configGroups) {
        let content = '<div class="config-groups">';

        Object.entries(configGroups).forEach(([groupName, groupValue]) => {
            content += `<div class="config-group">`;
            content += `<div class="config-group-name">${this.capitalizeFirst(groupName)}:</div>`;

            if (Array.isArray(groupValue)) {
                groupValue.forEach(item => {
                    content += `<div class="config-item">`;
                    content += `<span class="config-status true"></span>`;
                    content += `<span>${item}</span>`;
                    content += `</div>`;
                });
            } else {
                content += `<div class="config-item">`;
                content += `<span class="config-status ${groupValue}"></span>`;
                content += `<span>${groupValue ? 'Configured' : 'Not configured'}</span>`;
                content += `</div>`;
            }

            content += `</div>`;
        });

        content += '</div>';
        return content;
    }

    // Utility methods
    getServiceDisplayName(serviceId) {
        const names = {
            'service-ip': 'Service IP',
            'player-ip': 'Player IP',
            'content-store': 'Content Store',
            'admin-portal': 'Admin Portal',
            'replicator': 'Replicator'
        };
        return names[serviceId] || this.capitalizeFirst(serviceId.replace('-', ' '));
    }

    getServiceIcon(serviceId) {
        const icons = {
            'service-ip': '🔐',
            'player-ip': '👤',
            'content-store': '📁',
            'admin-portal': '⚙️',
            'replicator': '🔄'
        };
        return icons[serviceId] || '🔧';
    }

    getBundleDisplayName(bundleId) {
        const names = {
            'admin-portal': 'Admin Portal'
        };
        return names[bundleId] || this.capitalizeFirst(bundleId.replace('-', ' '));
    }

    getBundleIcon(bundleId) {
        const icons = {
            'admin-portal': '⚙️'
        };
        return icons[bundleId] || '📦';
    }

    getHealthClass(health) {
        if (health === true) return 'healthy';
        if (health === false) return 'unhealthy';
        return 'unknown';
    }

    getHealthText(health) {
        if (health === true) return 'Healthy';
        if (health === false) return 'Unhealthy';
        return 'Unknown';
    }

    getConfigClass(configured, configGroups) {
        if (configured === true) return 'configured';
        if (configured === false) return 'unconfigured';
        if (configGroups && typeof configGroups === 'object') {
            const values = Object.values(configGroups);
            const hasTrue = values.some(v => v === true || (Array.isArray(v) && v.length > 0));
            const hasFalse = values.some(v => v === false || (Array.isArray(v) && v.length === 0));
            if (hasTrue && hasFalse) return 'partial';
            if (hasTrue) return 'configured';
            if (hasFalse) return 'unconfigured';
        }
        return 'unknown';
    }

    getConfigText(configured, configGroups) {
        if (configured === true) return 'Configured';
        if (configured === false) return 'Not configured';
        if (configGroups && typeof configGroups === 'object') {
            const values = Object.values(configGroups);
            const hasTrue = values.some(v => v === true || (Array.isArray(v) && v.length > 0));
            const hasFalse = values.some(v => v === false || (Array.isArray(v) && v.length === 0));
            if (hasTrue && hasFalse) return 'Partial';
            if (hasTrue) return 'Configured';
            if (hasFalse) return 'Not configured';
        }
        return 'Unknown';
    }

    getReadyClass(ready) {
        if (ready === true) return 'ready';
        if (ready === false) return 'not-ready';
        return 'unknown';
    }

    getReadyText(ready) {
        if (ready === true) return 'Ready';
        if (ready === false) return 'Not Ready';
        return 'Unknown';
    }

    updateConnectionStatus(status, text) {
        this.connectionDot.className = `status-dot ${status}`;
        this.connectionText.textContent = text;
    }

    updateLastUpdated(timestamp) {
        if (timestamp) {
            const date = new Date(timestamp);
            this.lastUpdated.textContent = date.toLocaleString();
        }
    }

    formatTime(timestamp) {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // State management
    showLoading() {
        this.loadingState.style.display = 'flex';
        this.errorState.style.display = 'none';
        this.servicesGrid.style.display = 'none';
        this.summarySection.style.display = 'none';
    }

    hideLoading() {
        this.loadingState.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorState.style.display = 'flex';
        this.loadingState.style.display = 'none';
        this.servicesGrid.style.display = 'none';
        this.summarySection.style.display = 'none';
    }

    hideError() {
        this.errorState.style.display = 'none';
    }

    showContent() {
        this.servicesGrid.style.display = 'grid';
        this.summarySection.style.display = 'block';
    }

    // Cleanup method for proper resource management
    destroy() {
        this.stopPolling();
        console.log('StatusDashboard destroyed');
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.statusDashboard = new StatusDashboard();
});

// Handle page unload - cleanup polling
window.addEventListener('beforeunload', () => {
    if (window.statusDashboard) {
        window.statusDashboard.destroy();
    }
});