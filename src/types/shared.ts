export interface CSVRow {
  'Customer ID': string;
  'Name': string;
  'Usage (kWh)': string;
  'Billing Month': string;
  'Rate Plan': string;
  'Location': string;
}

export interface UsageRecord {
  date: string;
  usage: number;
  customerName?: string;
  customerId?: string;
}

export interface SummaryData {
  totalDaysProcessed: number;
  daysExceedingThreshold: number;
  highestUsageDay: UsageRecord | null;
  totalUsage: number;
  averageUsage: number;
}

export interface ThresholdAnalysis {
  usageColumn: string;
  rowsAboveThreshold: number;
  percentageAboveThreshold: string;
}

export interface ProcessedData {
  totalRows: number;
  invalidRows: number;
  headers: string[];
  usageColumns: string[];
  threshold: number;
  thresholdAnalysis: ThresholdAnalysis | null;
  summary: SummaryData;
}

export interface FileUploadData {
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  s3Key?: string;
  dynamoDbId?: string;
}

export interface UploadResponse {
  message: string;
  data: FileUploadData & ProcessedData;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: string;
}

export interface AlertMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  id?: string;
}

// Re-export constants from centralized config
export { FILE_UPLOAD as FILE_CONSTRAINTS, PATTERNS as VALIDATION_PATTERNS } from '../config/constants';

export const ERROR_CODES = {
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_THRESHOLD: 'INVALID_THRESHOLD',
  EMPTY_FILE: 'EMPTY_FILE',
  INVALID_CSV_FORMAT: 'INVALID_CSV_FORMAT',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  UPLOAD_ERROR: 'UPLOAD_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]; 