# CodeLaunch Design System

This directory contains the components and styles that make up the CodeLaunch design system. The design system is organized using the Atomic Design methodology, which helps create consistent, reusable, and maintainable UI components.

## Structure

The design system is organized into the following directories:

- **atoms/**: Basic building blocks of the UI, such as buttons, icons, and form inputs.
- **molecules/**: Combinations of atoms that form more complex UI components, such as modals and forms.
- **organisms/**: Complex UI components composed of molecules and atoms that form a distinct section of the interface.
- **styles/**: Global styles and Tailwind CSS customizations.

## Usage

### Importing Components

Components can be imported from their respective directories:

```jsx
// Import atomic components
import { Button, Card, Icon, Alert } from './components/atoms';

// Import molecular components
import { Modal, ConfirmModal } from './components/molecules';
```

### Style Guide

A comprehensive style guide is available at `/style-guide` in the application. This page showcases all available components, their variants, and usage examples.

## Component Categories

### Atoms

- **Button**: Primary action component with various variants, sizes, and states.
- **Icon**: SVG icon component with a standardized API for consistent icon usage.
- **Card**: Container component for grouping related content.
- **Alert**: Notification component for displaying messages to users.

### Molecules

- **Modal**: Dialog component for displaying content that requires user attention.
- **ConfirmModal**: Specialized modal for confirmation actions.

## Design Principles

1. **Consistency**: Use the same components and styles throughout the application.
2. **Reusability**: Components should be designed to be reused in different contexts.
3. **Accessibility**: Components should be accessible to all users, including those with disabilities.
4. **Responsiveness**: Components should work well on all screen sizes.

## Tailwind CSS

The design system is built on top of Tailwind CSS. Custom theme extensions are defined in `tailwind.config.js`, and component-specific styles are defined in `src/styles/base.css`.

### Custom Tailwind Classes

Custom component classes are defined using the `@layer components` directive in `src/styles/base.css`. These classes provide consistent styling for common UI patterns.

Example:

```css
@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500;
  }
}
```

## Adding New Components

When adding new components to the design system:

1. Place the component in the appropriate directory based on its complexity (atom, molecule, organism).
2. Export the component from the directory's `index.ts` file.
3. Add the component to the style guide page.
4. Document the component's props and usage.

## Icons

Icons are managed through the `Icon` component, which provides a consistent API for all icons in the application. To add a new icon:

1. Add the SVG path to the `Icon.tsx` file.
2. Add the icon name to the `IconName` type.
3. Add the icon to the style guide.

## Color System

The color system is defined in `tailwind.config.js`. The primary colors are:

- **Primary**: Used for primary actions and branding.
- **Secondary**: Used for secondary actions and UI elements.
- **Gray**: Used for text, backgrounds, and borders.
- **Semantic Colors**: Red (error), Yellow (warning), Green (success), Blue (info).

## Typography

Typography is standardized using Tailwind's typography classes. The main text styles are:

- **Heading 1**: `text-3xl font-bold text-gray-900`
- **Heading 2**: `text-2xl font-semibold text-gray-900`
- **Heading 3**: `text-lg font-medium text-gray-900`
- **Body Text**: `text-base text-gray-700`
- **Small Text**: `text-sm text-gray-500`

## Contributing

When contributing to the design system:

1. Follow the existing patterns and conventions.
2. Update the style guide with any new components or changes.
3. Ensure components are accessible and responsive.
4. Document props and usage.
