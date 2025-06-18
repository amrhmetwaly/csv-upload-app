# AWS Deployment Guide for CSV Upload Application

This guide will walk you through deploying your CSV upload application to AWS using API Gateway + Lambda architecture.

## 🏗️ Architecture Overview

**Why Node.js/TypeScript was chosen over Python FastAPI:**

✅ **Node.js/TypeScript Advantages:**
- **Code Consistency**: Same language across your entire stack (Next.js frontend + Lambda backend)
- **Code Reuse**: Share types, utilities, and validation logic between frontend and backend
- **Developer Experience**: Single toolchain and dependency management
- **Cold Start Performance**: Node.js Lambda functions typically start faster than Python
- **Deployment Simplicity**: JavaScript bundles are easier to package and optimize

## 📋 Prerequisites

Before starting, ensure you have:

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws configure list
   ```

2. **SAM CLI installed**
   ```bash
   sam --version
   ```

3. **Node.js and npm**
   ```bash
   node --version
   npm --version
   ```

4. **jq for JSON processing** (for the deployment script)
   ```bash
   # macOS
   brew install jq
   
   # Ubuntu/Debian
   sudo apt-get install jq
   ```

## 🚀 Quick Deployment

For a quick deployment to the `dev` environment:

```bash
# 1. Deploy AWS infrastructure
./scripts/deploy-aws.sh

# 2. Update frontend to use AWS endpoints
node scripts/update-frontend.js
```

## 📖 Step-by-Step Deployment

### Step 1: Configure AWS Credentials

```bash
# Configure AWS CLI (if not already done)
aws configure

# Or use a specific profile
aws configure --profile my-aws-profile
```

### Step 2: Deploy AWS Infrastructure

The deployment script supports multiple environments and configurations:

```bash
# Deploy to dev environment (default)
./scripts/deploy-aws.sh

# Deploy to production with specific settings
./scripts/deploy-aws.sh \
  --environment prod \
  --region us-east-1 \
  --cors-origin https://your-domain.com \
  --profile production-profile

# See all available options
./scripts/deploy-aws.sh --help
```

**What gets deployed:**
- 🪣 **S3 Bucket**: Stores uploaded CSV files securely
- 📊 **DynamoDB Table**: Stores upload metadata and processing results
- ⚡ **Lambda Function**: Processes CSV uploads with the same logic as your Next.js API
- 🌐 **API Gateway**: Exposes the `/energy/upload` endpoint
- 🔒 **IAM Roles**: Proper permissions for Lambda to access S3 and DynamoDB

### Step 3: Update Frontend Configuration

After successful deployment, update your frontend:

```bash
# This automatically updates your Next.js app to use AWS endpoints
node scripts/update-frontend.js
```

**What gets updated:**
- Creates `src/config/env.ts` with dynamic endpoint configuration
- Updates your `page.tsx` to use the AWS endpoint
- Creates `.env.local` for development configuration
- Adds new npm scripts for easier development

### Step 4: Test the Deployment

```bash
# Test the AWS endpoint directly
npm run test:aws

# Run your app with AWS endpoints
npm run dev:aws

# Or run locally during development
npm run dev:local
```

## 🛠️ Development Workflow

### Local Development
```bash
# Use local Next.js API during development
npm run dev:local
```

### AWS Testing
```bash
# Use AWS endpoints for testing
npm run dev:aws
```

### Direct AWS Testing
```bash
# Test AWS endpoint without the frontend
npm run test:aws
```

## 📂 Project Structure After Deployment

```
csv-upload-app/
├── aws-infrastructure/
│   ├── lambda/                    # Lambda function code
│   │   ├── src/
│   │   │   ├── index.ts          # Main Lambda handler
│   │   │   ├── csvProcessor.ts   # CSV processing logic
│   │   │   ├── awsServices.ts    # S3 and DynamoDB utilities
│   │   │   └── types.ts          # TypeScript interfaces
│   │   ├── package.json          # Lambda dependencies
│   │   └── tsconfig.json         # TypeScript config
│   ├── cloudformation/
│   │   └── template.yaml         # Infrastructure as Code
│   ├── deployment/
│   │   └── lambda-function.zip   # Packaged Lambda function
│   └── deployment-info.json      # Deployment metadata
├── scripts/
│   ├── deploy-aws.sh            # Deployment script
│   ├── update-frontend.js       # Frontend update script
│   └── test-aws-endpoint.js     # AWS endpoint test script
├── src/
│   ├── config/
│   │   └── env.ts               # Environment configuration
│   └── app/
│       └── page.tsx             # Updated with AWS integration
└── .env.local                   # Development environment variables
```

## 🔧 Configuration Options

### Environment Variables

**Frontend (`.env.local`):**
```bash
# Set to 'true' to use local API during development
USE_LOCAL_API=true

