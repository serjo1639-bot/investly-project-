/**
 * errors.js — Normalizes any failure (network, HTTP, ApiResponse) into a
 * single ApiError shape so the whole UI can render errors consistently.
 */

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', errors = [] } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors; // array of field/validation messages
  }
}

/**
 * Convert an axios error (or anything thrown) into an ApiError.
 * The backend wraps failures as { success:false, message, errors }.
 */
export function normalizeError(error) {
  if (error instanceof ApiError) return error;

  // No response → network/timeout
  if (error?.code === 'ECONNABORTED') {
    return new ApiError('The request timed out. Please try again.', {
      code: 'TIMEOUT',
    });
  }
  if (error?.request && !error?.response) {
    return new ApiError(
      'Cannot reach the server. Check your connection and try again.',
      { code: 'NETWORK' }
    );
  }

  const status = error?.response?.status ?? 0;
  const body = error?.response?.data;
  const message =
    body?.message ||
    (Array.isArray(body?.errors) && body.errors[0]) ||
    defaultMessageForStatus(status) ||
    error?.message ||
    'Something went wrong.';

  return new ApiError(message, {
    status,
    code: `HTTP_${status}`,
    errors: Array.isArray(body?.errors) ? body.errors : [],
  });
}

function defaultMessageForStatus(status) {
  switch (status) {
    case 400:
      return 'Invalid request. Please check the form and try again.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return 'Not found.';
    case 409:
      return 'That action conflicts with the current state.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return null;
  }
}
