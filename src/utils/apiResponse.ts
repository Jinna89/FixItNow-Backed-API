import type { Response } from 'express';

type ResponseMeta = Record<string, unknown> | null;
type SuccessPayload = {
  success: true;
  message: string;
  data: unknown;
  meta?: ResponseMeta;
};

type SuccessOptions = {
  statusCode?: number;
  message?: string;
  data?: unknown;
  meta?: ResponseMeta;
};

type ErrorOptions = {
  statusCode?: number;
  message?: string;
  errorDetails?: unknown;
};

/**
 * Standardized success response.
 * Shape: { success, message, data }
 */
function sendSuccess(
  res: Response,
  { statusCode = 200, message = 'Success', data = null, meta = null }: SuccessOptions
) {
  const payload: SuccessPayload = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

/**
 * Standardized error response.
 * Shape (MANDATORY): { success, message, errorDetails }
 */
function sendError(
  res: Response,
  { statusCode = 500, message = 'Something went wrong', errorDetails = null }: ErrorOptions
) {
  return res.status(statusCode).json({
    success: false,
    message,
    errorDetails,
  });
}

/**
 * Custom application error class carrying an HTTP status code.
 */
class ApiError extends Error {
  statusCode: number;
  errorDetails: unknown;

  constructor(statusCode: number, message: string, errorDetails: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;
  }
}

module.exports = { sendSuccess, sendError, ApiError };

export {};
