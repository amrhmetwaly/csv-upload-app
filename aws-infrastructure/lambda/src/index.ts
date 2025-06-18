import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CSVProcessor } from './csvProcessor';
import { AWSServices } from './awsServices';
import { LambdaResponse, UploadResponse, ErrorResponse } from './types';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed. Use POST to upload files.' })
    };
  }

  try {
    // Parse multipart form data
    const { fileContent, fileName, fileSize, threshold } = parseMultipartFormData(event);

    // Validate inputs
    CSVProcessor.validateCSVFile(fileName, fileSize);
    CSVProcessor.validateThreshold(threshold);

    // Process CSV content
    const processedData = CSVProcessor.processCSVContent(fileContent, threshold);

    // Initialize AWS services
    const awsServices = new AWSServices();

    // Upload to S3
    const s3Result = await awsServices.uploadToS3(fileContent, fileName);

    // Save metadata to DynamoDB
    const dynamoDbId = await awsServices.saveToDynamoDB(
      fileName,
      fileSize,
      threshold,
      processedData,
      s3Result.key
    );

    // Prepare success response
    const response: UploadResponse = {
      message: 'CSV file processed successfully!',
      data: {
        fileName,
        fileSize: `${(fileSize / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toISOString(),
        s3Key: s3Result.key,
        dynamoDbId,
        ...processedData
      }
    };

    console.log('Processing completed successfully:', response);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error processing upload:', error);

    let errorMessage = 'An unexpected error occurred while processing your file.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Set appropriate status codes for different error types
      if (error.message.includes('Invalid') || 
          error.message.includes('Threshold') || 
          error.message.includes('file type') ||
          error.message.includes('file size') ||
          error.message.includes('empty')) {
        statusCode = 400;
      }
    }

    const errorResponse: ErrorResponse = {
      error: errorMessage
    };

    return {
      statusCode,
      headers: corsHeaders,
      body: JSON.stringify(errorResponse)
    };
  }
};

// Helper function to parse multipart form data from API Gateway event
function parseMultipartFormData(event: APIGatewayProxyEvent): {
  fileContent: string;
  fileName: string;
  fileSize: number;
  threshold: number;
} {
  const contentType = event.headers['Content-Type'] || event.headers['content-type'] || '';
  
  if (!contentType.includes('multipart/form-data')) {
    throw new Error('Content-Type must be multipart/form-data');
  }

  // Extract boundary from Content-Type header
  const boundaryMatch = contentType.match(/boundary=([^;]+)/);
  if (!boundaryMatch) {
    throw new Error('Missing boundary in multipart form data');
  }

  const boundary = boundaryMatch[1];
  const body = event.isBase64Encoded ? 
    Buffer.from(event.body || '', 'base64').toString('utf-8') : 
    event.body || '';

  // Parse multipart sections
  const sections = body.split(`--${boundary}`);
  
  let fileContent = '';
  let fileName = '';
  let fileSize = 0;
  let threshold = 0;

  for (const section of sections) {
    if (section.includes('Content-Disposition')) {
      const lines = section.split('\r\n');
      const dispositionLine = lines.find(line => line.includes('Content-Disposition'));
      
      if (!dispositionLine) continue;

      // Extract field name
      const nameMatch = dispositionLine.match(/name="([^"]+)"/);
      if (!nameMatch) continue;

      const fieldName = nameMatch[1];
      
      // Find the start of content (after double CRLF)
      const contentStartIndex = section.indexOf('\r\n\r\n');
      if (contentStartIndex === -1) continue;

      const content = section.substring(contentStartIndex + 4).trim();

      if (fieldName === 'file') {
        // Extract filename
        const filenameMatch = dispositionLine.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          fileName = filenameMatch[1];
          fileContent = content;
          fileSize = Buffer.byteLength(content, 'utf-8');
        }
      } else if (fieldName === 'threshold') {
        threshold = parseFloat(content);
      }
    }
  }

  // Validate extracted data
  if (!fileName) {
    throw new Error('No file provided');
  }

  if (!fileContent) {
    throw new Error('File content is empty');
  }

  if (!threshold && threshold !== 0) {
    throw new Error('Usage threshold is required');
  }

  return { fileContent, fileName, fileSize, threshold };
} 