# AWS Information (for reference)
AWS_REGION=us-west-2
AWS_ENVIRONMENT=dev
AWS_API_ENDPOINT=https://xxx.execute-api.us-west-2.amazonaws.com/dev/energy/upload
```

**Lambda (set automatically by CloudFormation):**
- `S3_BUCKET_NAME`: S3 bucket for CSV storage
- `DYNAMODB_TABLE_NAME`: DynamoDB table for metadata
- `AWS_REGION`: AWS region

### Deployment Environments

| Environment | Description | Use Case |
|-------------|-------------|----------|
| `dev` | Development environment | Testing and development |
| `staging` | Pre-production environment | QA and integration testing |
| `prod` | Production environment | Live application |

## 🐛 Troubleshooting

### Common Issues

**1. "SAM CLI not found"**
```bash
# Install SAM CLI
pip3 install aws-sam-cli
# or
brew install aws-sam-cli
```

**2. "AWS credentials not configured"**
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

**3. "Permission denied" on scripts**
```bash
chmod +x scripts/deploy-aws.sh scripts/update-frontend.js
```

**4. "Stack already exists" error**
```bash
# Delete the existing stack first
aws cloudformation delete-stack --stack-name csv-upload-dev --region us-west-2
```

**5. Lambda function timeout**
- The function timeout is set to 30 seconds
- For large CSV files, consider increasing the timeout in `template.yaml`

### Monitoring and Logs

**CloudWatch Logs:**
```bash
# View Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/csv-processor"

# Tail logs in real-time
sam logs --stack-name csv-upload-dev --tail
```

**API Gateway Logs:**
- Enable logging in the API Gateway console
- Monitor request/response patterns

## 🔄 Updating Your Deployment

### Update Lambda Code
```bash
# After making changes to Lambda code
./scripts/deploy-aws.sh --environment dev
```

### Update Frontend Configuration
```bash
# After deployment changes
node scripts/update-frontend.js
```

## 🧹 Cleanup

To remove all AWS resources:

```bash
# Delete the CloudFormation stack
aws cloudformation delete-stack --stack-name csv-upload-dev --region us-west-2

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete --stack-name csv-upload-dev --region us-west-2
```

## 💰 Cost Considerations

**Estimated monthly costs for moderate usage:**
- **Lambda**: ~$1-5/month (based on execution time)
- **API Gateway**: ~$1-3/month (based on API calls)
- **S3**: ~$1-5/month (based on storage and requests)
- **DynamoDB**: ~$1-3/month (on-demand pricing)

**Total estimated cost: $4-16/month**

## 🔐 Security Features

- **S3 Bucket**: Private with encryption at rest
- **API Gateway**: CORS configured for your domain
- **IAM Roles**: Least-privilege access for Lambda
- **DynamoDB**: Point-in-time recovery enabled
- **Lambda**: Secure environment variables

## 📈 Performance Optimizations

- **Lambda Memory**: 512MB (configurable in template.yaml)
- **Lambda Timeout**: 30 seconds
- **S3 Lifecycle**: Files auto-deleted after 30 days
- **DynamoDB**: On-demand billing for cost efficiency
- **API Gateway Caching**: Can be enabled for better performance

## 🤝 Next Steps

1. **Monitor your deployment** using CloudWatch
2. **Set up alerts** for errors or high usage
3. **Configure custom domain** for API Gateway
4. **Implement additional features** like file validation, webhooks, etc.
5. **Set up CI/CD pipeline** for automated deployments

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review CloudWatch logs for error details
3. Verify AWS permissions and quotas
4. Test with the provided test script

**Happy deploying! 🚀** 