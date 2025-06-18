# Quick Start Guide - AWS Deployment

## 🔧 Step 1: Fix AWS Credentials

Your AWS credentials are currently invalid. Choose one of these options:

### Option A: Configure AWS CLI (Recommended for Demo)
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region: `us-west-2`
- Default output format: `json`

### Option B: Set credentials directly
```bash
aws configure set aws_access_key_id YOUR_ACCESS_KEY
aws configure set aws_secret_access_key YOUR_SECRET_KEY
aws configure set region us-west-2
```

### Option C: AWS SSO (if using SSO)
```bash
aws sso login
```

## ✅ Step 2: Test Your Credentials
```bash
aws sts get-caller-identity
```
You should see your account ID and user info.

## 🚀 Step 3: Deploy the Infrastructure
```bash
# Quick deployment with defaults
./scripts/deploy-aws.sh

# Or with custom options
./scripts/deploy-aws.sh -e dev -r us-west-2 -s csv-upload-dev
```

## 🔄 Step 4: Update Your Frontend
```bash
# This will automatically update your Next.js app to use the AWS endpoint
node scripts/update-frontend.js
```

## 🧪 Step 5: Test the Deployment
```bash
# Test your Next.js app with AWS backend
npm run dev:aws

# Or test the AWS endpoint directly
npm run test:aws
```

## 🎯 What Gets Deployed

✅ **API Gateway** - RESTful endpoint for CSV uploads
✅ **Lambda Function** - Node.js/TypeScript CSV processor  
✅ **S3 Bucket** - Secure file storage
✅ **DynamoDB Table** - Metadata and analytics storage
✅ **CloudFormation Stack** - Infrastructure as Code
✅ **IAM Roles** - Secure permissions

## 📊 Expected Output

After successful deployment, you'll see:
- API Gateway endpoint URL
- S3 bucket name
- DynamoDB table name
- Lambda function name
- CloudFormation stack name

## 🆘 Common Issues

### Invalid Credentials
```bash
aws configure  # Re-enter your credentials
```

### Region Issues
```bash
aws configure set region us-west-2
```

### SAM CLI Issues
```bash
brew install aws-sam-cli  # macOS
```

### Permissions Issues
- Ensure your AWS user has: `AWSLambdaFullAccess`, `AmazonS3FullAccess`, `AmazonDynamoDBFullAccess`, `AmazonAPIGatewayAdministrator`

## 🎉 Success!

Once deployed, your CSV upload app will have:
- **Serverless backend** processing CSV files
- **Automatic scaling** based on demand  
- **Secure file storage** in S3
- **Analytics storage** in DynamoDB
- **Production-ready** infrastructure

Your Next.js app will seamlessly use the AWS backend while maintaining the same user experience! 