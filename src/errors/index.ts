// BaseError class for all operational errors
class BaseError extends Error {
	statusCode: number;
	isOperational: boolean;

	constructor(message: string, statusCode: number, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
	}
}

// NotFoundError extends BaseError, sets default message and 404 status
class NotFoundError extends BaseError {
	constructor(message = 'Resource not found') {
		super(message, 404);
	}
}

// ValidationError extends BaseError, sets 400 status
class ValidationError extends BaseError {
	constructor(message: string) {
		super(message, 400);
	}
}

// DatabaseError extends BaseError, keeps original error for debugging
class DatabaseError extends BaseError {
	originalError?: Error;

	constructor(message: string, originalError?: any) {
		super(message, 500); // HTTP 500 for server errors
		this.originalError = originalError; // Store the original error for logging
	}
}

// This custom ApiError can be merged with BaseError for better reusability
class ApiError extends BaseError {
	constructor(statusCode: number, message: string) {
		super(message, statusCode);
	}
}

export { BaseError, NotFoundError, ValidationError, DatabaseError, ApiError };
