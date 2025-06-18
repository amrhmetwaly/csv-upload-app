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

export interface ProcessedData {
  totalRows: number;
  invalidRows: number;
  headers: string[];
  usageColumns: string[];
  threshold: number;
  thresholdAnalysis: {
    usageColumn: string;
    rowsAboveThreshold: number;
    percentageAboveThreshold: string;
  } | null;
  summary: SummaryData;
}

export interface LambdaResponse {
  statusCode: number;
  headers: {
    'Content-Type': string;
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Methods': string;
    'Access-Control-Allow-Headers': string;
  };
  body: string;
}

export interface UploadResponse {
  message: string;
  data: {
    fileName: string;
    fileSize: string;
    uploadedAt: string;
    s3Key?: string;
    dynamoDbId?: string;
  } & ProcessedData;
}

export interface ErrorResponse {
  error: string;
}

export interface S3UploadResult {
  key: string;
  bucket: string;
  location: string;
}

export interface DynamoDbRecord {
  id: string;
  fileName: string;
  uploadedAt: string;
  threshold: number;
  processedData: ProcessedData;
  s3Key: string;
  fileSize: number;
} 