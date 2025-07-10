/**
 * GameHub Setup Wizard
 * Guided walkthrough for configuring the GameHub environment
 */

class SetupWizard {
    constructor() {
        this.pollingInterval = null;
        this.pollingDelay = 10000; // 10 seconds
        this.currentStep = 1;
        this.totalSteps = 3;
        this.stepData = {};
        this.statusData = null;
        this.isConnected = false;
        
        // Step definitions
        this.steps = [
            {
                id: 1,
                title: 'FusionAuth Configuration',
                description: 'Configure OAuth applications and API keys',
                estimatedTime: '15 minutes',
                validationKey: 'fusionauth'
            },
            {
                id: 2,
                title: 'Tenant Creation',
                description: 'Create tenant and configure public keys',
                estimatedTime: '10 minutes',
                validationKey: 'tenant'
            },
            {
                id: 3,
                title: 'Service Principal Authorization',
                description: 'Authorize service principal for tenant access',
                estimatedTime: '5 minutes',
                validationKey: 'servicePrincipal'
            }
        ];
        
        this.initializeElements();
        this.bindEvents();
        this.loadSavedProgress();
        this.startPolling();
    }

    initializeElements() {
        // Connection status elements
        this.connectionStatus = document.getElementById('connectionStatus');
        this.connectionDot = document.getElementById('connectionDot');
        this.connectionText = document.getElementById('connectionText');
        
        // Progress elements
        this.currentStepSpan = document.getElementById('currentStep');
        this.totalStepsSpan = document.getElementById('totalSteps');
        this.progressFill = document.getElementById('progressFill');
        this.progressSteps = document.getElementById('progressSteps');
        
        // Content elements
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.errorMessage = document.getElementById('errorMessage');
        this.wizardContainer = document.getElementById('wizardContainer');
        this.completionState = document.getElementById('completionState');
        this.retryBtn = document.getElementById('retryBtn');
        
        // Wizard elements
        this.stepsOverview = document.getElementById('stepsOverview');
        this.stepPanel = document.getElementById('stepPanel');
        this.stepTitle = document.getElementById('stepTitle');
        this.stepStatus = document.getElementById('stepStatus');
        this.stepStatusIndicator = document.getElementById('stepStatusIndicator');
        this.stepStatusText = document.getElementById('stepStatusText');
        this.stepContent = document.getElementById('stepContent');
        
        // Action buttons
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.completeBtn = document.getElementById('completeBtn');
        
        // Modals
        this.commandModal = document.getElementById('commandModal');
        this.inputModal = document.getElementById('inputModal');
        this.tooltip = document.getElementById('tooltip');
        
        // Set total steps
        this.totalStepsSpan.textContent = this.totalSteps;
    }

