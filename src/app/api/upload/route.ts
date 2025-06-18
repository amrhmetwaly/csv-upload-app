import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const threshold = formData.get('threshold') as string;

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit.' },
        { status: 400 }
      );
    }

    // Validate threshold
    if (!threshold) {
      return NextResponse.json(
        { error: 'Usage threshold is required' },
        { status: 400 }
      );
    }

    const thresholdNum = parseFloat(threshold);
    if (isNaN(thresholdNum)) {
      return NextResponse.json(
        { error: 'Threshold must be a valid number' },
        { status: 400 }
      );
    }

    if (thresholdNum < 0) {
      return NextResponse.json(
        { error: 'Threshold must be a positive number' },
        { status: 400 }
      );
    }

    // Read and validate CSV content
    const fileContent = await file.text();
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return NextResponse.json(
        { error: 'CSV file appears to be empty' },
        { status: 400 }
      );
    }

    // Basic CSV structure validation
    const headers = lines[0].split(',').map(h => h.trim());
    if (headers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid CSV format: No headers found' },
        { status: 400 }
      );
    }

    // Process CSV data (example processing)
    const dataRows = lines.slice(1);
    const validRows = dataRows.filter(row => {
      const cells = row.split(',');
      return cells.length === headers.length;
    });

    // Look for potential usage columns (common patterns)
    const usageColumns = headers.filter(header => 
      /usage|consumption|amount|quantity|value|kwh|units/i.test(header)
    );

    let processedData = {
      totalRows: validRows.length,
      invalidRows: dataRows.length - validRows.length,
      headers: headers,
      usageColumns: usageColumns,
      threshold: thresholdNum,
      thresholdAnalysis: null as any
    };

    // Analyze data against threshold if usage columns are found
    if (usageColumns.length > 0) {
      const usageColumnIndex = headers.indexOf(usageColumns[0]);
      const aboveThreshold = validRows.filter(row => {
        const cells = row.split(',');
        const value = parseFloat(cells[usageColumnIndex]?.trim() || '0');
        return !isNaN(value) && value > thresholdNum;
      });

      processedData.thresholdAnalysis = {
        usageColumn: usageColumns[0],
        rowsAboveThreshold: aboveThreshold.length,
        percentageAboveThreshold: ((aboveThreshold.length / validRows.length) * 100).toFixed(1)
      };
    }

    // Log processing details (in a real app, you might save to database)
    console.log('CSV Processing completed:', {
      fileName: file.name,
      fileSize: file.size,
      threshold: thresholdNum,
      processedData
    });

    // Return success response with processing results
    return NextResponse.json({
      message: 'CSV file processed successfully!',
      data: {
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        uploadedAt: new Date().toISOString(),
        ...processedData
      }
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Invalid CSV')) {
        return NextResponse.json(
          { error: 'Invalid CSV format. Please check your file structure.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your file. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to upload files.' },
    { status: 405 }
  );
} 