/**
 * Standardized API response helpers for route handlers
 */

import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
}

export interface ApiErrorResponse {
  error: string;
  details?: string;
}

/**
 * Creates a standardized success JSON response
 */
export function successResponse<T>(
  data?: T,
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      ...(data !== undefined && { data }),
    } as ApiSuccessResponse<T>,
    { status }
  );
}

/**
 * Creates a standardized error JSON response
 */
export function errorResponse(
  message: string,
  status = 500,
  details?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Creates a 400 Bad Request response
 */
export function badRequest(message: string): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 400);
}

/**
 * Creates a 401 Unauthorized response
 */
export function unauthorized(
  message = 'Authentication required'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 401);
}

/**
 * Creates a 403 Forbidden response
 */
export function forbidden(
  message = 'Access denied'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 403);
}

/**
 * Creates a 404 Not Found response
 */
export function notFound(
  message = 'Resource not found'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 404);
}

/**
 * Creates a 502 Bad Gateway response for upstream service errors
 */
export function badGateway(message: string): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 502);
}

/**
 * Creates a 503 Service Unavailable response
 */
export function serviceUnavailable(
  message = 'Service temporarily unavailable'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 503);
}

/**
 * Creates a 504 Gateway Timeout response
 */
export function gatewayTimeout(
  message = 'Request timed out'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 504);
}

/**
 * Extracts error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}
