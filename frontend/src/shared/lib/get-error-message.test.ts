import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios';
import {
  getErrorMessage,
  getErrorCode
} from './get-error-message';

describe('get-error-message helpers', () => {
  it('should return default message for non-AxiosError', () => {
    expect(getErrorMessage(new Error('Simple error'))).toBe('Something went wrong. Please try again.');
  });

  it('should return error payload message for normal AxiosError', () => {
    const response = {
      data: { message: 'Invalid credentials' },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as unknown as InternalAxiosRequestConfig,
    } as unknown as AxiosResponse;
    const axiosError = new AxiosError(
      'Bad Request',
      'ERR_BAD_REQUEST',
      {} as unknown as InternalAxiosRequestConfig,
      {},
      response
    );
    expect(getErrorMessage(axiosError)).toBe('Invalid credentials');
  });

  it('should return error payload error field if message is missing', () => {
    const response = {
      data: { error: 'Unauthorized Action' },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as unknown as InternalAxiosRequestConfig,
    } as unknown as AxiosResponse;
    const axiosError = new AxiosError(
      'Unauthorized',
      'ERR_UNAUTHORIZED',
      {} as unknown as InternalAxiosRequestConfig,
      {},
      response
    );
    expect(getErrorMessage(axiosError)).toBe('Unauthorized Action');
  });

  it('should fall back to AxiosError message if response payload has no message or error', () => {
    const axiosError = new AxiosError('Connection refused', 'ERR_CONNECTION');
    expect(getErrorMessage(axiosError)).toBe('Connection refused');
  });

  it('should return internal server error message if response status is 500', () => {
    const response = {
      data: { message: 'DB Connection Failed' },
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: {} as unknown as InternalAxiosRequestConfig,
    } as unknown as AxiosResponse;
    const axiosError = new AxiosError(
      'Internal Server Error',
      'ERR_500',
      {} as unknown as InternalAxiosRequestConfig,
      {},
      response
    );
    expect(getErrorMessage(axiosError)).toBe('Internal server error. Please try again later.');
  });

  it('should return internal server error message if error message contains "status code 500"', () => {
    const axiosError = new AxiosError('Request failed with status code 500', 'ERR_500');
    expect(getErrorMessage(axiosError)).toBe('Internal server error. Please try again later.');
  });

  it('should extract error code correctly', () => {
    const response = {
      data: { code: 'AUTH_FAILED' },
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as unknown as InternalAxiosRequestConfig,
    } as unknown as AxiosResponse;
    const axiosError = new AxiosError(
      'Unauthorized',
      'ERR_UNAUTHORIZED',
      {} as unknown as InternalAxiosRequestConfig,
      {},
      response
    );
    expect(getErrorCode(axiosError)).toBe('AUTH_FAILED');
  });

  it('should return undefined code for non-AxiosError', () => {
    expect(getErrorCode(new Error('Simple error'))).toBeUndefined();
  });
});
