import { AxiosError } from 'axios';

export interface AppError {
  message: string;
  code?: string | number;
  field?: string;
}

const API_ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'You need to sign in to continue.',
  403: "You don't have permission to do that.",
  404: "We couldn't find what you're looking for.",
  409: 'This action conflicts with existing data.',
  422: 'Please check your input and try again.',
  429: 'Too many requests. Please slow down.',
  500: 'Server error. Please try again later.',
  502: 'Service unavailable. Please try again shortly.',
  503: 'Service is temporarily down. Please try again soon.',
};

export function parseApiError(error: unknown): AppError {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;
    const serverField = error.response?.data?.field;

    if (serverMessage) return { message: serverMessage, code: status, field: serverField };
    if (status && API_ERROR_MESSAGES[status]) return { message: API_ERROR_MESSAGES[status], code: status };
    if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
      return { message: 'Request timed out. Please check your connection and try again.' };
    }
    if (!error.response) return { message: 'No internet connection. Please check your network.' };
  }

  if (error instanceof Error) return { message: error.message };
  return { message: 'An unexpected error occurred. Please try again.' };
}

export function getErrorMessage(error: unknown): string {
  return parseApiError(error).message;
}

const offlineQueue: Array<{ id: string; fn: () => Promise<unknown>; timestamp: number }> = [];

export function queueOfflineAction(id: string, fn: () => Promise<unknown>): void {
  if (!offlineQueue.find((item) => item.id === id)) {
    offlineQueue.push({ id, fn, timestamp: Date.now() });
  }
}

export async function flushOfflineQueue(): Promise<void> {
  if (offlineQueue.length === 0) return;
  const toProcess = [...offlineQueue];
  offlineQueue.length = 0;
  for (const item of toProcess) {
    try {
      await item.fn();
    } catch {
      offlineQueue.push(item);
    }
  }
}

export function getOfflineQueueLength(): number {
  return offlineQueue.length;
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flushOfflineQueue(); });
}
