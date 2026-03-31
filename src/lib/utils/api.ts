import { type ApiFailure, type ApiSuccess } from '@/types/api';

export function ok<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function fail(error: string, fieldErrors?: Record<string, string[]>): ApiFailure {
  return { ok: false, error, fieldErrors };
}
