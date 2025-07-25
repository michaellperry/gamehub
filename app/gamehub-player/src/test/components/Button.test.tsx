import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/atoms/Button';

describe('Button', () => {
    it('should render with default props', () => {
        render(<Button>Click me</Button>);

        const button = screen.getByRole('button', { name: /click me/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('bg-primary-600', 'text-white');
    });

    it('should render with custom variant', () => {
        render(<Button variant="secondary">Secondary Button</Button>);

        const button = screen.getByRole('button', { name: /secondary button/i });
        expect(button).toHaveClass('bg-gray-200');
    });

    it('should render with custom size', () => {
        render(<Button size="lg">Large Button</Button>);

        const button = screen.getByRole('button', { name: /large button/i });
        expect(button).toHaveClass('px-6', 'py-3', 'text-base');
    });

    it('should handle click events', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);

        const button = screen.getByRole('button', { name: /click me/i });
        fireEvent.click(button);

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
        render(<Button disabled>Disabled Button</Button>);

        const button = screen.getByRole('button', { name: /disabled button/i });
        expect(button).toBeDisabled();
        expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('should render with custom className', () => {
        render(<Button className="custom-class">Custom Button</Button>);

        const button = screen.getByRole('button', { name: /custom button/i });
        expect(button).toHaveClass('custom-class');
    });

    it('should render loading state', () => {
        render(<Button loading>Loading Button</Button>);

        const button = screen.getByRole('button', { name: /loading button/i });
        expect(button).toBeDisabled();

        // Check for loading spinner
        const loadingSpinner = button.querySelector('svg.animate-spin');
        expect(loadingSpinner).toBeInTheDocument();
    });

    it('should not call onClick when disabled', () => {
        const handleClick = vi.fn();
        render(<Button disabled onClick={handleClick}>Disabled Button</Button>);

        const button = screen.getByRole('button', { name: /disabled button/i });
        fireEvent.click(button);

        expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', () => {
        const handleClick = vi.fn();
        render(<Button loading onClick={handleClick}>Loading Button</Button>);

        const button = screen.getByRole('button', { name: /loading button/i });
        fireEvent.click(button);

        expect(handleClick).not.toHaveBeenCalled();
    });

    it('should render with icon on left', () => {
        const icon = <span data-testid="icon">🚀</span>;
        render(<Button icon={icon} iconPosition="left">Button with Icon</Button>);

        const iconElement = screen.getByTestId('icon');

        expect(iconElement).toBeInTheDocument();
        expect(iconElement.parentElement).toHaveClass('mr-2');
    });

    it('should render with icon on right', () => {
        const icon = <span data-testid="icon">🚀</span>;
        render(<Button icon={icon} iconPosition="right">Button with Icon</Button>);

        const iconElement = screen.getByTestId('icon');

        expect(iconElement).toBeInTheDocument();
        expect(iconElement.parentElement).toHaveClass('ml-2');
    });

    it('should render full width when fullWidth is true', () => {
        render(<Button fullWidth>Full Width Button</Button>);

        const button = screen.getByRole('button', { name: /full width button/i });
        expect(button).toHaveClass('w-full');
    });
}); 