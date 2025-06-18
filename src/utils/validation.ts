import { FILE_CONSTRAINTS, ERROR_CODES, type ErrorCode } from '../types/shared';

export class ValidationError extends Error {
  constructor(message: string, public code: ErrorCode) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class FileValidator {
  static validateFile(file: File): void {
    this.validateFileType(file.name);
    this.validateFileSize(file.size);
  }

  static validateFileType(fileName: string): void {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.')) as '.csv';
    if (!FILE_CONSTRAINTS.ALLOWED_EXTENSIONS.includes(extension)) {
      throw new ValidationError(
        'Invalid file type. Please upload a CSV file.',
        ERROR_CODES.INVALID_FILE_TYPE
      );
    }
  }

  static validateFileSize(fileSize: number): void {
    if (fileSize > FILE_CONSTRAINTS.MAX_SIZE_BYTES) {
      throw new ValidationError(
        `File size exceeds ${FILE_CONSTRAINTS.MAX_SIZE_DISPLAY} limit.`,
        ERROR_CODES.FILE_TOO_LARGE
      );
    }
  }

  static validateFileContent(content: string): void {
    if (!content.trim()) {
      throw new ValidationError(
        'CSV file appears to be empty',
        ERROR_CODES.EMPTY_FILE
      );
    }
  }
}

export class ThresholdValidator {
  static validateThreshold(threshold: number): void {
    if (isNaN(threshold)) {
      throw new ValidationError(
        'Threshold must be a valid number',
        ERROR_CODES.INVALID_THRESHOLD
      );
    }

    if (threshold < 0) {
      throw new ValidationError(
        'Threshold must be a positive number',
        ERROR_CODES.INVALID_THRESHOLD
      );
    }
  }

  static validateThresholdString(thresholdStr: string): number {
    if (!thresholdStr.trim()) {
      throw new ValidationError(
        'Usage threshold is required',
        ERROR_CODES.INVALID_THRESHOLD
      );
    }

    const threshold = parseFloat(thresholdStr);
    this.validateThreshold(threshold);
    return threshold;
  }
}

export class CSVValidator {
  static validateCSVStructure(content: string): { headers: string[]; rows: string[] } {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new ValidationError(
        'CSV file appears to be empty',
        ERROR_CODES.EMPTY_FILE
      );
    }

    const headers = lines[0].split(',').map(h => h.trim());
    if (headers.length === 0) {
      throw new ValidationError(
        'Invalid CSV format: No headers found',
        ERROR_CODES.INVALID_CSV_FORMAT
      );
    }

    const rows = lines.slice(1);
    return { headers, rows };
  }

  static validateRowStructure(row: string, expectedColumns: number): boolean {
    const cells = row.split(',');
    return cells.length === expectedColumns && cells.some(cell => cell.trim() !== '');
  }
}

export function createDetailedError(error: unknown): { message: string; code?: ErrorCode; details?: string } {
  if (error instanceof ValidationError) {
    return {
      message: error.message,
      code: error.code
    };
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
      details: error.stack
    };
  }
  
  return {
    message: 'An unexpected error occurred',
    code: ERROR_CODES.PROCESSING_ERROR
  };
} 