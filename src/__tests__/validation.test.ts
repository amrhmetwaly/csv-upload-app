import { FileValidator, ThresholdValidator, CSVValidator, ValidationError, createDetailedError } from '../utils/validation';
import { ERROR_CODES } from '../types/shared';

describe('FileValidator', () => {
  const createMockFile = (name: string, size: number): File => ({
    name,
    size,
    type: 'text/csv'
  } as File);

  describe('validateFile', () => {
    it('should accept valid CSV files', () => {
      const file = createMockFile('test.csv', 1024);
      expect(() => FileValidator.validateFile(file)).not.toThrow();
    });

    it('should reject non-CSV files', () => {
      const file = createMockFile('test.txt', 1024);
      expect(() => FileValidator.validateFile(file)).toThrow(ValidationError);
      expect(() => FileValidator.validateFile(file)).toThrow('Invalid file type');
    });

    it('should reject files over 10MB', () => {
      const oversizeFile = createMockFile('test.csv', 11 * 1024 * 1024);
      expect(() => FileValidator.validateFile(oversizeFile)).toThrow(ValidationError);
      expect(() => FileValidator.validateFile(oversizeFile)).toThrow('File size exceeds');
    });

    it('should accept CSV files with different casing', () => {
      const file = createMockFile('TEST.CSV', 1024);
      expect(() => FileValidator.validateFile(file)).not.toThrow();
    });
  });

  describe('validateFileType', () => {
    it('should validate valid CSV extensions', () => {
      expect(() => FileValidator.validateFileType('test.csv')).not.toThrow();
      expect(() => FileValidator.validateFileType('TEST.CSV')).not.toThrow();
    });

    it('should throw ValidationError for invalid extensions', () => {
      expect(() => FileValidator.validateFileType('test.txt')).toThrow(ValidationError);
      expect(() => FileValidator.validateFileType('test.xlsx')).toThrow(ValidationError);
    });
  });

  describe('validateFileContent', () => {
    it('should accept valid content', () => {
      expect(() => FileValidator.validateFileContent('header1,header2\ndata1,data2')).not.toThrow();
    });

    it('should reject empty content', () => {
      expect(() => FileValidator.validateFileContent('')).toThrow(ValidationError);
      expect(() => FileValidator.validateFileContent('   ')).toThrow(ValidationError);
    });
  });
});

describe('ThresholdValidator', () => {
  describe('validateThreshold', () => {
    it('should accept valid positive numbers', () => {
      expect(() => ThresholdValidator.validateThreshold(100)).not.toThrow();
      expect(() => ThresholdValidator.validateThreshold(0)).not.toThrow();
      expect(() => ThresholdValidator.validateThreshold(0.5)).not.toThrow();
    });

    it('should reject negative numbers', () => {
      expect(() => ThresholdValidator.validateThreshold(-10)).toThrow(ValidationError);
      expect(() => ThresholdValidator.validateThreshold(-0.1)).toThrow(ValidationError);
    });

    it('should reject NaN values', () => {
      expect(() => ThresholdValidator.validateThreshold(NaN)).toThrow(ValidationError);
    });
  });

  describe('validateThresholdString', () => {
    it('should parse and validate valid threshold strings', () => {
      expect(ThresholdValidator.validateThresholdString('100')).toBe(100);
      expect(ThresholdValidator.validateThresholdString('0.5')).toBe(0.5);
      expect(ThresholdValidator.validateThresholdString('0')).toBe(0);
    });

    it('should reject empty strings', () => {
      expect(() => ThresholdValidator.validateThresholdString('')).toThrow(ValidationError);
      expect(() => ThresholdValidator.validateThresholdString('   ')).toThrow(ValidationError);
    });

    it('should reject non-numeric strings', () => {
      expect(() => ThresholdValidator.validateThresholdString('abc')).toThrow(ValidationError);
      expect(() => ThresholdValidator.validateThresholdString('10abc')).toThrow(ValidationError);
    });

    it('should reject negative values in strings', () => {
      expect(() => ThresholdValidator.validateThresholdString('-10')).toThrow(ValidationError);
    });
  });
});

