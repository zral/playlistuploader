# Testing Guide

## Overview

The Christmas Spotify Playlist Uploader includes comprehensive automated testing for both backend and frontend components. **All tests run in dedicated Docker containers** to ensure consistent test environments and avoid polluting the local host.

This guide explains how to run tests, write new tests, and understand the testing infrastructure.

## Test Coverage Goals

- **Backend**: 65%+ coverage (branches: 55%+, functions/lines/statements: 60%+)
- **Frontend**: 60%+ coverage (branches, functions, lines, statements)
- **Overall**: 98 tests (75 backend + 53 frontend)

## Quick Start - Running Tests in Docker (Recommended)

### Prerequisites
- Docker Desktop installed and running
- Project cloned to local machine

### Run All Tests

```bash
# From project root
./run-tests.sh
```

This will:
1. Start dedicated test containers for backend and frontend
2. Install all test dependencies
3. Run all tests
4. Display results
5. Clean up containers automatically

### Run Tests with Coverage

```bash
./run-tests.sh --coverage
```

Coverage reports will be generated in:
- `backend/coverage/index.html`
- `frontend/coverage/index.html`

### Run Specific Tests

```bash
# Backend tests only
./run-tests.sh --backend

# Frontend tests only
./run-tests.sh --frontend

# Backend with coverage
./run-tests.sh --backend --coverage

# Frontend in watch mode (interactive)
./run-tests.sh --frontend --watch
```

### Available Options

```
./run-tests.sh [OPTIONS]

Options:
  --coverage       Run tests with coverage report
  --backend        Run only backend tests
  --frontend       Run only frontend tests
  --watch          Run tests in watch mode (interactive)
  --help           Show help message
```

## Docker Test Architecture

### Test Containers

The project uses `docker-compose.test.yml` to define isolated test containers:

- **backend-test**: Runs Jest tests for backend
- **backend-test-coverage**: Runs backend tests with coverage reporting
- **frontend-test**: Runs Vitest tests for frontend
- **frontend-test-coverage**: Runs frontend tests with coverage reporting

### Benefits of Container-Based Testing

✅ **Isolated Environment**: Tests run in clean containers, not on your local machine
✅ **Consistent Results**: Same Node.js version, same dependencies every time
✅ **No Local Installation**: No need to install dependencies on host machine
✅ **Easy Cleanup**: Containers are removed automatically after tests
✅ **CI/CD Ready**: Same containers can be used in CI pipelines

### Manual Docker Commands

If you prefer to run Docker commands directly:

```bash
# Run backend tests
docker-compose -f docker-compose.test.yml run --rm backend-test

# Run backend tests with coverage
docker-compose -f docker-compose.test.yml run --rm backend-test-coverage

# Run frontend tests
docker-compose -f docker-compose.test.yml run --rm frontend-test

# Run frontend tests with coverage
docker-compose -f docker-compose.test.yml run --rm frontend-test-coverage

# Cleanup (remove stopped containers)
docker-compose -f docker-compose.test.yml down
```

## Backend Testing

### Technology Stack

- **Jest 29.7.0** - Testing framework
- **Supertest 6.3.3** - HTTP assertion library
- **@jest/globals** - ES modules support

### Running Backend Tests

**Recommended: Use Docker containers (see Quick Start above)**

For local development without Docker:

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Note**: Running tests locally requires Node.js 20+ installed on your machine. Using Docker containers is preferred for consistent test environments.

### Test Files Location

```
backend/
├── src/
│   ├── services/
│   │   └── __tests__/
│   │       └── spotifyService.test.js  # Unit tests for Spotify API service
│   └── routes/
│       └── __tests__/
│           └── api.test.js              # Integration tests for API endpoints
```

### Backend Test Examples

#### Unit Test Example (Service)

```javascript
import { describe, test, expect, jest } from '@jest/globals';
import * as spotifyService from '../spotifyService.js';

describe('spotifyService', () => {
  test('should search for tracks successfully', async () => {
    const tracks = await spotifyService.searchTrack('valid_token', 'Christmas');
    expect(tracks).toBeInstanceOf(Array);
  });
});
```

#### Integration Test Example (API)

```javascript
import request from 'supertest';
import express from 'express';
import apiRouter from '../api.js';

describe('API Routes', () => {
  test('POST /api/search should return search results', async () => {
    const response = await request(app)
      .post('/api/search')
      .send({ query: 'All I Want for Christmas' })
      .expect(200);

    expect(response.body.results).toBeDefined();
  });
});
```

### Backend Test Coverage

Coverage reports are generated in `backend/coverage/`:

- `coverage/index.html` - Visual coverage report
- `coverage/lcov.info` - LCOV format for CI tools
- `coverage/coverage-final.json` - JSON format

