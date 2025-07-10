# GameHub Status Page

A robust HTTP polling-based dashboard for monitoring GameHub services, implemented as a static HTML/CSS/JavaScript application served directly by NGINX.

## Overview

The Status Page provides reliable visibility into the health, configuration, and readiness status of all GameHub services through an intuitive web dashboard that uses HTTP polling to fetch data at regular intervals.

## Features

### HTTP Polling Architecture
- **Reliable Polling**: Automatic status updates via HTTP requests every 10 seconds
- **Error Handling**: Intelligent error recovery with exponential backoff
- **Connection Status**: Visual indicator of polling health and connectivity
- **Auto-refresh Toggle**: Enable/disable automatic status updates
- **Manual Refresh**: Force immediate status update with visual feedback

### Service Status Display
- **Service Cards**: Visual cards for each monitored service
- **Health Indicators**: Color-coded status (🟢 Healthy, 🔴 Unhealthy, 🟡 Unknown)
- **Configuration Status**: Detailed configuration group status with tooltips
- **Readiness Status**: Service readiness indicators
- **Response Times**: Performance metrics for each service

### User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Mode Support**: Automatic dark mode based on system preferences
- **Loading States**: Smooth loading and error state handling
- **Manual Refresh**: Force refresh capability with visual feedback
- **Tooltips**: Detailed configuration information on hover

### Accessibility
- **WCAG 2.1 Compliant**: Proper ARIA labels and keyboard navigation
- **Screen Reader Support**: Semantic HTML structure
- **High Contrast**: Clear visual indicators and color schemes
- **Print Friendly**: Optimized print styles

## Architecture

### File Structure
```
mesh/nginx/html/status/
├── index.html          # Main HTML structure
├── styles.css          # Complete CSS styling with responsive design
├── app.js             # JavaScript application logic with HTTP polling
├── favicon.ico        # Site favicon
└── README.md          # This documentation
```

### Technology Stack
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with Flexbox/Grid, animations, and responsive design
- **Vanilla JavaScript**: No external dependencies for maximum performance
- **HTTP Polling**: Regular status requests to Relay Service API
- **Fetch API**: Modern HTTP client for status requests

### Integration Points
- **Relay Service**: Primary data source via HTTP API
- **NGINX**: Static file serving at `/status/` route
- **Docker**: Containerized deployment within GameHub mesh

## HTTP Polling System

### Polling Configuration
The status page uses a robust HTTP polling system with the following characteristics:

- **Polling Interval**: 10 seconds (configurable via `pollingIntervalMs`)
- **Request Timeout**: 8 seconds per request
- **Error Threshold**: 5 consecutive failures before stopping
- **Retry Delay**: 5 seconds after max errors reached
- **Auto-recovery**: Automatic restart after error delay

### Polling Behavior
```javascript
// Polling configuration
const config = {
    pollingIntervalMs: 10000,    // 10 seconds between requests
    maxConsecutiveErrors: 5,     // Stop after 5 failures
    retryDelayMs: 5000,         // Wait 5s before retry
    requestTimeoutMs: 8000       // 8s request timeout
};
```

### Error Handling
The polling system includes comprehensive error handling:

1. **Network Errors**: Automatic retry with exponential backoff
2. **Timeout Errors**: Request cancellation after 8 seconds
3. **HTTP Errors**: Proper handling of 4xx/5xx status codes
4. **Parse Errors**: Graceful handling of invalid JSON responses
5. **Consecutive Failures**: Automatic polling suspension after threshold

## API Integration

### HTTP Endpoint
```javascript
// Primary status endpoint
const statusUrl = '/relay';

// Manual refresh endpoint (optional)
const refreshUrl = '/relay/refresh';
```

### Request Configuration
```javascript
// Standard polling request
const response = await fetch('/relay', {
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    },
    signal: abortController.signal
});
```

### Data Format
The status page expects data in the following format from the Relay Service:

