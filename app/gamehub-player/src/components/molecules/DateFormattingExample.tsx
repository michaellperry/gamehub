import { DateFormatType, formatDate, formatDuration, getFriendlyDate } from '../../utils/dateUtils';
import { Card, Typography } from '../atoms';

export interface DateFormattingExampleProps {
    className?: string;
}

export function DateFormattingExample({ className = '' }: DateFormattingExampleProps) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const formatTypes: DateFormatType[] = [
        'friendly',
        'short',
        'medium',
        'long',
        'time-only',
        'date-only',
        'relative'
    ];

    const exampleDates = [
        { label: 'Now', date: now },
        { label: '1 hour ago', date: oneHourAgo },
        { label: '1 day ago', date: oneDayAgo },
        { label: '1 week ago', date: oneWeekAgo },
        { label: '1 month ago', date: oneMonthAgo }
    ];

    return (
        <Card variant="game" size="lg" className={className}>
            <div className="space-y-6">
                <div className="text-center">
                    <Typography variant="h2" className="text-xl font-semibold text-gray-900">
                        Date Formatting Examples
                    </Typography>
                    <Typography variant="body-sm" className="text-gray-600">
                        Demonstrating the various date formatting options
                    </Typography>
                </div>

                {/* Format Types */}
                <div className="space-y-4">
                    <Typography variant="h3" className="text-lg font-semibold text-gray-900">
                        Format Types
                    </Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formatTypes.map((formatType) => (
                            <div key={formatType} className="p-3 bg-gray-50 rounded-lg">
                                <Typography variant="body-sm" className="font-medium text-gray-700 mb-1">
                                    {formatType}
                                </Typography>
                                <Typography variant="body-sm" className="text-gray-600">
                                    {formatDate(now, formatType)}
                                </Typography>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Example Dates */}
                <div className="space-y-4">
                    <Typography variant="h3" className="text-lg font-semibold text-gray-900">
                        Example Dates
                    </Typography>
                    <div className="space-y-3">
                        {exampleDates.map(({ label, date }) => (
                            <div key={label} className="p-3 bg-gray-50 rounded-lg">
                                <Typography variant="body-sm" className="font-medium text-gray-700 mb-1">
                                    {label}
                                </Typography>
                                <Typography variant="body-sm" className="text-gray-600">
                                    {getFriendlyDate(date)}
                                </Typography>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Duration Examples */}
                <div className="space-y-4">
                    <Typography variant="h3" className="text-lg font-semibold text-gray-900">
                        Duration Examples
                    </Typography>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <Typography variant="body-sm" className="font-medium text-gray-700 mb-1">
                                Short (2:30)
                            </Typography>
                            <Typography variant="body-sm" className="text-gray-600">
                                {formatDuration(150, 'short')}
                            </Typography>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <Typography variant="body-sm" className="font-medium text-gray-700 mb-1">
                                Medium (2m 30s)
                            </Typography>
                            <Typography variant="body-sm" className="text-gray-600">
                                {formatDuration(150, 'medium')}
                            </Typography>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <Typography variant="body-sm" className="font-medium text-gray-700 mb-1">
                                Long (2 minutes 30 seconds)
                            </Typography>
                            <Typography variant="body-sm" className="text-gray-600">
                                {formatDuration(150, 'long')}
                            </Typography>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
} 