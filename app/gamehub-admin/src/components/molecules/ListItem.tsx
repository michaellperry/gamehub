import React from 'react';

export interface ListItemProps {
    children: React.ReactNode;
    action?: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

function ListItem({ children, action, onClick, className = '' }: ListItemProps) {
    return (
        <li
            className={`px-6 py-4 flex items-center justify-between ${onClick ? 'hover:bg-gray-50 cursor-pointer' : ''} ${className}`}
            onClick={onClick}
        >
            <div>{children}</div>
            {action}
        </li>
    );
}

export default ListItem;