View coverage report:
```bash
cd backend
npm run test:coverage
open coverage/index.html  # macOS
# or
xdg-open coverage/index.html  # Linux
```

## Frontend Testing

### Technology Stack

- **Vitest 1.0.4** - Vite-native testing framework
- **@testing-library/svelte 4.0.5** - Svelte component testing utilities
- **@testing-library/jest-dom 6.1.5** - Custom Jest matchers for DOM
- **jsdom 23.0.1** - DOM implementation for Node.js
- **@vitest/coverage-v8** - Coverage reporting

### Running Frontend Tests

**Recommended: Use Docker containers (see Quick Start above)**

For local development without Docker:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Run all tests
npm test

# Run tests in watch mode (interactive)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Note**: Running tests locally requires Node.js 20+ installed on your machine. Using Docker containers is preferred for consistent test environments.

### Test Files Location

```
frontend/
├── src/
│   ├── components/
│   │   ├── Login.test.js           # Login component tests
│   │   ├── Header.test.js          # Header component tests
│   │   └── Notification.test.js    # Notification component tests
│   ├── lib/
│   │   └── api.test.js             # API client tests
│   └── test/
│       └── setup.js                # Test setup and configuration
```

### Frontend Test Examples

#### Component Test Example

```javascript
import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Login from './Login.svelte';

describe('Login Component', () => {
  test('renders login button', () => {
    render(Login);
    const button = screen.getByRole('button', { name: /login with spotify/i });
    expect(button).toBeInTheDocument();
  });

  test('emits login event when clicked', async () => {
    const { component } = render(Login);
    const loginSpy = vi.fn();
    component.$on('login', loginSpy);

    const button = screen.getByRole('button', { name: /login/i });
    await fireEvent.click(button);

    expect(loginSpy).toHaveBeenCalled();
  });
});
```

#### API Client Test Example

```javascript
import { describe, test, expect, vi } from 'vitest';
import axios from 'axios';
import * as api from './api.js';

vi.mock('axios');

describe('API Client', () => {
  test('should fetch playlists successfully', async () => {
    const mockResponse = {
      data: { playlists: [{ id: '1', name: 'Christmas Songs' }] },
    };
    axios.get.mockResolvedValue(mockResponse);

    const result = await api.playlists.getAll();
    expect(result.playlists).toHaveLength(1);
  });
});
```

### Frontend Test Coverage

Coverage reports are generated in `frontend/coverage/`:

- `coverage/index.html` - Visual coverage report
- `coverage/lcov.info` - LCOV format
- `coverage/coverage-final.json` - JSON format

View coverage report:
```bash
cd frontend
npm run test:coverage
open coverage/index.html  # macOS
```

## Running All Tests

### Using Test Runner Script (Recommended)

```bash
# From project root - runs all tests in dedicated containers
./run-tests.sh

# With coverage reports
./run-tests.sh --coverage

# Backend only
./run-tests.sh --backend --coverage

# Frontend only
./run-tests.sh --frontend --coverage
```

### From Project Root (Local - Not Recommended)

Only use this if you cannot use Docker:

```bash
# Backend tests
(cd backend && npm install && npm test)

# Frontend tests
(cd frontend && npm install && npm test)

# All tests with coverage
(cd backend && npm run test:coverage) && (cd frontend && npm run test:coverage)
```

**Warning**: Local testing requires Node.js 20+ and may have inconsistent results across different machines.

## Writing New Tests

### Backend Test Guidelines

1. **File Naming**: Use `.test.js` suffix (e.g., `spotifyService.test.js`)
2. **Location**: Place tests in `__tests__/` directory next to source files
3. **Structure**: Use `describe` blocks for grouping related tests
4. **Mocking**: Mock external dependencies (axios, MongoDB, etc.)
5. **Assertions**: Use Jest matchers (`expect`, `toBe`, `toEqual`, etc.)

Example structure:
```javascript
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

describe('Module Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('functionName', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = someFunction(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Frontend Test Guidelines

1. **File Naming**: Use `.test.js` suffix (e.g., `Login.test.js`)
2. **Location**: Place tests next to component files
3. **Rendering**: Use `render()` from `@testing-library/svelte`
4. **Queries**: Use semantic queries (`getByRole`, `getByText`, etc.)
5. **Events**: Use `fireEvent` for user interactions
6. **Assertions**: Use jest-dom matchers (`toBeInTheDocument`, etc.)

Example structure:
```javascript
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Component from './Component.svelte';

