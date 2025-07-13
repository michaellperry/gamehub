import React from 'react';
import Icon, { IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: IconName;
    iconPosition?: 'left' | 'right';
    isLoading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    isLoading = false,
    fullWidth = false,
    children,
    className = '',
    disabled,
    ...props
}) => {
    // Base classes
    const baseClasses =
        'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';

    // Size classes
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
    };

    // Variant classes
    const variantClasses = {
        primary:
            'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 border border-transparent shadow-sm',
        secondary:
            'bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 border border-gray-300 shadow-sm',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent shadow-sm',
        text: 'bg-transparent text-primary-600 hover:text-primary-700 hover:bg-gray-50 focus:ring-primary-500',
    };

    // Disabled classes
    const disabledClasses = 'opacity-50 cursor-not-allowed';

    // Full width class
    const fullWidthClass = fullWidth ? 'w-full' : '';

    // Combine all classes
    const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${disabled || isLoading ? disabledClasses : ''}
    ${fullWidthClass}
    ${className}
  `;

    // Icon size based on button size
    const iconSize = {
        sm: 16,
        md: 18,
        lg: 20,
    };

    return (
        <button className={buttonClasses} disabled={disabled || isLoading} {...props}>
            {isLoading && (
                <Icon
                    name="loading"
                    size={iconSize[size]}
                    className={`${children ? 'mr-2' : ''} animate-spin`}
                />
            )}

            {!isLoading && icon && iconPosition === 'left' && (
                <Icon name={icon} size={iconSize[size]} className={children ? 'mr-2' : ''} />
            )}

            {children}

            {!isLoading && icon && iconPosition === 'right' && (
                <Icon name={icon} size={iconSize[size]} className={children ? 'ml-2' : ''} />
            )}
        </button>
    );
};

export default Button;
