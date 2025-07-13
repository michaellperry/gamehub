export interface AvatarProps {
    content: string | number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

function Avatar({ content, size = 'md', className = '' }: AvatarProps) {
    const sizeClasses = {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
    };

    return (
        <div
            className={`flex-shrink-0 rounded-full bg-gray-200 flex items-center justify-center ${sizeClasses[size]} ${className}`}
        >
            <span className="text-gray-500 font-medium">{content}</span>
        </div>
    );
}

export default Avatar;
