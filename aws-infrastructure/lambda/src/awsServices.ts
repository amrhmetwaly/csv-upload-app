import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { S3UploadResult, DynamoDbRecord, ProcessedData } from './types';

export class AWSServices {
  private s3Client: S3Client;
  private dynamoDbClient: DynamoDBDocumentClient;
  private bucketName: string;
  private tableName: string;

  constructor() {
    // AWS Lambda automatically sets AWS_REGION, but we can't set it as env var
    // The SDK will use the Lambda function's region by default
    const region = process.env.AWS_REGION || 'us-west-2';
    
    // Configure S3 client with explicit region and proper endpoint configuration
    this.s3Client = new S3Client({ 
      region,
      forcePathStyle: false, // Use virtual-hosted-style URLs
      useAccelerateEndpoint: false,
      useGlobalEndpoint: false
    });
    
    const ddbClient = new DynamoDBClient({ region });
    this.dynamoDbClient = DynamoDBDocumentClient.from(ddbClient);
    
    this.bucketName = process.env.S3_BUCKET_NAME || 'csv-upload-bucket';
    this.tableName = process.env.DYNAMODB_TABLE_NAME || 'csv-uploads';
    
    // Log configuration for debugging
    console.log(`AWS Services initialized with region: ${region}, bucket: ${this.bucketName}, table: ${this.tableName}`);
  }

  async uploadToS3(
    fileContent: string, 
    fileName: string, 
    contentType: string = 'text/csv'
  ): Promise<S3UploadResult> {
    const key = `uploads/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        'original-filename': fileName
      }
    });

    try {
      console.log(`Attempting to upload to S3 bucket: ${this.bucketName}, key: ${key}`);
      await this.s3Client.send(command);
      
      const region = process.env.AWS_REGION || 'us-west-2';
      const location = `https://${this.bucketName}.s3.${region}.amazonaws.com/${key}`;
      console.log(`Successfully uploaded to S3: ${location}`);
      
      return {
        key,
        bucket: this.bucketName,
        location
      };
    } catch (error) {
      console.error('S3 upload error details:', {
        bucketName: this.bucketName,
        key,
        region: process.env.AWS_REGION || 'us-west-2',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: (error as any)?.Code,
        errorMessage: (error as any)?.message,
        stackTrace: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveToDynamoDB(
    fileName: string,
    fileSize: number,
    threshold: number,
    processedData: ProcessedData,
    s3Key: string
  ): Promise<string> {
    const id = uuidv4();
    const uploadedAt = new Date().toISOString();

    const record: DynamoDbRecord = {
      id,
      fileName,
      uploadedAt,
      threshold,
      processedData,
      s3Key,
      fileSize
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: record
    });

    try {
      await this.dynamoDbClient.send(command);
      return id;
    } catch (error) {
      console.error('DynamoDB save error:', error);
      throw new Error(`Failed to save record to DynamoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Utility method to get S3 presigned URL for downloads (if needed later)
  getS3ObjectUrl(key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }
} 