```json
{
  "timestamp": "2025-01-09T15:30:15.123Z",
  "services": {
    "service-ip": {
      "health": true,
      "configured": true,
      "configuredGroups": {
        "jwt": true,
        "clients": ["player-ip"]
      },
      "ready": true,
      "lastChecked": "2025-01-09T15:30:14.890Z",
      "responseTime": 45
    }
  },
  "summary": {
    "totalServices": 3,
    "healthyServices": 3,
    "configuredServices": 2,
    "readyServices": 2,
    "overallStatus": "healthy"
  }
}
```

## Deployment

### NGINX Configuration
The status page is served by NGINX at `/status/` with the following configuration:

```nginx
# Status Page (HTTP polling-based dashboard)
location /status/ {
    alias /usr/share/nginx/html/status/;
    try_files $uri $uri/ /status/index.html;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1h;
        add_header Cache-Control "public";
    }
    
    # Prevent caching of HTML to ensure fresh polling behavior
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
    }
}
```

### Access Points
- **Dashboard**: `http://localhost/status`
- **Direct Files**: `http://localhost/status/index.html`
- **API Endpoint**: `http://localhost/relay` (for data)
- **Refresh Endpoint**: `http://localhost/relay/refresh` (for manual refresh)

## Development

### Local Development
1. Ensure the Relay Service is running and accessible at `/relay`
2. Serve the files through NGINX or any static file server
3. Open `http://localhost/status` in your browser
4. Monitor browser console for polling activity and errors

### Testing HTTP Polling
```javascript
// Test HTTP polling in browser console
const testPolling = async () => {
    try {
        const response = await fetch('/relay');
        const data = await response.json();
        console.log('Polling test successful:', data);
    } catch (error) {
        console.error('Polling test failed:', error);
    }
};

// Run test
testPolling();
```

### Debugging
- **Browser DevTools**: Network tab shows HTTP requests and responses
- **Console Logs**: Application logs polling status and errors
- **Connection Status**: Visual indicator in the dashboard header
- **Performance**: Monitor request timing and frequency

## Performance Considerations

### Optimization Features
- **Minimal Dependencies**: No external libraries for fast loading
- **Efficient Updates**: Only updates changed DOM elements
- **Request Deduplication**: Prevents concurrent polling requests
- **Resource Management**: Proper cleanup of intervals and timeouts
- **Caching Strategy**: Static assets cached, dynamic content fresh

### Polling Performance
- **Request Frequency**: 10-second intervals balance freshness with server load
- **Timeout Management**: 8-second timeouts prevent hanging requests
- **Error Throttling**: Automatic backoff reduces server load during issues
- **Page Visibility**: Optional pause polling when page is hidden

### Browser Support
- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Fetch API Support**: Required for HTTP polling (widely supported)
- **AbortController**: Used for request cancellation (modern browsers)

## Configuration

### Polling Settings
Modify polling behavior by updating these values in `app.js`:

```javascript
class StatusDashboard {
    constructor() {
        this.pollingIntervalMs = 10000;      // 10 seconds
        this.maxConsecutiveErrors = 5;       // Error threshold
        this.retryDelayMs = 5000;           // Retry delay
        // ... other settings
    }
}
```

### Customization Options

#### Adding New Services
Services are automatically detected from the Relay Service response. To customize display:

1. **Service Names**: Update `getServiceDisplayName()` in `app.js`
2. **Service Icons**: Update `getServiceIcon()` in `app.js`
3. **Status Colors**: Modify CSS classes in `styles.css`

#### Styling Modifications
- **Colors**: Update CSS custom properties for theme colors
- **Layout**: Modify grid layouts in `.services-grid` and `.summary-stats`
- **Animations**: Adjust keyframe animations and transitions

#### Polling Behavior
- **Interval**: Modify `pollingIntervalMs` for different update frequency
- **Timeout**: Adjust request timeout for slower networks
- **Error Handling**: Customize error thresholds and retry logic

## Security

### Built-in Security
- **Same-Origin Policy**: HTTP requests restricted to same origin
- **Content Security**: No inline scripts or styles
- **Input Sanitization**: All dynamic content properly escaped
- **HTTPS Ready**: Supports secure HTTP connections
- **Request Validation**: Proper error handling for malformed responses