describe('Component Name', () => {
  test('should render correctly', () => {
    render(Component, { props: { someProp: 'value' } });
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });

  test('should handle user interaction', async () => {
    const { component } = render(Component);
    const spy = vi.fn();
    component.$on('event', spy);

    await fireEvent.click(screen.getByRole('button'));

    expect(spy).toHaveBeenCalled();
  });
});
```

## Test Configuration

### Backend Jest Configuration (`backend/jest.config.js`)

```javascript
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
```

### Frontend Vitest Configuration (`frontend/vitest.config.js`)

```javascript
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      threshold: {
        branches: 60,
        functions: 60,
        lines: 60,
        statements: 60,
      },
    },
  },
});
```

## Continuous Integration

### GitHub Actions Example (Using Docker Containers)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Run backend tests
        run: docker-compose -f docker-compose.test.yml run --rm backend-test-coverage

      - name: Run frontend tests
        run: docker-compose -f docker-compose.test.yml run --rm frontend-test-coverage

      - name: Upload backend coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend

      - name: Upload frontend coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend

      - name: Cleanup
        if: always()
        run: docker-compose -f docker-compose.test.yml down
```

### Alternative: Using Test Runner Script in CI

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Make test runner executable
        run: chmod +x run-tests.sh

      - name: Run all tests with coverage
        run: ./run-tests.sh --coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info,./frontend/coverage/lcov.info
```

## Troubleshooting

### Docker-Specific Issues

#### Docker not running
**Error**: `Cannot connect to the Docker daemon`
**Solution**: Start Docker Desktop and ensure it's running
```bash
# Check Docker status
docker info
```

#### Permission denied on test script
**Error**: `Permission denied: ./run-tests.sh`
**Solution**: Make the script executable
```bash
chmod +x run-tests.sh
```

#### Containers not cleaning up
**Error**: Old test containers still running
**Solution**: Manually clean up
```bash
# List all test containers
docker ps -a | grep spotify-uploader-test

# Remove all test containers
docker-compose -f docker-compose.test.yml down --remove-orphans

# Remove all stopped containers
docker container prune -f
```

#### Port conflicts
**Error**: Port already in use
**Solution**: Test containers don't expose ports, so this shouldn't happen. If it does, check for conflicting services:
```bash
docker ps
docker-compose down
```

#### Slow test runs
**Issue**: First test run is slow
**Explanation**: Docker needs to pull Node.js image and install dependencies. Subsequent runs are much faster.
**Solution**: Wait for first run to complete. Dependencies are cached.

#### Coverage files not generated
**Issue**: Coverage reports missing after test run
**Solution**: Ensure you're using the coverage command:
```bash
./run-tests.sh --coverage
# or
docker-compose -f docker-compose.test.yml run --rm backend-test-coverage
```

### Common Issues

#### Backend: "Cannot find module"
**Solution**: Ensure all imports use `.js` extensions for ES modules
```javascript
// Correct
import { searchTrack } from '../spotifyService.js';

// Incorrect
import { searchTrack } from '../spotifyService';
```

#### Frontend: "TypeError: Cannot read property 'toBeInTheDocument'"
**Solution**: Check that `@testing-library/jest-dom` is imported in setup file
```javascript
// src/test/setup.js
import '@testing-library/jest-dom';
```

#### Frontend: "window.matchMedia is not a function"
**Solution**: Verify mock is in setup file
```javascript
// src/test/setup.js
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
  }),
});
```

#### Tests Timing Out
**Solution**: Increase timeout in jest.config.js or vitest.config.js
```javascript
{
  testTimeout: 10000 // 10 seconds
}
```

## Best Practices

### 1. Test Naming
- Use descriptive test names: `test('should return user when valid token provided', ...)`
- Follow pattern: "should [expected behavior] when [condition]"

### 2. Test Independence
- Each test should be independent and not rely on others
- Use `beforeEach` to reset state between tests
- Avoid sharing variables between tests

### 3. Mocking
- Mock external dependencies (APIs, databases)
- Use realistic mock data
- Clear mocks between tests with `jest.clearAllMocks()` or `vi.clearAllMocks()`

### 4. Assertions
- Use specific matchers (`toBe`, `toEqual`, `toHaveBeenCalledWith`)
- Test both success and error cases
- Include edge cases and boundary conditions

### 5. Coverage
- Aim for high coverage but focus on meaningful tests
- Don't test implementation details
- Test user-facing behavior and API contracts

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Testing Library Documentation](https://testing-library.com/docs/svelte-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

## Summary

This testing infrastructure provides:

- ✅ Comprehensive unit tests for services
- ✅ Integration tests for API endpoints
- ✅ Component tests for UI
- ✅ Coverage reporting with thresholds
- ✅ Watch mode for development
- ✅ CI/CD ready configuration

Run tests frequently during development to catch issues early and maintain code quality!
