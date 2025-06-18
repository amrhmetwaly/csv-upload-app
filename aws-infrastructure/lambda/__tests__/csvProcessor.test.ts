import { CSVProcessor } from '../src/csvProcessor';
import { ProcessedData } from '../src/types';

describe('CSVProcessor', () => {
  const sampleCSVContent = `Customer ID,Name,Usage (kWh),Billing Month,Rate Plan,Location
001,John Smith,1250.5,2024-01,Residential,Portland
002,Sarah Johnson,890.2,2024-01,Residential,Beaverton
003,ABC Corp,4500.0,2024-01,Commercial,Tigard
004,Mike Wilson,675.8,2024-01,Residential,Lake Oswego
005,Tech Solutions LLC,8750.3,2024-01,Industrial,Hillsboro`;

  const invalidCSVContent = `Customer ID,Name,Usage (kWh)
001,John Smith
002,Sarah Johnson,890.2,2024-01`;

  describe('processCSVContent', () => {
    it('should process valid CSV content correctly', () => {
      const threshold = 1000;
      const result: ProcessedData = CSVProcessor.processCSVContent(sampleCSVContent, threshold);

      expect(result.totalRows).toBe(5);
      expect(result.invalidRows).toBe(0);
      expect(result.headers).toEqual(['Customer ID', 'Name', 'Usage (kWh)', 'Billing Month', 'Rate Plan', 'Location']);
      expect(result.usageColumns).toContain('Usage (kWh)');
      expect(result.threshold).toBe(threshold);
    });

    it('should generate correct summary data', () => {
      const threshold = 1000;
      const result: ProcessedData = CSVProcessor.processCSVContent(sampleCSVContent, threshold);

      expect(result.summary).toBeDefined();
      expect(result.summary.totalDaysProcessed).toBe(5);
      expect(result.summary.daysExceedingThreshold).toBe(3); // 1250.5, 4500.0, 8750.3
      expect(result.summary.totalUsage).toBe(16066.8); // 1250.5 + 890.2 + 4500.0 + 675.8 + 8750.3
      expect(result.summary.averageUsage).toBe(3213.36);
      
      expect(result.summary.highestUsageDay).toBeDefined();
      expect(result.summary.highestUsageDay?.usage).toBe(8750.3);
      expect(result.summary.highestUsageDay?.customerName).toBe('Tech Solutions LLC');
      expect(result.summary.highestUsageDay?.customerId).toBe('005');
      expect(result.summary.highestUsageDay?.date).toBe('2024-01');
    });

    it('should handle threshold analysis correctly', () => {
      const threshold = 1000;
      const result: ProcessedData = CSVProcessor.processCSVContent(sampleCSVContent, threshold);

      expect(result.thresholdAnalysis).toBeDefined();
      expect(result.thresholdAnalysis?.usageColumn).toBe('Usage (kWh)');
      expect(result.thresholdAnalysis?.rowsAboveThreshold).toBe(3);
      expect(result.thresholdAnalysis?.percentageAboveThreshold).toBe('60.0');
    });

    it('should handle CSV with invalid rows', () => {
      const threshold = 1000;
      const result: ProcessedData = CSVProcessor.processCSVContent(invalidCSVContent, threshold);

      expect(result.totalRows).toBe(0); // No valid rows (both have wrong number of columns)
      expect(result.invalidRows).toBe(2); // Two invalid rows
    });

    it('should handle CSV without usage columns', () => {
      const csvWithoutUsage = `Name,Location
John Smith,Portland
Sarah Johnson,Beaverton`;
      
      const threshold = 1000;
      const result: ProcessedData = CSVProcessor.processCSVContent(csvWithoutUsage, threshold);

      expect(result.usageColumns).toHaveLength(0);
      expect(result.thresholdAnalysis).toBeNull();
      expect(result.summary.totalDaysProcessed).toBe(2);
      expect(result.summary.daysExceedingThreshold).toBe(0);
      expect(result.summary.highestUsageDay).toBeNull();
      expect(result.summary.totalUsage).toBe(0);
      expect(result.summary.averageUsage).toBe(0);
    });

    it('should throw error for empty CSV', () => {
      expect(() => {
        CSVProcessor.processCSVContent('', 1000);
      }).toThrow('CSV file appears to be empty');
    });

    it('should handle CSV with only headers', () => {
      const headersOnly = 'Customer ID,Name,Usage (kWh)';
      const result: ProcessedData = CSVProcessor.processCSVContent(headersOnly, 1000);

      expect(result.totalRows).toBe(0);
      expect(result.summary.totalDaysProcessed).toBe(0);
    });

    it('should correctly identify different usage column patterns', () => {
      const csvVariations = [
        'ID,Consumption,Date\n1,100,2024-01',
        'ID,Amount,Date\n1,200,2024-01',
        'ID,kWh_Usage,Date\n1,300,2024-01',
        'ID,Energy_Units,Date\n1,400,2024-01'
      ];

      csvVariations.forEach(csv => {
        const result = CSVProcessor.processCSVContent(csv, 50);
        expect(result.usageColumns.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateCSVFile', () => {
    it('should accept valid CSV files', () => {
      expect(() => {
        CSVProcessor.validateCSVFile('test.csv', 1024);
      }).not.toThrow();
    });

    it('should reject non-CSV files', () => {
      expect(() => {
        CSVProcessor.validateCSVFile('test.txt', 1024);
      }).toThrow('Invalid file type. Please upload a CSV file.');
    });

    it('should reject files over 10MB', () => {
      const oversizeFile = 11 * 1024 * 1024; // 11MB
      expect(() => {
        CSVProcessor.validateCSVFile('test.csv', oversizeFile);
      }).toThrow('File size exceeds 10MB limit.');
    });

    it('should accept CSV files with different casing', () => {
      expect(() => {
        CSVProcessor.validateCSVFile('TEST.CSV', 1024);
      }).not.toThrow();
    });
  });

  describe('validateThreshold', () => {
    it('should accept valid positive numbers', () => {
      expect(() => {
        CSVProcessor.validateThreshold(100);
      }).not.toThrow();

      expect(() => {
        CSVProcessor.validateThreshold(0);
      }).not.toThrow();
    });

    it('should reject negative numbers', () => {
      expect(() => {
        CSVProcessor.validateThreshold(-10);
      }).toThrow('Threshold must be a positive number');
    });

    it('should reject NaN values', () => {
      expect(() => {
        CSVProcessor.validateThreshold(NaN);
      }).toThrow('Threshold must be a valid number');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle CSV with mixed valid and invalid usage values', () => {
      const mixedCSV = `ID,Usage
1,100.5
2,invalid
3,200.3
4,
5,75.0`;

      const result = CSVProcessor.processCSVContent(mixedCSV, 100);
      
      // Should process valid numeric values only
      expect(result.summary.totalDaysProcessed).toBe(4); // All rows (it processes invalid as 0)
      expect(result.summary.totalUsage).toBe(375.8); // 100.5 + 200.3 + 75.0
      expect(result.summary.daysExceedingThreshold).toBe(2); // 100.5 and 200.3
    });

    it('should handle very large numbers', () => {
      const largeNumberCSV = `ID,Usage
1,999999.99
2,1000000.01`;

      const result = CSVProcessor.processCSVContent(largeNumberCSV, 1000000);
      expect(result.summary.daysExceedingThreshold).toBe(1);
      expect(result.summary.highestUsageDay?.usage).toBe(1000000.01);
    });

    it('should handle decimal precision correctly', () => {
      const decimalCSV = `ID,Usage
1,123.456789
2,987.654321`;

      const result = CSVProcessor.processCSVContent(decimalCSV, 500);
      expect(result.summary.totalUsage).toBe(1111.11); // Rounded to 2 decimal places
      expect(result.summary.averageUsage).toBe(555.56); // Rounded to 2 decimal places
    });
  });
}); 