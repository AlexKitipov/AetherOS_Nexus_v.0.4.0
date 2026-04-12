export type BridgeErrorCode =
  | "VALIDATION_ERROR"
  | "TRANSPORT_ERROR"
  | "BACKEND_ERROR"
  | "PARSING_ERROR"
  | "UNKNOWN_ERROR";

export class BridgeError extends Error {
  public readonly code: BridgeErrorCode;
  public readonly cause?: unknown;

  constructor(code: BridgeErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "BridgeError";
    this.code = code;
    this.cause = cause;
  }
}

export function normalizeBridgeError(error: unknown): BridgeError {
  if (error instanceof BridgeError) {
    return error;
  }

  if (error instanceof TypeError) {
    return new BridgeError("TRANSPORT_ERROR", error.message, error);
  }

  if (error instanceof Error) {
    return new BridgeError("UNKNOWN_ERROR", error.message, error);
  }

  return new BridgeError("UNKNOWN_ERROR", "An unknown bridge error occurred", error);
}
