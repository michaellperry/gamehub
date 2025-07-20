# Date Utilities

This module provides comprehensive date formatting utilities for consistent date/time display across the GameHub player application.

## Overview

The date utilities provide multiple formatting options for different use cases, from simple time displays to complex relative time formatting. All functions are designed to be locale-aware and provide consistent, user-friendly output.

## Functions

### `formatDate(date, formatType, locale?)`

Formats a date using the specified format type.

**Parameters:**
- `date`: Date object, string, or number
- `formatType`: One of the predefined format types
- `locale`: Optional locale string (defaults to user's locale)

**Format Types:**
- `'friendly'`: "Jan 15, 2:30 PM" (default)
- `'short'`: "Jan 15, 2:30 PM"
- `'medium'`: "January 15, 2024 at 2:30 PM"
- `'long'`: "Monday, January 15, 2024 at 2:30 PM"
- `'time-only'`: "2:30 PM"
- `'date-only'`: "January 15, 2024"
- `'relative'`: "2 hours ago", "yesterday"
- `'game-time'`: "MM:SS" format for game timers

**Example:**
```typescript
import { formatDate } from '../utils/dateUtils';

const date = new Date();
formatDate(date, 'friendly'); // "Jan 15, 2:30 PM"
formatDate(date, 'relative'); // "2 hours ago"
formatDate(date, 'time-only'); // "2:30 PM"
```

### `getFriendlyDate(date)`

Automatically chooses the best format for a date, showing "Today", "Yesterday", or relative time.

**Parameters:**
- `date`: Date object, string, or number

**Example:**
```typescript
import { getFriendlyDate } from '../utils/dateUtils';

const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

getFriendlyDate(now); // "Today at 2:30 PM"
getFriendlyDate(yesterday); // "Yesterday at 2:30 PM"
getFriendlyDate(oneWeekAgo); // "Mon, Jan 8, 2:30 PM"
```

### `formatDuration(seconds, format)`

Formats a duration in seconds to a human-readable format.

**Parameters:**
- `seconds`: Duration in seconds
- `format`: 'short' (2:30), 'medium' (2m 30s), 'long' (2 minutes 30 seconds)

**Example:**
```typescript
import { formatDuration } from '../utils/dateUtils';

formatDuration(150, 'short'); // "2:30"
formatDuration(150, 'medium'); // "2m 30s"
formatDuration(150, 'long'); // "2 minutes 30 seconds"
```

### `isToday(date)` and `isYesterday(date)`

Utility functions to check if a date is today or yesterday.

**Example:**
```typescript
import { isToday, isYesterday } from '../utils/dateUtils';

const today = new Date();
const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

isToday(today); // true
isYesterday(yesterday); // true
```

## Usage Examples

### In Components

```typescript
import { getFriendlyDate, formatDuration } from '../utils/dateUtils';

// Display when a player joined
<Typography variant="body-sm" className="text-gray-500">
    Joined {getFriendlyDate(player.joinedAt)}
</Typography>

// Display game time
<Typography variant="body-sm" className="text-gray-900">
    {formatDuration(gameTime, 'short')}
</Typography>
```

### Game Time Formatting

For game timers and countdowns:

```typescript
import { formatDate } from '../utils/dateUtils';

// Format game time as MM:SS
const gameTime = formatDate(new Date(gameTimeInSeconds * 1000), 'game-time');
```

### Relative Time Display

For showing how long ago something happened:

```typescript
import { formatDate } from '../utils/dateUtils';

// Show when a message was sent
const messageTime = formatDate(message.timestamp, 'relative');
// "2 hours ago", "yesterday", "3 days ago"
```

## Best Practices

1. **Use `getFriendlyDate()` for most user-facing date displays** - it automatically chooses the most appropriate format
2. **Use `formatDuration()` for game timers and countdowns** - provides consistent MM:SS formatting
3. **Use `formatDate()` with specific format types** when you need precise control over the display format
4. **Consider locale** - the utilities respect the user's locale settings automatically

## Migration Guide

If you have existing date formatting code, here's how to migrate:

**Before:**
```typescript
const formattedDate = date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
});
```

**After:**
```typescript
import { getFriendlyDate } from '../utils/dateUtils';

const formattedDate = getFriendlyDate(date);
```

**Before:**
```typescript
const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
```

**After:**
```typescript
import { formatDuration } from '../utils/dateUtils';

const gameTime = formatDuration(seconds, 'short');
```

## Testing

The date utilities are designed to be easily testable. You can test different scenarios by providing various dates:

```typescript
// Test relative time formatting
const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

expect(formatDate(oneHourAgo, 'relative')).toBe('1 hour ago');
expect(formatDate(oneDayAgo, 'relative')).toBe('yesterday');
``` 