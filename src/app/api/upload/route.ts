import { NextRequest, NextResponse } from 'next/server';
import { FileValidator, ThresholdValidator, ValidationError, createDetailedError } from '../../../utils/validation';
import { CSVProcessingEngine } from '../../../utils/csvProcessor';
import { UploadResponse, ErrorResponse } from '../../../types/shared';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const thresholdStr = formData.get('threshold') as string;

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate file and threshold using shared validators
    FileValidator.validateFile(file);
    const threshold = ThresholdValidator.validateThresholdString(thresholdStr);

    // Read and validate CSV content
    const fileContent = await file.text();
    FileValidator.validateFileContent(fileContent);

    // Process CSV using shared processing engine
    const processedData = CSVProcessingEngine.processCSVContent(fileContent, threshold);

    // Log processing details (in a real app, you might save to database)
    console.log('CSV Processing completed:', {
      fileName: file.name,
      fileSize: file.size,
      threshold,
      processedData
    });

    // Return success response with processing results
    const response: UploadResponse = {
      message: 'CSV file processed successfully!',
      data: {
        fileName: file.name,
        fileSize: CSVProcessingEngine.formatFileSize(file.size),
        uploadedAt: CSVProcessingEngine.generateUploadTimestamp(),
        ...processedData
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error processing upload:', error);
    
    const errorDetails = createDetailedError(error);
    
    // Handle validation errors
    if (error instanceof ValidationError) {
      const errorResponse: ErrorResponse = {
        error: errorDetails.message,
        code: errorDetails.code
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Handle other errors
    const errorResponse: ErrorResponse = {
      error: errorDetails.message || 'An unexpected error occurred while processing your file. Please try again.',
      details: process.env.NODE_ENV === 'development' ? errorDetails.details : undefined
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  const errorResponse: ErrorResponse = {
    error: 'Method not allowed. Use POST to upload files.',
    code: 'METHOD_NOT_ALLOWED'
  };
  
  return NextResponse.json(errorResponse, { status: 405 });
} 