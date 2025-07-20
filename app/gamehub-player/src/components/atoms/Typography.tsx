import React from 'react';

export interface TypographyProps {
    children: React.ReactNode;
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-sm' | 'caption';
    className?: string;
}

export const Typography: React.FC<TypographyProps> = ({
    children,
    variant = 'body',
    className = '',
}) => {
    const variantClasses = {
        h1: 'text-4xl font-bold text-gray-900',
        h2: 'text-3xl font-bold text-gray-900',
        h3: 'text-2xl font-semibold text-gray-900',
        h4: 'text-xl font-medium text-gray-900',
        body: 'text-base text-gray-700',
        'body-sm': 'text-sm text-gray-600',
        caption: 'text-xs text-gray-500',
    };

    const classes = [
        variantClasses[variant],
        className,
    ].filter(Boolean).join(' ');

    const Component = variant.startsWith('h') ? variant as keyof JSX.IntrinsicElements : 'p';

    return (
        <Component className={classes}>
            {children}
        </Component>
    );
};

// Convenience components for common use cases
export const Heading1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="h1" {...props} />
);

export const Heading2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="h2" {...props} />
);

export const Heading3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="h3" {...props} />
);

export const Body: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="body" {...props} />
);

export const BodySmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="body-sm" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="caption" {...props} />
); 