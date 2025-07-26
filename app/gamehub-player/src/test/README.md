# Testing Framework

This project uses Vitest as the primary testing framework with React Testing Library for component testing.

## Setup

The testing framework is configured with:

- **Vitest**: Fast unit testing framework that works seamlessly with Vite
- **React Testing Library**: For testing React components
- **Jest DOM**: Additional DOM matchers for better assertions
- **jsdom**: DOM environment for testing browser APIs

## Test Scripts

```bash
# Run tests in watch mode (development)
npm run test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Test File Structure

```
src/
├── test/
│   ├── setup.ts                    # Global test setup
│   ├── components/                 # Component tests
│   │   └── Button.test.tsx
│   ├── services/                   # Service tests
│   │   └── background-service/
│   │       └── BackgroundServiceManager.test.ts
│   └── utils/                      # Utility function tests
└── ...
```

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/Button';

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Service Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyService } from '../services/MyService';

// Mock dependencies
vi.mock('jinaga');
vi.mock('../services/SomeOtherService');

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MyService();
  });

  it('should perform expected behavior', async () => {
    const result = await service.doSomething();
    expect(result).toBeDefined();
  });
});
```

### Hook Tests

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../hooks/useMyHook';

describe('useMyHook', () => {
  it('should return expected state', () => {
    const { result } = renderHook(() => useMyHook());
    
    expect(result.current.value).toBeDefined();
  });

  it('should update state when action is called', () => {
    const { result } = renderHook(() => useMyHook());
    
    act(() => {
      result.current.updateValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });
});
```

## Testing Best Practices

### 1. Test Structure
- Use descriptive test names that explain the behavior
- Group related tests using `describe` blocks
- Follow the AAA pattern: Arrange, Act, Assert

### 2. Component Testing
- Test user interactions, not implementation details
- Use semantic queries (getByRole, getByLabelText) over test IDs
- Test accessibility concerns
- Mock external dependencies

### 3. Service Testing
- Mock external dependencies and APIs
- Test error scenarios
- Verify side effects
- Test async behavior

### 4. Mocking
```typescript
// Mock modules
vi.mock('jinaga');

// Mock functions
const mockFunction = vi.fn();

// Mock implementations
vi.fn().mockImplementation(() => 'mocked value');

// Spy on console methods
const consoleSpy = vi.spyOn(console, 'log');
```

### 5. Async Testing
```typescript
it('should handle async operations', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

## Coverage

Run coverage to see test coverage:

```bash
npm run test:coverage
```

This will generate a coverage report showing:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

## Debugging Tests

### Using the UI
```bash
npm run test:ui
```

This opens a web interface where you can:
- See test results in real-time
- Debug failing tests
- Filter tests by name or status

### Console Debugging
```typescript
it('should debug this test', () => {
  console.log('Debug information');
  debug(); // Pause execution
  expect(true).toBe(true);
});
```

## Configuration

The testing configuration is in `vitest.config.ts` and includes:

- jsdom environment for DOM testing
- React plugin for JSX support
- Coverage reporting
- Path aliases for clean imports
- Global test setup

## Common Patterns

### Testing with Providers
```typescript
import { render } from '@testing-library/react';
import { ThemeProvider } from '../theme/ThemeProvider';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
};
```

### Testing with Router
```typescript
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};
```

### Testing with Jinaga

Please see [Jinaga Testing Strategy](./JINAGA_TESTING_STRATEGY.md).