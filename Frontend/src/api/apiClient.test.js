import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosState = vi.hoisted(() => ({ requestHandler: null, responseErrorHandler: null, config: null }));

vi.mock('axios', () => ({
  default: {
    create: vi.fn((config) => {
      axiosState.config = config;
      return {
      interceptors: {
        request: { use: vi.fn((handler) => { axiosState.requestHandler = handler; }) },
        response: { use: vi.fn((_, errorHandler) => { axiosState.responseErrorHandler = errorHandler; }) },
      },
      };
    }),
  },
}));

import './apiClient';

describe('admin API client', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('uses the API route prefix and attaches the authenticated Tripora session token', async () => {
    localStorage.setItem('tripora_token', 'live-session-token');

    const request = await axiosState.requestHandler({ headers: {} });

    expect(axiosState.config.baseURL).toBe('http://localhost:5120/api');
    expect(request.headers.Authorization).toBe('Bearer live-session-token');
  });
});
