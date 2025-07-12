import React from 'react';
import Icon, { IconName } from './Icon';

export type AlertVariant = 'error' | 'warning' | 'info' | 'success';

export interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  message,
  action,
  className = '',
  onClose,
}) => {
  // Variant-specific configurations
  const variantConfig: Record<AlertVariant, { 
    bgColor: string; 
    textColor: string; 
    titleColor: string;
    icon: IconName;
    iconColor: string;
  }> = {
    error: {
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-300',
      titleColor: 'text-red-800 dark:text-red-200',
      icon: 'error',
      iconColor: 'text-red-400 dark:text-red-400',
    },
    warning: {
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      titleColor: 'text-yellow-800 dark:text-yellow-200',
      icon: 'warning',
      iconColor: 'text-yellow-400 dark:text-yellow-400',
    },
    info: {
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300',
      titleColor: 'text-blue-800 dark:text-blue-200',
      icon: 'info',
      iconColor: 'text-blue-400 dark:text-blue-400',
    },
    success: {
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300',
      titleColor: 'text-green-800 dark:text-green-200',
      icon: 'success',
      iconColor: 'text-green-400 dark:text-green-400',
    },
  };

  const config = variantConfig[variant];

  return (
    <div className={`rounded-md p-4 mb-4 ${config.bgColor} dark:border dark:border-opacity-20 dark:border-current ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon name={config.icon} className={config.iconColor} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${config.titleColor}`}>
              {title}
            </h3>
          )}
          <div className={`${title ? 'mt-2' : ''} text-sm ${config.textColor}`}>
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
          {action && (
            <div className="mt-4">
              {action}
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                className={`inline-flex rounded-md p-1.5 ${config.bgColor} ${config.textColor} hover:bg-opacity-80 dark:hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-offset-${config.bgColor} focus:ring-${config.textColor}`}
                onClick={onClose}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
