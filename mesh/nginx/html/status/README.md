# GameHub Status Page

A real-time dashboard for monitoring GameHub services, implemented as a static HTML/CSS/JavaScript application served directly by NGINX.

## Overview

The Status Page provides real-time visibility into the health, configuration, and readiness status of all GameHub services through an intuitive web dashboard.

## Features

### Real-time Monitoring
- **WebSocket Integration**: Live updates from the Relay Service at `ws://localhost/relay/ws`
- **Automatic Reconnection**: Intelligent reconnection with exponential backoff
- **Connection Status**: Visual indicator of WebSocket connection health
- **Auto-refresh Toggle**: Enable/disable automatic status updates

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
├── app.js             # JavaScript application logic
├── favicon.ico        # Site favicon
└── README.md          # This documentation
```

### Technology Stack
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with Flexbox/Grid, animations, and responsive design
- **Vanilla JavaScript**: No external dependencies for maximum performance
- **WebSocket API**: Real-time communication with Relay Service
- **Fetch API**: HTTP fallback for status requests

### Integration Points
- **Relay Service**: Primary data source via WebSocket and HTTP API
- **NGINX**: Static file serving at `/status/` route
- **Docker**: Containerized deployment within GameHub mesh

## API Integration

### WebSocket Connection
```javascript
// Connects to the Relay Service WebSocket endpoint
const wsUrl = `${protocol}//${window.location.host}/relay/ws`;
const ws = new WebSocket(wsUrl);
```

### HTTP Fallback
```javascript
// Fallback HTTP request for status data
const response = await fetch('/relay');
const data = await response.json();
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
# Status Page (real-time dashboard)
location /status/ {
    alias /usr/share/nginx/html/status/;
    try_files $uri $uri/ /status/index.html;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1h;
        add_header Cache-Control "public";
    }
}
```

### Access Points
- **Dashboard**: `http://localhost/status`
- **Direct Files**: `http://localhost/status/index.html`
- **API Endpoint**: `http://localhost/relay` (for data)
- **WebSocket**: `ws://localhost/relay/ws` (for real-time updates)

## Development

### Local Development
1. Ensure the Relay Service is running and accessible
2. Serve the files through NGINX or any static file server
3. Open `http://localhost/status` in your browser

### Testing WebSocket Connection
```javascript
// Test WebSocket connection in browser console
const ws = new WebSocket('ws://localhost/relay/ws');
ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Data:', JSON.parse(event.data));
```

### Debugging
- **Browser DevTools**: Network tab shows WebSocket and HTTP requests
- **Console Logs**: Application logs connection status and errors
- **Connection Status**: Visual indicator in the dashboard header

## Customization

### Adding New Services
Services are automatically detected from the Relay Service response. To customize display:

1. **Service Names**: Update `getServiceDisplayName()` in `app.js`
2. **Service Icons**: Update `getServiceIcon()` in `app.js`
3. **Status Colors**: Modify CSS classes in `styles.css`

### Styling Modifications
- **Colors**: Update CSS custom properties for theme colors
- **Layout**: Modify grid layouts in `.services-grid` and `.summary-stats`
- **Animations**: Adjust keyframe animations and transitions

### Functionality Extensions
- **Alerts**: Add notification system for service failures
- **History**: Implement status history tracking
- **Filtering**: Add service filtering and search capabilities

## Performance

### Optimization Features
- **Minimal Dependencies**: No external libraries for fast loading
- **Efficient Updates**: Only updates changed elements
- **Connection Management**: Automatic reconnection with backoff
- **Caching**: Static assets cached for 1 hour

### Browser Support
- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **WebSocket Support**: Required for real-time updates
- **Fallback**: HTTP polling for older browsers (manual implementation needed)

## Security

### Built-in Security
- **Same-Origin Policy**: WebSocket connections restricted to same origin
- **Content Security**: No inline scripts or styles
- **Input Sanitization**: All dynamic content properly escaped
- **HTTPS Ready**: Supports secure WebSocket connections (WSS)

## Monitoring

### Health Checks
The status page itself can be monitored by:
- **HTTP Status**: `GET /status/` returns 200 if accessible
- **WebSocket Health**: Connection status visible in dashboard
- **Error Logging**: JavaScript errors logged to browser console

### Metrics
- **Connection Uptime**: WebSocket connection duration
- **Reconnection Attempts**: Failed connection tracking
- **Response Times**: Service response time display
- **Update Frequency**: Real-time update intervals

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check Relay Service is running
   - Verify NGINX WebSocket proxy configuration
   - Check browser WebSocket support

2. **No Data Displayed**
   - Verify Relay Service API is accessible at `/relay`
   - Check browser network tab for HTTP errors
   - Ensure services are configured in Relay Service

3. **Styling Issues**
   - Clear browser cache
   - Check CSS file is loading correctly
   - Verify responsive design on different screen sizes

4. **Performance Issues**
   - Monitor WebSocket message frequency
   - Check for JavaScript errors in console
   - Verify network connectivity

### Debug Mode
Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'true');
location.reload();
```

## Future Enhancements

### Planned Features
- **Historical Data**: Service status history and trends
- **Alerting**: Email/SMS notifications for service failures
- **Metrics Dashboard**: Performance metrics and charts
- **Service Dependencies**: Visual dependency mapping

### Integration Opportunities
- **Setup Page**: Link to guided setup for unconfigured services
- **Admin Portal**: Deep links to service configuration
- **Monitoring Tools**: Export metrics to external monitoring systems
- **Mobile App**: Native mobile application for status monitoring

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
- **Performance Testing**: Load time optimization

This status page provides a solid foundation for real-time GameHub service monitoring with room for future enhancements and customization.