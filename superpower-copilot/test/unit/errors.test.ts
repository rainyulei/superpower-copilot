// test/unit/errors.test.ts
import { describe, it } from 'mocha';
import * as assert from 'assert';
import { ErrorCategory, formatUserError, isRecoverableError } from '../../src/errors';

describe('Errors Module', () => {
  describe('formatUserError', () => {
    it('should categorize model unavailable errors', () => {
      const error = new Error('Model not found or unavailable');
      const formatted = formatUserError(error);
      assert.strictEqual(formatted.category, ErrorCategory.ModelUnavailable);
      assert.ok(formatted.userMessage.includes('model is currently unavailable'));
    });

    it('should categorize cancelled errors', () => {
      const error = new Error('Operation was cancelled by user');
      const formatted = formatUserError(error);
      assert.strictEqual(formatted.category, ErrorCategory.Cancelled);
      assert.ok(formatted.userMessage.includes('cancelled'));
    });

    it('should categorize git errors', () => {
      const error = new Error('Git repository not found');
      const formatted = formatUserError(error);
      assert.strictEqual(formatted.category, ErrorCategory.GitError);
      assert.ok(formatted.userMessage.includes('Git operation failed'));
    });

    it('should categorize file errors', () => {
      const error = new Error('ENOENT: no such file or directory');
      const formatted = formatUserError(error);
      assert.strictEqual(formatted.category, ErrorCategory.FileError);
      assert.ok(formatted.userMessage.includes('File operation failed'));
    });

    it('should categorize tool errors', () => {
      const error = new Error('Command failed to spawn');
      const formatted = formatUserError(error);
      assert.strictEqual(formatted.category, ErrorCategory.ToolError);
      assert.ok(formatted.userMessage.includes('Tool execution failed'));
    });

    it('should categorize unknown errors as internal', () => {
      const error = new Error('Something unexpected happened');
      const formatted = formatUserError(error);
      assert.strictEqual(formatted.category, ErrorCategory.Internal);
      assert.ok(formatted.userMessage.includes('unexpected error'));
    });

    it('should preserve original error', () => {
      const error = new Error('Test error');
      const formatted = formatUserError(error);
      assert.strictEqual(formatted.originalError, error);
    });
  });

  describe('isRecoverableError', () => {
    it('should return true for ModelUnavailable', () => {
      assert.strictEqual(isRecoverableError(ErrorCategory.ModelUnavailable), true);
    });

    it('should return false for Cancelled', () => {
      assert.strictEqual(isRecoverableError(ErrorCategory.Cancelled), false);
    });

    it('should return false for GitError', () => {
      assert.strictEqual(isRecoverableError(ErrorCategory.GitError), false);
    });

    it('should return true for FileError', () => {
      assert.strictEqual(isRecoverableError(ErrorCategory.FileError), true);
    });

    it('should return true for ToolError', () => {
      assert.strictEqual(isRecoverableError(ErrorCategory.ToolError), true);
    });

    it('should return false for Internal', () => {
      assert.strictEqual(isRecoverableError(ErrorCategory.Internal), false);
    });
  });
});
