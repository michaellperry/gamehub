/**
 * Date formatting utilities for consistent date/time display across the player application
 */

/**
 * Format options for different date display contexts
 */
export type DateFormatType =
    | 'friendly'           // "2 hours ago", "yesterday", "3 days ago"
    | 'short'             // "Jan 15, 2:30 PM"
    | 'medium'            // "January 15, 2024 at 2:30 PM"
    | 'long'              // "Monday, January 15, 2024 at 2:30 PM"
    | 'time-only'         // "2:30 PM"
    | 'date-only'         // "January 15, 2024"
    | 'relative'          // "2 hours ago", "in 3 days"
    | 'game-time';        // "MM:SS" format for game timers

/**
 * Configuration for different date format types
 */
const formatConfigs = {
    friendly: {
        weekday: 'short' as const,
        month: 'short' as const,
        day: 'numeric' as const,
        hour: 'numeric' as const,
        minute: '2-digit' as const,
        hour12: true
    },
    short: {
        month: 'short' as const,
        day: 'numeric' as const,
        hour: 'numeric' as const,
        minute: '2-digit' as const,
        hour12: true
    },
    medium: {
        year: 'numeric' as const,
        month: 'long' as const,
        day: 'numeric' as const,
        hour: 'numeric' as const,
        minute: '2-digit' as const,
        hour12: true
    },
    long: {
        weekday: 'long' as const,
        year: 'numeric' as const,
        month: 'long' as const,
        day: 'numeric' as const,
        hour: 'numeric' as const,
        minute: '2-digit' as const,
        hour12: true
    },
    'time-only': {
        hour: 'numeric' as const,
        minute: '2-digit' as const,
        hour12: true
    },
    'date-only': {
        year: 'numeric' as const,
        month: 'long' as const,
        day: 'numeric' as const
    }
};

/**
 * Formats a date using the specified format type
 * @param date The date to format
 * @param formatType The type of format to apply
 * @param locale The locale to use (defaults to user's locale)
 * @returns Formatted date string
 */
export function formatDate(
    date: Date | string | number,
    formatType: DateFormatType = 'friendly',
    locale?: string
): string {
    const dateObj = typeof date === 'string' || typeof date === 'number'
        ? new Date(date)
        : date;

    if (formatType === 'game-time') {
        return formatGameTime(dateObj);
    }

    if (formatType === 'relative') {
        return formatRelativeTime(dateObj);
    }

    const config = formatConfigs[formatType as keyof typeof formatConfigs];
    if (!config) {
        throw new Error(`Unknown format type: ${formatType}`);
    }

    return dateObj.toLocaleString(locale || undefined, config);
}

/**
 * Formats a date as a relative time (e.g., "2 hours ago", "yesterday")
 * @param date The date to format
 * @returns Relative time string
 */
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
        return 'just now';
    }

    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    }

    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }

    if (diffInDays === 1) {
        return 'yesterday';
    }

    if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    }

    if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    }

    if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return `${months} month${months === 1 ? '' : 's'} ago`;
    }

    const years = Math.floor(diffInDays / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
}

/**
 * Formats time in MM:SS format for game timers
 * @param date The date/time to format
 * @returns Time string in MM:SS format
 */
function formatGameTime(date: Date): string {
    const totalSeconds = Math.floor(date.getTime() / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formats a duration in seconds to a human-readable format
 * @param seconds Duration in seconds
 * @param format Format type: 'short' (2:30), 'medium' (2m 30s), 'long' (2 minutes 30 seconds)
 * @returns Formatted duration string
 */
export function formatDuration(
    seconds: number,
    format: 'short' | 'medium' | 'long' = 'short'
): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (format === 'short') {
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    if (format === 'medium') {
        const parts: string[] = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
        return parts.join(' ');
    }

    // Long format
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`);
    return parts.join(' ');
}

/**
 * Checks if a date is today
 * @param date The date to check
 * @returns True if the date is today
 */
export function isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

/**
 * Checks if a date is yesterday
 * @param date The date to check
 * @returns True if the date is yesterday
 */
export function isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
}

/**
 * Gets a user-friendly date string that automatically chooses the best format
 * @param date The date to format
 * @returns User-friendly date string
 */
export function getFriendlyDate(date: Date | string | number): string {
    const dateObj = typeof date === 'string' || typeof date === 'number'
        ? new Date(date)
        : date;

    if (isToday(dateObj)) {
        return `Today at ${formatDate(dateObj, 'time-only')}`;
    }

    if (isYesterday(dateObj)) {
        return `Yesterday at ${formatDate(dateObj, 'time-only')}`;
    }

    return formatDate(dateObj, 'friendly');
} 