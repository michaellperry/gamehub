# GameHub Status Page Bundle Integration

This document describes the bundle integration feature for the GameHub status page, which allows loading JavaScript bundles from configurable pages and displaying their configuration status.

## Overview

The bundle integration feature extends the existing status page to support:
- Dynamic loading of JavaScript bundles from web applications
- Execution of configuration checking functions within those bundles
- Display of bundle configuration status alongside service status
- HTML parsing-based bundle discovery to handle hashed filenames
- Independent bundle scanning without relay service dependency

## Architecture

### Components

1. **BundleManager Class** (`app.js`)
   - Handles bundle discovery and loading
   - Manages bundle caching (5-minute TTL)
   - Executes configuration functions from loaded bundles

2. **StatusDashboard Extensions** (`app.js`)
   - Independently scans configured bundles during each status update
   - Renders bundle cards alongside service cards
   - Manages bundle configurations directly in the status page

3. **Admin Portal Integration** (`app/gamehub-admin/`)
   - Exports `getConfigured()` function globally
   - Checks client, tenant, and service principal configuration
   - Returns structured configuration status

**Note**: The relay service remains focused solely on backend service status and is not involved in bundle management.

## Bundle Discovery Process

### HTML Parsing Method

1. **Fetch HTML**: Status page fetches the bundle's base URL (e.g., `/portal/`)
2. **Parse Scripts**: Extracts `<script type="module" crossorigin>` tags
3. **Extract URL**: Gets the `src` attribute containing the hashed filename
4. **Load Bundle**: Dynamically loads the discovered JavaScript bundle
5. **Execute Function**: Calls the configured function (e.g., `getConfigured`)

### Example Discovery Flow

```
/portal/ → HTML with <script src="/portal/assets/index-Ac4mmi_V.js">
         → Load /portal/assets/index-Ac4mmi_V.js
         → Execute window.getConfigured()
         → Return configuration status
```

## Configuration

### Status Page Bundle Configuration

Bundle configurations are defined directly in the status page (`app.js`) within the `scanBundles()` method:

```javascript
const bundleConfigs = {
    'admin-portal': {
        name: 'Admin Portal',
        discoveryUrl: '/portal/',
        discoveryMethod: 'html-parse',
        configFunction: 'getConfigured'
    }
};
```

**Configuration Properties:**
- `name`: Display name for the bundle card
- `discoveryUrl`: URL to fetch HTML and discover bundle script
- `discoveryMethod`: Method for bundle discovery (currently only 'html-parse')
- `configFunction`: Name of the global function to execute for configuration status

### Admin Portal Function

```typescript
window.getConfigured = function() {
  return {
    configured: boolean,
    configuredGroups: {
      client: boolean,
      tenant: boolean,
      servicePrincipal: boolean
    }
  };
};
```

## Bundle Card Display

Bundle cards are visually distinguished from service cards:
- **Purple left border** and **"Bundle" indicator**
- **Health**: N/A (not applicable for bundles)
- **Configuration**: Shows overall status with detailed tooltip
- **Ready**: N/A (not applicable for bundles)
- **Error handling**: Displays error messages when bundle loading fails

## Files Modified

### Status Page
- `mesh/nginx/html/status/app.js` - Added BundleManager and StatusDashboard extensions
- `mesh/nginx/html/status/styles.css` - Added bundle card styling
- `mesh/nginx/html/status/test-bundle.html` - Test page for bundle functionality
- `mesh/nginx/html/status/README.md` - Documentation for bundle integration

### Admin Portal
- `app/gamehub-admin/src/config/status-check.ts` - Configuration checking logic
- `app/gamehub-admin/src/main.tsx` - Import status check module

**Note**: No relay service modifications are required. The relay service remains focused on backend service status only.

## Testing

### Manual Testing
1. Open `http://localhost/status/test-bundle.html`
2. Click "Test Bundle Manager" to verify BundleManager functionality
3. Click "Test Mock getConfigured" to verify function execution

### Integration Testing
1. Start GameHub services with Admin Portal
2. Navigate to `http://localhost/status/`
3. Verify Admin Portal bundle card appears
4. Check configuration status reflects actual Admin Portal state

## Error Handling

### Bundle Loading Failures
- Network errors during HTML fetching
- Missing or malformed script tags
- JavaScript execution errors
- Function not found or not callable

### Graceful Degradation
- Failed bundles show "Unknown" configuration status
- Error messages displayed in bundle card metadata
- Other services continue to function normally
- Retry logic with exponential backoff

## Performance Considerations

### Caching
- Bundle URLs cached for 5 minutes
- Configuration results cached by relay service
- Prevents excessive HTML parsing and bundle loading

### Timeouts
- Bundle discovery: 10 seconds
- Function execution: Immediate (synchronous)
- Overall bundle check: Configurable (default 5 seconds)

## Security Considerations

### Same-Origin Policy
- Bundle loading respects CORS policies
- Only loads bundles from same origin by default
- Uses `crossorigin="anonymous"` for script loading

### Function Execution
- Functions executed in global scope
- No sensitive data exposed in configuration responses
- Error handling prevents script injection

## Future Enhancements

### Potential Improvements
1. **Manifest File Support**: Alternative to HTML parsing
2. **Multiple Bundle Sources**: Support for external bundle URLs
3. **Bundle Versioning**: Track and display bundle versions
4. **Configuration History**: Store configuration status over time
5. **Bundle Health Checks**: Periodic validation of bundle availability

### Configuration Extensions
- Support for custom configuration functions
- Multiple configuration groups per bundle
- Conditional bundle loading based on environment

## Troubleshooting

### Common Issues

1. **Bundle Not Discovered**
   - Check HTML structure of discovery URL
   - Verify script tag has `type="module"` and `crossorigin` attributes
   - Ensure bundle URL is accessible

2. **Function Not Found**
   - Verify function is exported globally (`window.functionName`)
   - Check function name matches configuration
   - Ensure bundle loads without JavaScript errors

3. **Configuration Status Incorrect**
   - Review Admin Portal environment variables
   - Check function logic in `status-check.ts`
   - Verify configuration group definitions

### Debug Information
- Browser console shows bundle loading progress
- Network tab displays bundle discovery requests
- Status page displays error messages in bundle cards