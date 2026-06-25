import {
  renderHook,
  act
} from '@testing-library/react';
import { useDisclosure } from './use-disclosure';

describe('useDisclosure', () => {
  it('should initialize with default false state', () => {
    const { result } = renderHook(() => useDisclosure());
    expect(result.current.isOpen).toBe(false);
  });

  it('should initialize with provided state', () => {
    const { result } = renderHook(() => useDisclosure(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('should open state on call onOpen', () => {
    const { result } = renderHook(() => useDisclosure(false));
    act(() => {
      result.current.onOpen();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('should close state on call onClose', () => {
    const { result } = renderHook(() => useDisclosure(true));
    act(() => {
      result.current.onClose();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle state on call onToggle', () => {
    const { result } = renderHook(() => useDisclosure(false));

    act(() => {
      result.current.onToggle();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onToggle();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should set state manually on call setIsOpen', () => {
    const { result } = renderHook(() => useDisclosure(false));

    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.setIsOpen(false);
    });
    expect(result.current.isOpen).toBe(false);
  });
});
