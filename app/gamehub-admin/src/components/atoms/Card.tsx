import React from 'react';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export interface CardHeaderProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export interface CardBodyProps {
    children: React.ReactNode;
    className?: string;
}

export interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

// Define the compound component type
type CardComponent = React.FC<CardProps> & {
    Header: React.FC<CardHeaderProps>;
    Body: React.FC<CardBodyProps>;
    Footer: React.FC<CardFooterProps>;
};

// Main Card component
const Card: CardComponent = ({ children, className = '' }) => {
    return <div className={`card ${className}`}>{children}</div>;
};

// Card Header component
const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action, className = '' }) => {
    return (
        <div className={`card-header ${className}`}>
            <div className="flex justify-between items-center">
                <div>
                    {title &&
                        (typeof title === 'string' ? (
                            <h3 className="leading-6 heading-3">{title}</h3>
                        ) : (
                            title
                        ))}
                    {subtitle &&
                        (typeof subtitle === 'string' ? (
                            <p className="mt-1 max-w-2xl text-muted">{subtitle}</p>
                        ) : (
                            subtitle
                        ))}
                </div>
                {action && <div className="ml-4">{action}</div>}
            </div>
        </div>
    );
};

// Card Body component
const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
    return <div className={`px-4 py-5 sm:p-6 text-body ${className}`}>{children}</div>;
};

// Card Footer component
const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
    return (
        <div className={`px-4 py-4 sm:px-6 border-t border-gray-200 ${className}`}>{children}</div>
    );
};

// Attach sub-components to Card
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
