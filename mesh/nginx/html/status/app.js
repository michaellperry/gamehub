/**
 * GameHub Status Dashboard
 * Real-time service monitoring with WebSocket integration
 */

class StatusDashboard {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.autoRefresh = true;
        this.lastData = null;
        
        this.initializeElements();
        this.bindEvents();
        this.connect();
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
            if (this.autoRefresh && this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.requestStatus();
            }
        });

        // Retry button
        this.retryBtn.addEventListener('click', () => {
            this.connect();
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

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.autoRefresh) {
                this.requestStatus();
            }
        });
    }

    connect() {
        this.showLoading();
        this.updateConnectionStatus('connecting', 'Connecting...');

        try {
            // Use the current protocol and host for WebSocket connection
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/relay/ws`;
            
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.updateConnectionStatus('connected', 'Connected');
                this.requestStatus();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleStatusUpdate(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                this.updateConnectionStatus('disconnected', 'Disconnected');
                
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.scheduleReconnect();
                } else {
                    this.showError('Connection lost. Maximum reconnection attempts reached.');
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('disconnected', 'Connection Error');
            };

        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.showError('Failed to establish WebSocket connection.');
        }
    }

    scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        this.updateConnectionStatus('connecting', `Reconnecting in ${Math.ceil(delay / 1000)}s...`);
        
        setTimeout(() => {
            if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                this.connect();
            }
        }, delay);
    }

    requestStatus() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // The relay service sends status automatically, but we can request it
            this.ws.send(JSON.stringify({ type: 'request_status' }));
        } else {
            // Fallback to HTTP request
            this.fetchStatusHTTP();
        }
    }

    async fetchStatusHTTP() {
        try {
            const response = await fetch('/relay');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            this.handleStatusUpdate(data);
        } catch (error) {
            console.error('HTTP status fetch failed:', error);
            this.showError(`Failed to fetch status: ${error.message}`);
        }
    }

    refreshStatus() {
        if (this.refreshBtn.classList.contains('loading')) return;
        
        this.refreshBtn.classList.add('loading');
        
        // Force refresh via HTTP POST to relay service
        fetch('/relay/refresh', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                this.handleStatusUpdate(data);
            })
            .catch(error => {
                console.error('Refresh failed:', error);
                this.requestStatus(); // Fallback to regular request
            })
            .finally(() => {
                setTimeout(() => {
                    this.refreshBtn.classList.remove('loading');
                }, 500);
            });
    }

    handleStatusUpdate(data) {
        this.lastData = data;
        this.hideLoading();
        this.hideError();
        this.showContent();
        
        this.updateLastUpdated(data.timestamp);
        this.renderServices(data.services || {});
        this.renderSummary(data.summary || {});
    }

    renderServices(services) {
        this.servicesGrid.innerHTML = '';
        
        Object.entries(services).forEach(([serviceId, serviceData]) => {
            const card = this.createServiceCard(serviceId, serviceData);
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
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new StatusDashboard();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.statusDashboard && window.statusDashboard.ws) {
        window.statusDashboard.ws.close();
    }
});