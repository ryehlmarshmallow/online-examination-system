import {
  expect,
  afterEach
} from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest expect matcher with DOM assertions
expect.extend(matchers);

// Unmount React components automatically after each test
afterEach(() => {
  cleanup();
});