describe('CSVValidator', () => {
  describe('validateCSVStructure', () => {
    it('should parse valid CSV structure', () => {
      const csvContent = 'header1,header2,header3\ndata1,data2,data3\ndata4,data5,data6';
      const result = CSVValidator.validateCSVStructure(csvContent);
      
      expect(result.headers).toEqual(['header1', 'header2', 'header3']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toBe('data1,data2,data3');
    });

    it('should handle CSV with only headers', () => {
      const csvContent = 'header1,header2,header3';
      const result = CSVValidator.validateCSVStructure(csvContent);
      
      expect(result.headers).toEqual(['header1', 'header2', 'header3']);
      expect(result.rows).toHaveLength(0);
    });

    it('should reject empty CSV content', () => {
      expect(() => CSVValidator.validateCSVStructure('')).toThrow(ValidationError);
      expect(() => CSVValidator.validateCSVStructure('\n\n')).toThrow(ValidationError);
    });

    it('should handle trimming of headers', () => {
      const csvContent = ' header1 , header2 , header3 \ndata1,data2,data3';
      const result = CSVValidator.validateCSVStructure(csvContent);
      
      expect(result.headers).toEqual(['header1', 'header2', 'header3']);
    });
  });

  describe('validateRowStructure', () => {
    it('should validate correct row structure', () => {
      expect(CSVValidator.validateRowStructure('data1,data2,data3', 3)).toBe(true);
      expect(CSVValidator.validateRowStructure('data1,data2', 2)).toBe(true);
    });

    it('should reject rows with wrong column count', () => {
      expect(CSVValidator.validateRowStructure('data1,data2', 3)).toBe(false);
      expect(CSVValidator.validateRowStructure('data1,data2,data3,data4', 3)).toBe(false);
    });

    it('should reject completely empty rows', () => {
      expect(CSVValidator.validateRowStructure(',,', 3)).toBe(false);
      expect(CSVValidator.validateRowStructure('   ,   ,   ', 3)).toBe(false);
    });

    it('should accept rows with some empty cells but not all', () => {
      expect(CSVValidator.validateRowStructure('data1,,data3', 3)).toBe(true);
      expect(CSVValidator.validateRowStructure(',data2,', 3)).toBe(true);
    });
  });
});

describe('createDetailedError', () => {
  it('should handle ValidationError correctly', () => {
    const validationError = new ValidationError('Test validation error', ERROR_CODES.INVALID_FILE_TYPE);
    const result = createDetailedError(validationError);
    
    expect(result.message).toBe('Test validation error');
    expect(result.code).toBe(ERROR_CODES.INVALID_FILE_TYPE);
  });

  it('should handle regular Error correctly', () => {
    const error = new Error('Test error message');
    const result = createDetailedError(error);
    
    expect(result.message).toBe('Test error message');
    expect(result.details).toBeDefined();
  });

  it('should handle unknown errors', () => {
    const result = createDetailedError('String error');
    
    expect(result.message).toBe('An unexpected error occurred');
    expect(result.code).toBe(ERROR_CODES.PROCESSING_ERROR);
  });

  it('should handle null/undefined errors', () => {
    const result1 = createDetailedError(null);
    const result2 = createDetailedError(undefined);
    
    expect(result1.message).toBe('An unexpected error occurred');
    expect(result2.message).toBe('An unexpected error occurred');
  });
});

describe('ValidationError', () => {
  it('should create ValidationError with correct properties', () => {
    const error = new ValidationError('Test message', ERROR_CODES.INVALID_THRESHOLD);
    
    expect(error.message).toBe('Test message');
    expect(error.code).toBe(ERROR_CODES.INVALID_THRESHOLD);
    expect(error.name).toBe('ValidationError');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof ValidationError).toBe(true);
  });
}); 