### Security Best Practices
- **API Endpoint Security**: Ensure `/relay` endpoint is properly secured
- **CORS Configuration**: Configure appropriate CORS headers if needed
- **Rate Limiting**: Consider rate limiting on the relay service
- **Error Information**: Avoid exposing sensitive information in error messages

## Monitoring

### Health Checks
The status page itself can be monitored by:
- **HTTP Status**: `GET /status/` returns 200 if accessible
- **Polling Health**: Connection status visible in dashboard
- **Error Logging**: JavaScript errors logged to browser console
- **Performance**: Monitor request timing and success rates

### Metrics
- **Polling Frequency**: Actual vs configured polling intervals
- **Error Rates**: Failed request tracking and patterns
- **Response Times**: API response time monitoring
- **Update Success**: Successful data refresh tracking

### Logging
The application provides comprehensive logging:
```javascript
// Enable debug logging
localStorage.setItem('debug', 'true');
location.reload();
```

## Troubleshooting

### Common Issues

1. **Polling Stopped**
   - Check browser console for error messages
   - Verify Relay Service is running and accessible
   - Check network connectivity and firewall settings
   - Ensure `/relay` endpoint returns valid JSON

2. **No Data Displayed**
   - Verify Relay Service API is accessible at `/relay`
   - Check browser network tab for HTTP errors
   - Ensure services are configured in Relay Service
   - Validate JSON response format

3. **Slow Updates**
   - Check polling interval configuration
   - Monitor network request timing
   - Verify server response times
   - Consider reducing polling frequency for slow networks

4. **High Error Rates**
   - Monitor server logs for issues
   - Check network stability
   - Verify API endpoint availability
   - Review error threshold settings

### Debug Mode
Enable detailed logging by adding to browser console:
```javascript
// Enable debug mode
localStorage.setItem('gamehub-status-debug', 'true');
location.reload();

// Disable debug mode
localStorage.removeItem('gamehub-status-debug');
location.reload();
```

### Performance Debugging
```javascript
// Monitor polling performance
const monitorPolling = () => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const start = performance.now();
        try {
            const response = await originalFetch(...args);
            const end = performance.now();
            console.log(`Request to ${args[0]} took ${end - start}ms`);
            return response;
        } catch (error) {
            const end = performance.now();
            console.error(`Request to ${args[0]} failed after ${end - start}ms:`, error);
            throw error;
        }
    };
};
```

## Future Enhancements

### Planned Features
- **Historical Data**: Service status history and trends
- **Alerting**: Browser notifications for service failures
- **Metrics Dashboard**: Performance metrics and charts
- **Service Dependencies**: Visual dependency mapping
- **Configurable Polling**: User-adjustable polling intervals

### Integration Opportunities
- **Setup Page**: Link to guided setup for unconfigured services
- **Admin Portal**: Deep links to service configuration
- **Monitoring Tools**: Export metrics to external monitoring systems
- **Mobile App**: Native mobile application for status monitoring

### Performance Improvements
- **Smart Polling**: Adaptive polling based on service stability
- **Differential Updates**: Only update changed services
- **Compression**: Request/response compression support
- **Caching**: Intelligent caching strategies for better performance

## Contributing

### Code Style
- **ES6+**: Modern JavaScript features
- **Semantic HTML**: Proper HTML5 structure
- **BEM CSS**: Block-Element-Modifier methodology
- **Accessibility**: WCAG 2.1 compliance

### Testing
- **Manual Testing**: Cross-browser compatibility
- **Responsive Testing**: Multiple device sizes
- **Accessibility Testing**: Screen reader compatibility
- **Performance Testing**: Load time and polling efficiency
- **Error Testing**: Network failure scenarios

### Development Guidelines
- **Polling Logic**: Maintain robust error handling
- **Performance**: Monitor resource usage and cleanup
- **Accessibility**: Ensure keyboard navigation works
- **Documentation**: Update docs for any configuration changes

This status page provides a solid foundation for reliable GameHub service monitoring with HTTP polling, offering excellent performance, error handling, and user experience while maintaining simplicity and reliability.