    bindEvents() {
        // Retry button
        this.retryBtn.addEventListener('click', () => {
            this.startPolling();
        });

        // Navigation buttons removed - wizard now auto-advances

        // Modal events
        this.bindModalEvents();

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.fetchStatus();
            }
        });

        // Auto-save progress and cleanup
        window.addEventListener('beforeunload', () => {
            this.saveProgress();
            this.stopPolling();
        });
    }

    bindModalEvents() {
        // Command modal
        const commandModal = this.commandModal;
        const commandModalClose = document.getElementById('modalClose');
        const commandModalCancel = document.getElementById('modalCancelBtn');
        const commandModalDone = document.getElementById('modalDoneBtn');
        const commandCopyBtn = document.getElementById('modalCopyBtn');

        commandModalClose.addEventListener('click', () => {
            this.hideModal(commandModal);
        });

        commandModalCancel.addEventListener('click', () => {
            this.hideModal(commandModal);
        });

        commandModalDone.addEventListener('click', () => {
            this.markCommandComplete();
        });

        commandCopyBtn.addEventListener('click', () => {
            this.copyCommand();
        });

        // Input modal
        const inputModal = this.inputModal;
        const inputModalClose = document.getElementById('inputModalClose');
        const inputModalCancel = document.getElementById('inputModalCancelBtn');
        const inputModalSave = document.getElementById('inputModalSaveBtn');

        inputModalClose.addEventListener('click', () => {
            this.hideModal(inputModal);
        });

        inputModalCancel.addEventListener('click', () => {
            this.hideModal(inputModal);
        });

        inputModalSave.addEventListener('click', () => {
            this.saveInput();
        });

        // Close modals on backdrop click
        [commandModal, inputModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal);
                }
            });
        });
    }

    startPolling() {
        this.showLoading();
        this.updateConnectionStatus('connecting', 'Connecting...');
        
        // Clear any existing polling interval
        this.stopPolling();
        
        // Fetch status immediately
        this.fetchStatus();
        
        // Set up periodic polling
        this.pollingInterval = setInterval(() => {
            this.fetchStatus();
        }, this.pollingDelay);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    async fetchStatus() {
        try {
            const response = await fetch('/relay');
            if (response.ok) {
                const data = await response.json();
                this.handleStatusUpdate(data);
                
                if (!this.isConnected) {
                    this.isConnected = true;
                    this.updateConnectionStatus('connected', 'Connected');
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to fetch status:', error);
            
            if (this.isConnected) {
                this.isConnected = false;
                this.updateConnectionStatus('disconnected', 'Disconnected');
            }
            
            // Show error only if we haven't shown the wizard yet
            if (!this.statusData) {
                this.showError('Unable to connect to the relay service. Please ensure all services are running.');
            }
        }
    }

    handleStatusUpdate(data) {
        this.statusData = data;
        this.updateStepValidation();
        this.showWizard();
    }

    updateConnectionStatus(status, text) {
        this.connectionDot.className = `status-dot ${status}`;
        this.connectionText.textContent = text;
    }

    showLoading() {
        this.loadingState.style.display = 'flex';
        this.errorState.style.display = 'none';
        this.wizardContainer.style.display = 'none';
        this.completionState.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.loadingState.style.display = 'none';
        this.errorState.style.display = 'flex';
        this.wizardContainer.style.display = 'none';
        this.completionState.style.display = 'none';
    }

    showWizard() {
        this.loadingState.style.display = 'none';
        this.errorState.style.display = 'none';
        
        // Check if all steps are completed
        if (this.allStepsCompleted()) {
            this.showCompletion();
            return;
        }
        
        // Find and set the first incomplete step
        this.currentStep = this.getFirstIncompleteStep();
        
        this.wizardContainer.style.display = 'flex';
        this.completionState.style.display = 'none';
        
        this.renderProgressSteps();
        this.renderStepsOverview();
        this.renderCurrentStep();
    }

    showCompletion() {
        this.loadingState.style.display = 'none';
        this.errorState.style.display = 'none';
        this.wizardContainer.style.display = 'none';
        this.completionState.style.display = 'flex';
    }

    renderProgressSteps() {
        this.progressSteps.innerHTML = '';
        
        this.steps.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = 'progress-step';
            
            const isCompleted = this.isStepCompleted(step.id);
            const isCurrent = step.id === this.currentStep;
            
            if (isCompleted) stepElement.classList.add('completed');
            if (isCurrent) stepElement.classList.add('current');
            
            const circle = document.createElement('div');
            circle.className = 'step-circle';
            if (isCompleted) circle.classList.add('completed');
            if (isCurrent) circle.classList.add('current');
            circle.textContent = isCompleted ? '✓' : step.id;
            
            const label = document.createElement('div');
            label.className = 'step-label';
            if (isCompleted) label.classList.add('completed');
            if (isCurrent) label.classList.add('current');
            label.textContent = step.title.split(' ')[0]; // First word only for space
            
            stepElement.appendChild(circle);
            stepElement.appendChild(label);
            this.progressSteps.appendChild(stepElement);
        });
        
        // Update progress bar
        const completedSteps = this.steps.filter(step => this.isStepCompleted(step.id)).length;
        const progress = (completedSteps / this.totalSteps) * 100;
        this.progressFill.style.width = `${progress}%`;
    }

    renderStepsOverview() {
        this.stepsOverview.innerHTML = '';
        
        this.steps.forEach(step => {
            const card = document.createElement('div');
            card.className = 'step-card';
            
            const isCompleted = this.isStepCompleted(step.id);
            const isCurrent = step.id === this.currentStep;
            
            if (isCompleted) card.classList.add('completed');
            if (isCurrent) card.classList.add('current');
            
            // Remove click event handler - no manual navigation
            
            card.innerHTML = `
                <div class="step-card-header">
                    <div class="step-card-number">${isCompleted ? '✓' : step.id}</div>
                    <div class="step-card-status">${this.getStepStatusIcon(step.id)}</div>
                </div>
                <div class="step-card-title">${step.title}</div>
                <div class="step-card-description">${step.description}</div>
                <div class="step-card-meta">
                    <span>Est. ${step.estimatedTime}</span>
                    <span>${this.getStepStatusText(step.id)}</span>
                </div>
            `;
            
            this.stepsOverview.appendChild(card);
        });
    }

    renderCurrentStep() {
        const step = this.steps.find(s => s.id === this.currentStep);
        if (!step) return;
        
        this.currentStepSpan.textContent = this.currentStep;
        this.stepTitle.textContent = step.title;
        
        const isCompleted = this.isStepCompleted(step.id);
        this.stepStatusIndicator.textContent = this.getStepStatusIcon(step.id);
        this.stepStatusText.textContent = this.getStepStatusText(step.id);
        
        // Hide all navigation buttons
        this.prevBtn.style.display = 'none';
        this.nextBtn.style.display = 'none';
        this.completeBtn.style.display = 'none';
        this.skipBtn.style.display = 'none';
        
        // Render step content
        this.renderStepContent(step);
    }

    renderStepContent(step) {
        switch (step.id) {
            case 1:
                this.renderFusionAuthStep();
                break;
            case 2:
                this.renderTenantStep();
                break;
            case 3:
                this.renderServicePrincipalStep();
                break;
        }
    }


    renderFusionAuthStep() {
        this.stepContent.innerHTML = `
            <div class="step-instructions">
                <h3>FusionAuth Configuration</h3>
                <p>Configure OAuth applications and API keys for authentication:</p>
                <ol>
                    <li><strong>Access FusionAuth admin interface</strong> at <a href="/auth/admin" target="_blank">http://localhost/auth/admin</a></li>
                    <li><strong>Create an API key</strong> with required permissions</li>
                    <li><strong>Run the FusionAuth setup script</strong> with your API key</li>
                    <li><strong>Configure OAuth applications</strong> for the admin portal</li>
                </ol>
                <div style="margin-top: 20px;">
                    <button class="action-button" onclick="setupWizard.promptForApiKey()">Enter API Key</button>
                    <a href="/auth/admin" target="_blank" class="action-button secondary">Open FusionAuth Admin</a>
                </div>
                <div style="margin-top: 15px;">
                    <p><strong>Validation:</strong> This step is complete when the Admin Portal client configuration group is true.</p>
                </div>
            </div>
        `;
    }

    renderTenantStep() {
        this.stepContent.innerHTML = `
            <div class="step-instructions">
                <h3>Tenant Creation</h3>
                <p>Create a tenant for your organization and configure public keys:</p>
                <ol>
                    <li><strong>Access tenant management interface</strong> at <a href="/admin" target="_blank">http://localhost/admin</a></li>
                    <li><strong>Create a new tenant</strong> for your game/organization</li>
                    <li><strong>Copy the tenant public key</strong> from the created tenant</li>
                    <li><strong>Update configuration</strong> with the tenant key</li>
                </ol>
                <div style="margin-top: 20px;">
                    <button class="action-button" onclick="setupWizard.promptForTenantKey()">Enter Tenant Key</button>
                    <a href="/admin" target="_blank" class="action-button secondary">Open Admin Portal</a>
                </div>
                <div style="margin-top: 15px;">
                    <p><strong>Validation:</strong> This step is complete when the Admin Portal tenant configuration group is true.</p>
                </div>
            </div>
        `;
    }

    renderServicePrincipalStep() {
        this.stepContent.innerHTML = `
            <div class="step-instructions">
                <h3>Service Principal Authorization</h3>
                <p>Authorize the service principal for tenant access:</p>
                <ol>
                    <li><strong>Check player-ip logs</strong> for the service principal public key</li>
                    <li><strong>Add the service principal</strong> in the admin app's Service Principals page</li>
                    <li><strong>Authorize the service principal</strong> for your tenant</li>
                    <li><strong>Verify the configuration</strong> is complete</li>
                </ol>
                <div style="margin-top: 20px;">
                    <button class="action-button" onclick="setupWizard.showCommand('cd mesh && docker compose logs player-ip | grep \\'service principal\\'', 'Get Service Principal Key')">Get Service Principal Key</button>
                    <a href="/admin" target="_blank" class="action-button secondary">Open Admin Portal</a>
                </div>
                <div style="margin-top: 15px;">
                    <p><strong>Validation:</strong> This step is complete when the Player IP ready endpoint returns true.</p>
                </div>
            </div>
        `;
    }

    // Step validation methods
    isStepCompleted(stepId) {
        if (!this.statusData) return false;
        
        switch (stepId) {
            case 1: // FusionAuth Configuration
                return this.statusData.bundles?.['admin-portal']?.configuredGroups?.client === true;
            case 2: // Tenant Creation
                return this.statusData.bundles?.['admin-portal']?.configuredGroups?.tenant === true;
            case 3: // Service Principal Authorization
                return this.statusData.services?.['player-ip']?.ready === true;
            default:
                return false;
        }
    }

    getStepStatusIcon(stepId) {
        if (this.isStepCompleted(stepId)) return '✅';
        if (stepId === this.currentStep) return '⏳';
        return '⭕';
    }

    getStepStatusText(stepId) {
        if (this.isStepCompleted(stepId)) return 'Complete';
        if (stepId === this.currentStep) return 'In Progress';
        if (stepId < this.currentStep) return 'Skipped';
        return 'Pending';
    }

    canSkipStep(stepId) {
        // Allow skipping most steps except critical ones
        return stepId !== 3; // Don't allow skipping service principal authorization
    }

    allStepsCompleted() {
        return this.steps.every(step => this.isStepCompleted(step.id));
    }

    getFirstIncompleteStep() {
        const incompleteStep = this.steps.find(step => !this.isStepCompleted(step.id));
        return incompleteStep ? incompleteStep.id : 1;
    }

    updateStepValidation() {
        // Update step completion status based on current service status
        this.renderProgressSteps();
        this.renderStepsOverview();
        
        // Check if all steps are complete
        if (this.allStepsCompleted()) {
            this.showCompletion();
            return;
        }
        
        // Auto-advance to first incomplete step if current step is now complete
        const firstIncompleteStep = this.getFirstIncompleteStep();
        if (this.currentStep !== firstIncompleteStep) {
            this.currentStep = firstIncompleteStep;
            this.renderCurrentStep();
        }
    }

    // Navigation methods removed - wizard now auto-advances

    // Utility methods

    promptForApiKey() {
        this.showInputModal(
            'FusionAuth API Key',
            'Enter your FusionAuth API key with the required permissions:',
            'API Key',
            'Enter API key...',
            'You can create an API key in the FusionAuth admin interface under Settings → API Keys',
            (value) => {
                this.stepData.fusionAuthApiKey = value;
                this.showCommand(`./scripts/setup-fusionauth.sh ${value}`, 'Run FusionAuth Setup');
            }
        );
    }

    promptForTenantKey() {
        this.showInputModal(
            'Tenant Public Key',
            'Enter the tenant public key from your created tenant:',
            'Tenant Key',
            'Enter tenant public key...',
            'Copy the public key from the tenant you created in the admin portal',
            (value) => {
                this.stepData.tenantKey = value;
                this.showCommand(`cd setup && npm run update-tenant-key -- --tenant-key "${value}"`, 'Update Tenant Configuration');
            }
        );
    }

    showCommand(command, title) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalDescription').textContent = 'Run the following command in your terminal:';
        document.getElementById('modalCommand').textContent = command;
        this.currentCommand = command;
        this.showModal(this.commandModal);
    }

    showInputModal(title, description, label, placeholder, help, callback) {
        document.getElementById('inputModalTitle').textContent = title;
        document.getElementById('inputModalDescription').textContent = description;
        document.getElementById('inputModalLabel').textContent = label;
        document.getElementById('inputModalField').placeholder = placeholder;
        
        const helpElement = document.getElementById('inputModalHelp');
        if (help) {
            helpElement.textContent = help;
            helpElement.style.display = 'block';
        } else {
            helpElement.style.display = 'none';
        }
        
        this.inputCallback = callback;
        this.showModal(this.inputModal);
        document.getElementById('inputModalField').focus();
    }

    showModal(modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hideModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    copyCommand() {
        const command = this.currentCommand;
        navigator.clipboard.writeText(command).then(() => {
            const copyBtn = document.getElementById('modalCopyBtn');
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '✓';
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="m5 15-4-4 4-4"></path>
                    </svg>
                `;
            }, 2000);
        });
    }

    markCommandComplete() {
        this.hideModal(this.commandModal);
        // Mark current step as having some progress
        this.stepData[`step${this.currentStep}Progress`] = true;
        this.fetchStatus(); // Refresh status to check completion
    }

    saveInput() {
        const value = document.getElementById('inputModalField').value.trim();
        if (value && this.inputCallback) {
            this.inputCallback(value);
        }
        this.hideModal(this.inputModal);
    }

    // Progress persistence
    saveProgress() {
        const progress = {
            currentStep: this.currentStep,
            stepData: this.stepData,
            timestamp: Date.now()
        };
        localStorage.setItem('gamehub-setup-progress', JSON.stringify(progress));
    }

    loadSavedProgress() {
        try {
            const saved = localStorage.getItem('gamehub-setup-progress');
            if (saved) {
                const progress = JSON.parse(saved);
                // Only load if saved within last 24 hours
                if (Date.now() - progress.timestamp < 24 * 60 * 60 * 1000) {
                    this.currentStep = progress.currentStep || 1;
                    this.stepData = progress.stepData || {};
                }
            }
        } catch (error) {
            console.error('Failed to load saved progress:', error);
        }
    }
}

// Initialize the setup wizard when the page loads
let setupWizard;
document.addEventListener('DOMContentLoaded', () => {
    setupWizard = new SetupWizard();
});

// Make setupWizard globally available for onclick handlers
window.setupWizard = setupWizard;