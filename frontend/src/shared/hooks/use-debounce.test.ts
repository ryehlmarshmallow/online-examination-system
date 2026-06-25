import {
  renderHook,
  act
} from '@testing-library/react';
import { useDebounce } from './use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'hello', delay: 500 },
    });

    // Rerender with new value
    rerender({ value: 'world', delay: 500 });

    // It should still return 'hello' immediately
    expect(result.current).toBe('hello');

    // Advance time by 250ms (less than 500ms delay)
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('hello');

    // Advance time by another 250ms
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('world');
  });

  it('should clear old timeout when value changes again before delay expires', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'first', delay: 500 },
    });

    rerender({ value: 'second', delay: 500 });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('first');

    // Update value again before first delay completes
    rerender({ value: 'third', delay: 500 });

    act(() => {
      vi.advanceTimersByTime(300); // 600ms total since start, but only 300ms since 'third'
    });
    expect(result.current).toBe('first'); // should still be 'first' because 'third' is debouncing

    act(() => {
      vi.advanceTimersByTime(200); // Now 500ms since 'third'
    });
    expect(result.current).toBe('third');
  });
});
