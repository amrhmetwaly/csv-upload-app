#!/usr/bin/env node

// This script helps you check what's stored in AWS DynamoDB and S3
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');

// Configuration from your CloudFormation
const config = {
  region: 'us-west-2',  // Change to your region
  tableName: 'csv-uploads-dev',  // Change based on your environment
  bucketName: 'csv-upload-dev-123456789012',  // Change to your actual bucket name
  environment: 'dev'
};

class AWSDataChecker {
  constructor() {
    this.dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.region }));
    this.s3Client = new S3Client({ region: config.region });
  }

  async checkDynamoDBRecords() {
    console.log('🗄️  Checking DynamoDB records...');
    console.log(`   Table: ${config.tableName}`);
    
    try {
      const command = new ScanCommand({
        TableName: config.tableName,
        Limit: 10  // Get last 10 records
      });

      const result = await this.dynamoClient.send(command);
      
      if (result.Items && result.Items.length > 0) {
        console.log(`\n✅ Found ${result.Items.length} records:`);
        console.log('=====================================');
        
        result.Items.forEach((item, index) => {
          console.log(`\n📄 Record ${index + 1}:`);
          console.log(`   ID: ${item.id}`);
          console.log(`   File: ${item.fileName}`);
          console.log(`   Uploaded: ${new Date(item.uploadedAt).toLocaleString()}`);
          console.log(`   Threshold: ${item.threshold}`);
          console.log(`   File Size: ${item.fileSize} bytes`);
          console.log(`   S3 Key: ${item.s3Key}`);
          
          if (item.processedData) {
            console.log(`   Processed Rows: ${item.processedData.totalRows}`);
            console.log(`   Invalid Rows: ${item.processedData.invalidRows}`);
            
            if (item.processedData.thresholdAnalysis) {
              console.log(`   Above Threshold: ${item.processedData.thresholdAnalysis.rowsAboveThreshold} rows`);
            }
            
            if (item.processedData.summary) {
              console.log(`   Total Usage: ${item.processedData.summary.totalUsage} units`);
              console.log(`   Average Usage: ${item.processedData.summary.averageUsage} units`);
            }
          }
        });
        
        console.log(`\n📊 Total records in table: ${result.Count}`);
        if (result.LastEvaluatedKey) {
          console.log('📝 More records available (showing first 10)');
        }
        
      } else {
        console.log('\n📭 No records found in DynamoDB table');
        console.log('💡 This could mean:');
        console.log('   - No files have been processed yet');
        console.log('   - The table name is incorrect');
        console.log('   - AWS credentials are not configured');
      }
      
    } catch (error) {
      console.error('\n❌ Error checking DynamoDB:', error.message);
      
      if (error.name === 'ResourceNotFoundException') {
        console.log('💡 Table not found. Check if:');
        console.log(`   - Table name is correct: ${config.tableName}`);
        console.log('   - CloudFormation stack is deployed');
        console.log('   - Region is correct');
      } else if (error.name === 'UnrecognizedClientException') {
        console.log('💡 AWS credentials issue. Make sure:');
        console.log('   - AWS credentials are configured (aws configure)');
        console.log('   - IAM permissions include DynamoDB access');
      }
    }
  }

  async checkS3Files() {
    console.log('\n📁 Checking S3 files...');
    console.log(`   Bucket: ${config.bucketName}`);
    
    try {
      const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: 'uploads/',
        MaxKeys: 10
      });

      const result = await this.s3Client.send(command);
      
      if (result.Contents && result.Contents.length > 0) {
        console.log(`\n✅ Found ${result.Contents.length} files:`);
        console.log('=====================================');
        
        result.Contents.forEach((file, index) => {
          console.log(`\n📄 File ${index + 1}:`);
          console.log(`   Key: ${file.Key}`);
          console.log(`   Size: ${(file.Size / 1024).toFixed(1)} KB`);
          console.log(`   Modified: ${file.LastModified.toLocaleString()}`);
        });
        
      } else {
        console.log('\n📭 No files found in S3 bucket');
        console.log('💡 This could mean:');
        console.log('   - No files have been uploaded yet');
        console.log('   - The bucket name is incorrect');
        console.log('   - AWS credentials are not configured');
      }
      
    } catch (error) {
      console.error('\n❌ Error checking S3:', error.message);
      
      if (error.name === 'NoSuchBucket') {
        console.log('💡 Bucket not found. Check if:');
        console.log(`   - Bucket name is correct: ${config.bucketName}`);
        console.log('   - CloudFormation stack is deployed');
        console.log('   - Region is correct');
      }
    }
  }

  async getFileContent(s3Key) {
    console.log(`\n📖 Getting file content for: ${s3Key}`);
    
    try {
      const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: s3Key
      });

      const result = await this.s3Client.send(command);
      const content = await result.Body.transformToString();
      
      console.log('\n📄 File Content:');
      console.log('================');
      console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
      
      return content;
    } catch (error) {
      console.error('❌ Error getting file content:', error.message);
    }
  }

  async showLatestProcessing() {
    console.log('\n🔍 Getting latest processing details...');
    
    try {
      // Get the most recent record
      const command = new ScanCommand({
        TableName: config.tableName,
        Limit: 1,
        ScanIndexForward: false  // Latest first
      });

      const result = await this.dynamoClient.send(command);
      
      if (result.Items && result.Items.length > 0) {
        const latest = result.Items[0];
        console.log('\n🎯 Latest Processing Result:');
        console.log('===========================');
        console.log(JSON.stringify(latest, null, 2));
        
        // Also get the file content
        if (latest.s3Key) {
          await this.getFileContent(latest.s3Key);
        }
      }
    } catch (error) {
      console.error('❌ Error getting latest processing:', error.message);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const showHelp = args.includes('--help') || args.includes('-h');
  const showLatest = args.includes('--latest') || args.includes('-l');

  if (showHelp) {
    console.log(`
🔍 AWS Data Checker
==================

This script checks your AWS DynamoDB and S3 data to see processing results.

Usage:
  node scripts/check-aws-data.js [options]

Options:
  --latest, -l    Show detailed view of latest processing result
  --help, -h      Show this help message

Configuration:
  Edit the config object at the top of this script to match your AWS setup:
  - region: ${config.region}
  - tableName: ${config.tableName}  
  - bucketName: ${config.bucketName}

Prerequisites:
  - AWS CLI configured (aws configure)
  - DynamoDB and S3 read permissions
  - CloudFormation stack deployed
`);
    return;
  }

  console.log('🚀 Starting AWS Data Check...');
  console.log(`📍 Region: ${config.region}`);
  console.log(`🗄️  Table: ${config.tableName}`);
  console.log(`📁 Bucket: ${config.bucketName}`);

  const checker = new AWSDataChecker();

  if (showLatest) {
    await checker.showLatestProcessing();
  } else {
    await checker.checkDynamoDBRecords();
    await checker.checkS3Files();
  }

  console.log('\n✅ AWS Data Check Complete!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AWSDataChecker }; 