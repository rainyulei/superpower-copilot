// src/errors.ts

export enum ErrorCategory {
  ModelUnavailable = 'ModelUnavailable',
  Cancelled = 'Cancelled',
  GitError = 'GitError',
  FileError = 'FileError',
  ToolError = 'ToolError',
  Internal = 'Internal',
}

export interface FormattedError {
  category: ErrorCategory;
  userMessage: string;
  originalError: Error | unknown;
}

/**
 * Pattern-match error messages to categorize them
 */
function categorizeError(error: Error | unknown): ErrorCategory {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMsg = message.toLowerCase();

  // Model availability errors
  if (lowerMsg.includes('model') && (lowerMsg.includes('unavailable') || lowerMsg.includes('not found'))) {
    return ErrorCategory.ModelUnavailable;
  }

  // Cancellation
  if (lowerMsg.includes('cancel') || lowerMsg.includes('abort')) {
    return ErrorCategory.Cancelled;
  }

  // Git errors
  if (lowerMsg.includes('git') || lowerMsg.includes('repository') || lowerMsg.includes('commit')) {
    return ErrorCategory.GitError;
  }

  // File system errors
  if (lowerMsg.includes('file') || lowerMsg.includes('enoent') || lowerMsg.includes('eacces') || lowerMsg.includes('permission')) {
    return ErrorCategory.FileError;
  }

  // Tool/command errors
  if (lowerMsg.includes('command') || lowerMsg.includes('tool') || lowerMsg.includes('spawn')) {
    return ErrorCategory.ToolError;
  }

  // Default to internal error
  return ErrorCategory.Internal;
}

/**
 * Format error with user-friendly message based on category
 */
export function formatUserError(error: Error | unknown): FormattedError {
  const category = categorizeError(error);
  let userMessage: string;

  switch (category) {
    case ErrorCategory.ModelUnavailable:
      userMessage = '⚠️ The AI model is currently unavailable. Please try again in a moment.';
      break;

    case ErrorCategory.Cancelled:
      userMessage = 'Operation was cancelled.';
      break;

    case ErrorCategory.GitError:
      userMessage = '⚠️ Git operation failed. Make sure you\'re in a git repository and have the necessary permissions.';
      break;

    case ErrorCategory.FileError:
      userMessage = '⚠️ File operation failed. Check that the file exists and you have the necessary permissions.';
      break;

    case ErrorCategory.ToolError:
      userMessage = '⚠️ Tool execution failed. Check that required tools are installed and accessible.';
      break;

    case ErrorCategory.Internal: {
      const errorMsg = error instanceof Error ? error.message : String(error);
      userMessage = `⚠️ An unexpected error occurred: ${errorMsg}`;
      break;
    }
  }

  return {
    category,
    userMessage,
    originalError: error,
  };
}

/**
 * Check if an error category is recoverable (user can retry)
 */
export function isRecoverableError(category: ErrorCategory): boolean {
  return category === ErrorCategory.ModelUnavailable
    || category === ErrorCategory.ToolError
    || category === ErrorCategory.FileError;
}
