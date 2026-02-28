import type { ErrorResponse, SuccessResponse } from "@bites-ratings/shared";

export function createSuccessResponse<T>(
  data: T,
  message: string = "Success"
): SuccessResponse<T> {
  return { success: true, message, data };
}

export function createErrorResponse(error: string): ErrorResponse {
  return { success: false, error };
}
