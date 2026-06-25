import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from './use-document-title';

describe('useDocumentTitle', () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
  });

  it('should set title with suffix by default', () => {
    renderHook(() => useDocumentTitle('Dashboard'));
    expect(document.title).toBe('Dashboard | Online Examination System');
  });

  it('should set title without suffix if includeSuffix is false', () => {
    renderHook(() => useDocumentTitle('Dashboard', false));
    expect(document.title).toBe('Dashboard');
  });

  it('should fallback to site name if title is empty', () => {
    renderHook(() => useDocumentTitle(''));
    expect(document.title).toBe('Online Examination System');
  });
});
