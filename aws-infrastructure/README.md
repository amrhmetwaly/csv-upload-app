# AWS Infrastructure

This directory contains the AWS infrastructure components for the CSV Upload Application, built using AWS SAM (Serverless Application Model) and CloudFormation.

## 🏗️ Architecture Overview

The application deploys a serverless architecture on AWS consisting of:

- **API Gateway**: RESTful API endpoint for CSV file uploads
- **Lambda Function**: Node.js 20.x runtime for processing CSV files
- **S3 Bucket**: Secure storage for uploaded CSV files
- **DynamoDB**: NoSQL database for storing file metadata and processing results
- **CloudWatch**: Logging and monitoring

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   API Gateway    │───▶│   Lambda        │
│   (Next.js)     │    │                  │    │   Function      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                       ┌─────────────────┐              │
                       │   CloudWatch    │◀─────────────┤
                       │   Logs          │              │
                       └─────────────────┘              │
                                                         │
                       ┌─────────────────┐              │
                       │   S3 Bucket     │◀─────────────┤
                       │   (CSV Storage) │              │
                       └─────────────────┘              │
                                                         │
                       ┌─────────────────┐              │
                       │   DynamoDB      │◀─────────────┘
                       │   (Metadata)    │
                       └─────────────────┘
```

## 📁 Directory Structure

```
aws-infrastructure/
├── cloudformation/
│   ├── template.yaml          # SAM CloudFormation template
│   └── samconfig.toml         # SAM configuration file
├── lambda/
│   ├── src/
│   │   ├── index.ts          # Lambda handler function
│   │   ├── awsServices.ts    # AWS SDK service wrappers
│   │   └── types.ts          # TypeScript type definitions
│   ├── __tests__/            # Jest test files
│   ├── package.json          # Lambda dependencies
│   └── tsconfig.json         # TypeScript configuration
├── deployment/
│   └── lambda-function.zip   # Built Lambda deployment package
├── deployment-info.json      # Current deployment information
├── get-endpoint.sh          # Script to retrieve API endpoints
└── README.md               # This file
```

## 🚀 Deployment

### Prerequisites

- AWS CLI configured with appropriate permissions
- AWS SAM CLI installed
- Node.js 20+ and npm

### Quick Deploy

1. **Deploy from project root:**
   ```bash
   ./scripts/deploy-aws.sh
   ```

2. **Get API endpoints:**
   ```bash
   cd aws-infrastructure
   ./get-endpoint.sh
   ```

3. **Update frontend configuration:**
   ```bash
   cd ..
   node scripts/update-frontend.js
   ```

### Manual Deployment Steps

1. **Build the Lambda function:**
   ```bash
   cd lambda
   npm install
   npm run build
   npm run package
   ```

2. **Deploy with SAM:**
   ```bash
   cd cloudformation
   sam deploy
   ```

3. **Retrieve endpoints:**
   ```bash
   cd ..
   ./get-endpoint.sh
   ```

## 🔧 Configuration

### Environment Variables

The Lambda function uses these environment variables (automatically set by CloudFormation):

- `DYNAMODB_TABLE_NAME`: DynamoDB table for metadata storage
- `S3_BUCKET_NAME`: S3 bucket for CSV file storage
- `NODE_ENV`: Environment (dev/staging/prod)

### SAM Configuration (`samconfig.toml`)

```toml
stack_name = "csv-analyzer"
region = "us-west-2"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "Environment=\"dev\" CorsOrigin=\"*\""
```

### CloudFormation Parameters

- `Environment`: Deployment environment (dev/staging/prod)
- `CorsOrigin`: CORS origin for API Gateway (default: "*")

## 📊 AWS Resources Created

### S3 Bucket
- **Name**: `csv-upload-{environment}-{account-id}`
- **Encryption**: AES256
- **Lifecycle**: Files deleted after 30 days
- **Access**: Private (no public access)

### DynamoDB Table
- **Name**: `csv-uploads-{environment}`
- **Billing**: Pay-per-request
- **Primary Key**: `id` (String)
- **GSI**: `UploadedAtIndex` on `uploadedAt`
- **Features**: Point-in-time recovery enabled

### Lambda Function
- **Name**: `csv-processor-{environment}`
- **Runtime**: Node.js 20.x
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Handler**: `dist/index.handler`

### API Gateway
- **Type**: REST API
- **Endpoint**: `/energy/upload` (POST)
- **CORS**: Enabled for cross-origin requests
- **Integration**: Lambda proxy integration

## 🧪 Testing

### Lambda Function Tests

```bash
cd lambda
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Integration Testing

```bash
# From project root
node scripts/test-aws-endpoint.js
node scripts/check-aws-data.js
```

## 📝 API Usage

### Upload Endpoint

**POST** `/energy/upload`

**Content-Type**: `multipart/form-data`

**Form Fields**:
- `file`: CSV file (required)
- `threshold`: Usage threshold in kWh (required)

**Example Response**:
```json
{
  "message": "CSV file processed successfully!",
  "data": {
    "fileName": "energy-usage.csv",
    "fileSize": "2.3 KB",
    "uploadedAt": "2024-01-15T10:30:00.000Z",
    "s3Key": "uploads/energy-usage-12345.csv",
    "dynamoDbId": "uuid-string",
    "processedRows": 100,
    "highUsageCount": 15,
    "statistics": {
      "mean": 250.5,
      "median": 230.0,
      "max": 450.2,
      "min": 120.1
    }
  }
}
```

## 🔍 Monitoring

### CloudWatch Logs

- **Log Group**: `/aws/lambda/csv-processor-{environment}`
- **Retention**: 14 days
- **Access**: AWS Console → CloudWatch → Log Groups

### DynamoDB Monitoring

- **Metrics**: Read/Write capacity units, throttles, errors
- **Access**: AWS Console → DynamoDB → Tables → Monitoring

### S3 Monitoring

- **Metrics**: Storage usage, requests, data retrieval
- **Access**: AWS Console → S3 → Metrics

## 🛠️ Development

### Local Development

The Lambda function shares utilities with the frontend application:

```typescript
// Shared utilities from main application
const { CSVProcessingEngine } = require('../../../src/utils/csvProcessor');
const { FileValidator, ThresholdValidator } = require('../../../src/utils/validation');
```

### Building and Packaging

```bash
cd lambda
npm run build      # Compile TypeScript
npm run package    # Create deployment zip
```

## 🔒 Security

- **S3 Bucket**: Private access only, server-side encryption enabled
- **DynamoDB**: Point-in-time recovery, encryption at rest
- **Lambda**: Minimal IAM permissions (read/write to specific resources only)
- **API Gateway**: CORS configured, no authentication (as per requirements)

## 🧹 Cleanup

To remove all AWS resources:

```bash
aws cloudformation delete-stack --stack-name csv-analyzer
```

## 📚 Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html) 