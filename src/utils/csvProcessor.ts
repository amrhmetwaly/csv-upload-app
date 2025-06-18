import { 
  ProcessedData, 
  SummaryData, 
  UsageRecord, 
  ThresholdAnalysis,
  VALIDATION_PATTERNS 
} from '../types/shared';
import { CSVValidator } from './validation';

export class CSVProcessingEngine {
  static processCSVContent(fileContent: string, threshold: number): ProcessedData {
    // Validate and parse CSV structure
    const { headers, rows } = CSVValidator.validateCSVStructure(fileContent);
    
    // Filter valid rows
    const validRows = rows.filter(row => 
      CSVValidator.validateRowStructure(row, headers.length)
    );

    // Identify column types
    const columnAnalysis = this.analyzeColumns(headers);
    
    // Generate summary data
    const summary = this.generateSummary(
      validRows, 
      headers, 
      columnAnalysis, 
      threshold
    );

    // Analyze threshold if usage columns exist
    const thresholdAnalysis = columnAnalysis.usageColumns.length > 0
      ? this.analyzeThreshold(validRows, headers, columnAnalysis.usageColumns[0], threshold)
      : null;

    return {
      totalRows: validRows.length,
      invalidRows: rows.length - validRows.length,
      headers,
      usageColumns: columnAnalysis.usageColumns,
      threshold,
      thresholdAnalysis,
      summary
    };
  }

  private static analyzeColumns(headers: string[]): {
    usageColumns: string[];
    dateColumns: string[];
    customerNameIndex: number;
    customerIdIndex: number;
  } {
    const usageColumns = headers.filter(header => 
      VALIDATION_PATTERNS.USAGE_COLUMNS.test(header)
    );

    const dateColumns = headers.filter(header => 
      VALIDATION_PATTERNS.DATE_COLUMNS.test(header)
    );

    const customerNameIndex = headers.findIndex(h => 
      VALIDATION_PATTERNS.CUSTOMER_NAME.test(h)
    );

    const customerIdIndex = headers.findIndex(h => 
      VALIDATION_PATTERNS.CUSTOMER_ID.test(h)
    );

    return {
      usageColumns,
      dateColumns,
      customerNameIndex,
      customerIdIndex
    };
  }

  private static generateSummary(
    validRows: string[], 
    headers: string[], 
    columnAnalysis: ReturnType<typeof CSVProcessingEngine.analyzeColumns>,
    threshold: number
  ): SummaryData {
    if (columnAnalysis.usageColumns.length === 0) {
      return {
        totalDaysProcessed: validRows.length,
        daysExceedingThreshold: 0,
        highestUsageDay: null,
        totalUsage: 0,
        averageUsage: 0
      };
    }

    const usageColumnIndex = headers.indexOf(columnAnalysis.usageColumns[0]);
    const dateColumnIndex = columnAnalysis.dateColumns.length > 0 
      ? headers.indexOf(columnAnalysis.dateColumns[0]) 
      : -1;

    const usageRecords: UsageRecord[] = [];
    let totalUsage = 0;
    let daysExceedingThreshold = 0;
    let highestUsageRecord: UsageRecord | null = null;

    validRows.forEach((row, index) => {
      const cells = row.split(',').map(cell => cell.trim());
      const usage = parseFloat(cells[usageColumnIndex] || '0');
      
      if (!isNaN(usage)) {
        const date = dateColumnIndex >= 0 
          ? cells[dateColumnIndex] || `Row ${index + 1}` 
          : `Row ${index + 1}`;
        
        const customerName = columnAnalysis.customerNameIndex >= 0 
          ? cells[columnAnalysis.customerNameIndex] 
          : undefined;
        
        const customerId = columnAnalysis.customerIdIndex >= 0 
          ? cells[columnAnalysis.customerIdIndex] 
          : undefined;

        const record: UsageRecord = {
          date,
          usage,
          customerName,
          customerId
        };

        usageRecords.push(record);
        totalUsage += usage;

        if (usage > threshold) {
          daysExceedingThreshold++;
        }

        if (!highestUsageRecord || usage > highestUsageRecord.usage) {
          highestUsageRecord = record;
        }
      } else {
        // Still count invalid usage as a processed day but with 0 usage
        const date = dateColumnIndex >= 0 
          ? cells[dateColumnIndex] || `Row ${index + 1}` 
          : `Row ${index + 1}`;
        
        usageRecords.push({
          date,
          usage: 0,
          customerName: columnAnalysis.customerNameIndex >= 0 
            ? cells[columnAnalysis.customerNameIndex] 
            : undefined,
          customerId: columnAnalysis.customerIdIndex >= 0 
            ? cells[columnAnalysis.customerIdIndex] 
            : undefined
        });
      }
    });

    const averageUsage = usageRecords.length > 0 ? totalUsage / usageRecords.length : 0;

    return {
      totalDaysProcessed: usageRecords.length,
      daysExceedingThreshold,
      highestUsageDay: highestUsageRecord,
      totalUsage: Math.round(totalUsage * 100) / 100, // Round to 2 decimal places
      averageUsage: Math.round(averageUsage * 100) / 100 // Round to 2 decimal places
    };
  }

  private static analyzeThreshold(
    validRows: string[], 
    headers: string[], 
    usageColumn: string, 
    threshold: number
  ): ThresholdAnalysis {
    const usageColumnIndex = headers.indexOf(usageColumn);
    const aboveThreshold = validRows.filter(row => {
      const cells = row.split(',');
      const value = parseFloat(cells[usageColumnIndex]?.trim() || '0');
      return !isNaN(value) && value > threshold;
    });

    return {
      usageColumn,
      rowsAboveThreshold: aboveThreshold.length,
      percentageAboveThreshold: validRows.length > 0 
        ? ((aboveThreshold.length / validRows.length) * 100).toFixed(1)
        : '0.0'
    };
  }

  static formatFileSize(sizeInBytes: number): string {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  static generateUploadTimestamp(): string {
    return new Date().toISOString();
  }
} 