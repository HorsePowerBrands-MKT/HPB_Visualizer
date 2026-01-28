import { NextResponse } from 'next/server';

/**
 * API Utilities
 * Standardized error handling and response utilities
 */

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function errorResponse(error: unknown): NextResponse {
  // Handle APIError
  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code
      },
      { status: error.statusCode }
    );
  }
  
  // Handle standard Error
  if (error instanceof Error) {
    console.error('Error:', error.message, error.stack);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  
  // Handle unknown errors
  console.error('Unknown error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
