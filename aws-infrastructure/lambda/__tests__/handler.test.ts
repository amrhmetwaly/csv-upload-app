import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../src/index';

// Mock AWS services
jest.mock('../src/awsServices', () => {
  return {
    AWSServices: jest.fn().mockImplementation(() => ({
      uploadToS3: jest.fn().mockResolvedValue({ key: 'test-key', bucket: 'test-bucket', location: 'test-location' }),
      saveToDynamoDB: jest.fn().mockResolvedValue('test-id')
    }))
  };
});

describe('Lambda Handler', () => {
  const mockEvent: Partial<APIGatewayProxyEvent> = {
    httpMethod: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=----boundary123'
    },
    body: `------boundary123\r\nContent-Disposition: form-data; name="file"; filename="test.csv"\r\nContent-Type: text/csv\r\n\r\nCustomer ID,Usage (kWh)\n001,1250.5\n002,890.2\r\n------boundary123\r\nContent-Disposition: form-data; name="threshold"\r\n\r\n1000\r\n------boundary123--`,
    isBase64Encoded: false
  };

  it('should handle valid CSV upload successfully', async () => {
    const result = await handler(mockEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.message).toBe('CSV file processed successfully!');
    expect(body.data).toBeDefined();
    expect(body.data.fileName).toBe('test.csv');
    expect(body.data.summary).toBeDefined();
    expect(body.data.summary.totalDaysProcessed).toBe(2);
  });

  it('should handle OPTIONS request for CORS', async () => {
    const optionsEvent: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'OPTIONS'
    };

    const result = await handler(optionsEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
    expect(result.body).toBe('');
  });

  it('should reject non-POST methods', async () => {
    const getEvent: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET'
    };

    const result = await handler(getEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(405);
    
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Method not allowed. Use POST to upload files.');
  });

  it('should handle invalid file type', async () => {
    const invalidFileEvent: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=----boundary123'
      },
      body: `------boundary123\r\nContent-Disposition: form-data; name="file"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\nsome text\r\n------boundary123\r\nContent-Disposition: form-data; name="threshold"\r\n\r\n1000\r\n------boundary123--`,
      isBase64Encoded: false
    };

    const result = await handler(invalidFileEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    
    const body = JSON.parse(result.body);
    expect(body.error).toContain('Invalid file type');
  });

  it('should handle missing threshold', async () => {
    const noThresholdEvent: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=----boundary123'
      },
      body: `------boundary123\r\nContent-Disposition: form-data; name="file"; filename="test.csv"\r\nContent-Type: text/csv\r\n\r\nCustomer ID,Usage\n001,1250.5\r\n------boundary123--`,
      isBase64Encoded: false
    };

    const result = await handler(noThresholdEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200); // Threshold defaults to 0 when missing
    
    const body = JSON.parse(result.body);
    expect(body.message).toBe('CSV file processed successfully!');
  });

  it('should handle malformed multipart data', async () => {
    const malformedEvent: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{"test": "data"}',
      isBase64Encoded: false
    };

    const result = await handler(malformedEvent as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(500); // Server error due to parsing issue
    
    const body = JSON.parse(result.body);
    expect(body.error).toContain('Content-Type must be multipart/form-data');
  });
}); 