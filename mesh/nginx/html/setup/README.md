# GameHub Setup Page

The GameHub Setup Page is a guided walkthrough wizard that helps users configure their GameHub environment step-by-step. It provides real-time status integration and interactive setup instructions.

## Overview

The Setup Page is implemented as a static HTML/CSS/JavaScript application that integrates with the Relay Service to provide real-time configuration status updates. It guides users through the complete GameHub setup process from prerequisites verification to service principal authorization.

## Features

### Core Functionality
- **Step-by-step wizard** with 6 configuration steps
- **Real-time status integration** via WebSocket connection to Relay Service
- **Progress tracking** with visual progress bar and step indicators
- **Interactive setup instructions** with copy-paste commands
- **Completion validation** based on service configuration status
- **Progress persistence** using localStorage
- **Responsive design** for desktop and mobile devices

### Setup Steps

1. **Prerequisites Verification**
   - Check Node.js version (>= 18.0.0)
   - Check npm version (>= 9.0.0)
   - Check Docker and Docker Compose
   - Check Git configuration
   - **Validation**: All prerequisites are available

2. **Repository Setup**
   - Install dependencies with `npm install`
   - Build shared model with `npm run build:model`
   - **Validation**: gamehub-model is built successfully

3. **Environment Initialization**
   - Run `./scripts/init-mesh.sh` script
   - Start Docker services with `docker compose up -d`
   - **Validation**: All services are healthy via Relay Service

4. **FusionAuth Configuration**
   - Access FusionAuth admin interface
   - Create API key with required permissions
   - Run FusionAuth setup script
   - **Validation**: Admin Portal `client` configuration group is true

5. **Tenant Creation**
   - Access tenant management interface
   - Create new tenant for organization
   - Update configuration with tenant key
   - **Validation**: Admin Portal `tenant` configuration group is true

6. **Service Principal Authorization**
   - Check player-ip logs for service principal public key
   - Add service principal in admin app
   - Authorize service principal for tenant
   - **Validation**: Player IP `ready` endpoint is true

## File Structure

```
mesh/nginx/html/setup/
├── index.html          # Main setup wizard HTML
├── styles.css          # Complete CSS styling
├── app.js             # JavaScript application logic
├── favicon.ico        # Site favicon (shared)
└── README.md          # This documentation
```

## Technical Implementation

### HTML Structure
- **Progress Bar**: Visual progress indicator with step circles
- **Step Overview Cards**: Grid of step cards showing status and progress
- **Step Panel**: Detailed instructions for current step
- **Modals**: Command execution and input collection modals
- **Navigation**: Previous/Next/Skip/Complete buttons

### CSS Styling
- **Consistent Design**: Matches Status Page styling patterns
- **Glass Morphism**: Backdrop blur effects and transparency
- **Responsive Layout**: Grid-based responsive design
- **Animations**: Smooth transitions and loading states
- **Accessibility**: WCAG 2.1 compliant with proper contrast and focus states

### JavaScript Architecture
- **SetupWizard Class**: Main application controller
- **WebSocket Integration**: Real-time connection to Relay Service
- **Step Management**: Dynamic step rendering and validation
- **Progress Persistence**: localStorage-based progress saving
- **Modal System**: Command and input modal management
- **Status Integration**: Real-time validation based on service status

## Integration with Relay Service

The Setup Page connects to the Relay Service at `/relay/ws` for real-time status updates:

### WebSocket Messages
```javascript
// Request status update
{ type: 'get_status' }

// Receive status update
{
  type: 'status_update',
  data: {
    services: { /* service status */ },
    bundles: { /* bundle status */ },
    summary: { /* overall summary */ }
  }
}
```

### Status Validation
- **Step 3**: Validates `summary.healthyServices >= 3`
- **Step 4**: Validates `bundles['admin-portal'].configuredGroups.client === true`
- **Step 5**: Validates `bundles['admin-portal'].configuredGroups.tenant === true`
- **Step 6**: Validates `services['player-ip'].ready === true`

## User Experience Features

### Interactive Elements
- **Copy-to-clipboard**: One-click command copying
- **External links**: Direct access to admin interfaces
- **Input collection**: Modal forms for API keys and configuration
- **Progress saving**: Automatic progress persistence
- **Step navigation**: Jump to any accessible step

### Visual Feedback
- **Status indicators**: ✅ Complete, ⏳ In Progress, ⭕ Pending
- **Progress bar**: Visual completion percentage
- **Connection status**: Real-time connection indicator
- **Loading states**: Smooth loading and error states

### Responsive Design
- **Desktop**: Full grid layout with side-by-side panels
- **Tablet**: Stacked layout with maintained functionality
- **Mobile**: Single-column layout with touch-friendly controls

## Configuration

### Environment Variables
The Setup Page uses the same environment as other static pages:
- Served by NGINX at `/setup/`
- Connects to Relay Service at `/relay/ws`
- Links to admin interfaces at `/admin/` and `/auth/admin`

### NGINX Configuration
Add to `nginx.conf`:
```nginx
location /setup/ {
    alias /usr/share/nginx/html/setup/;
    try_files $uri $uri/ /setup/index.html;
}
```

## Development

### Local Development
1. Ensure Relay Service is running
2. Serve files via NGINX or local server
3. Access at `http://localhost/setup`

### Testing
- Test WebSocket connection to Relay Service
- Verify step validation logic
- Test responsive design on various devices
- Validate accessibility compliance

### Customization
- Modify step definitions in `app.js`
- Update styling in `styles.css`
- Add new validation logic in step methods
- Extend modal system for additional inputs

## Troubleshooting

### Common Issues
1. **WebSocket Connection Failed**
   - Ensure Relay Service is running
   - Check NGINX WebSocket proxy configuration
   - Verify network connectivity

2. **Step Validation Not Working**
   - Check Relay Service status endpoint
   - Verify service configuration groups
   - Review browser console for errors

3. **Progress Not Saving**
   - Check localStorage availability
   - Verify browser storage permissions
   - Clear localStorage if corrupted

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('gamehub-setup-debug', 'true');
```

## Security Considerations

- **No sensitive data storage**: API keys and secrets are not persisted
- **Input validation**: All user inputs are validated
- **XSS protection**: Proper HTML escaping for dynamic content
- **HTTPS ready**: Supports secure WebSocket connections

## Future Enhancements

- **Automated validation**: Client-side prerequisite checking
- **Progress sharing**: Export/import setup progress
- **Custom steps**: User-defined setup steps
- **Integration testing**: Automated setup validation
- **Multi-language support**: Internationalization