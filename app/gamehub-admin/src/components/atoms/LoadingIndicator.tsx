import Icon from './Icon';

export interface LoadingIndicatorProps {
  size?: number;
  className?: string;
}

function LoadingIndicator({ size = 32, className = "" }: LoadingIndicatorProps) {
  return (
    <div className="flex justify-center items-center py-12">
      <Icon 
        name="loading" 
        size={size} 
        className={`text-gray-500 animate-spin ${className}`} 
      />
    </div>
  );
}

export default LoadingIndicator;
