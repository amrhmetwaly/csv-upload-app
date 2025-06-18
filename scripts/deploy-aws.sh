#!/bin/bash

# CSV Upload App - AWS Deployment Script
# This script deploys the Lambda function and CloudFormation stack

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
REGION="us-west-2"
STACK_NAME=""
CORS_ORIGIN="*"
PROFILE=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show help
show_help() {
    echo "AWS Deployment Script for CSV Upload Application"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment    Environment (dev, staging, prod) [default: dev]"
    echo "  -r, --region         AWS region [default: us-west-2]"
    echo "  -s, --stack-name     CloudFormation stack name [default: csv-upload-{env}]"
    echo "  -c, --cors-origin    CORS origin URL [default: *]"
    echo "  -p, --profile        AWS CLI profile name"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --environment dev --region us-west-2"
    echo "  $0 -e prod -r us-east-1 -c https://myapp.com"
    echo "  $0 --profile my-aws-profile"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -s|--stack-name)
            STACK_NAME="$2"
            shift 2
            ;;
        -c|--cors-origin)
            CORS_ORIGIN="$2"
            shift 2
            ;;
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option $1"
            show_help
            exit 1
            ;;
    esac
done

# Set default stack name if not provided
if [ -z "$STACK_NAME" ]; then
    STACK_NAME="csv-upload-$ENVIRONMENT"
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_error "Environment must be one of: dev, staging, prod"
    exit 1
fi

# Set AWS CLI profile if provided
AWS_CLI_ARGS=""
if [ ! -z "$PROFILE" ]; then
    AWS_CLI_ARGS="--profile $PROFILE"
fi

print_status "Starting AWS deployment..."
print_status "Environment: $ENVIRONMENT"
print_status "Region: $REGION"
print_status "Stack Name: $STACK_NAME"
print_status "CORS Origin: $CORS_ORIGIN"

# Check AWS CLI installation
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check SAM CLI installation
if ! command -v sam &> /dev/null; then
    print_warning "SAM CLI is not installed. Installing it now..."
    
    # Try to install SAM CLI - prefer Homebrew on macOS
    if [[ "$OSTYPE" == "darwin"* ]] && command -v brew &> /dev/null; then
        print_status "Installing SAM CLI via Homebrew..."
        brew install aws-sam-cli
    elif command -v pip3 &> /dev/null; then
        print_status "Installing SAM CLI via pip3..."
        # Try pip3 with --user flag to avoid system package conflicts
        pip3 install --user aws-sam-cli || {
            print_warning "pip3 install failed, trying with --break-system-packages..."
            pip3 install --break-system-packages aws-sam-cli || {
                print_error "Failed to install SAM CLI via pip3."
                print_error "Please install SAM CLI manually:"
                print_error "  macOS: brew install aws-sam-cli"
                print_error "  Linux: pip3 install --user aws-sam-cli"
                print_error "  Or visit: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html"
                exit 1
            }
        }
    else
        print_error "Neither Homebrew nor pip3 found. Please install SAM CLI manually:"
        print_error "  macOS: brew install aws-sam-cli"
        print_error "  Linux: pip3 install --user aws-sam-cli"
        print_error "  Or visit: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html"
        exit 1
    fi
    
    # Verify installation
    if ! command -v sam &> /dev/null; then
        print_error "SAM CLI installation failed or not in PATH"
        print_error "Please restart your terminal and try again, or install manually"
        exit 1
    fi
    
    print_success "SAM CLI installed successfully!"
fi

# Check if running from correct directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Create necessary directories
mkdir -p aws-infrastructure/deployment
mkdir -p aws-infrastructure/lambda/dist

print_status "Building Lambda function..."

# Navigate to Lambda directory and install dependencies
cd aws-infrastructure/lambda

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    print_status "Installing Lambda dependencies..."
    npm install
fi

# Build TypeScript
print_status "Compiling TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    print_error "TypeScript compilation failed"
    exit 1
fi

# Package Lambda function
print_status "Packaging Lambda function..."
npm run package

if [ $? -ne 0 ]; then
    print_error "Lambda packaging failed"
    exit 1
fi

# Return to project root
cd ../..

# Validate CloudFormation template
print_status "Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://aws-infrastructure/cloudformation/template.yaml \
    --region $REGION \
    $AWS_CLI_ARGS

if [ $? -ne 0 ]; then
    print_error "CloudFormation template validation failed"
    exit 1
fi

print_success "Template validation passed"

# Deploy with SAM
print_status "Deploying infrastructure with SAM..."

sam deploy \
    --template-file aws-infrastructure/cloudformation/template.yaml \
    --stack-name $STACK_NAME \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --region $REGION \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
        CorsOrigin=$CORS_ORIGIN \
    --s3-prefix $STACK_NAME \
    --confirm-changeset \
    $AWS_CLI_ARGS

if [ $? -ne 0 ]; then
    print_error "Deployment failed"
    exit 1
fi

print_success "Deployment completed successfully!"

# Get stack outputs
print_status "Retrieving deployment information..."

OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs' \
    --output json \
    $AWS_CLI_ARGS)

# Extract key information
API_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="ApiGatewayUrl") | .OutputValue')
UPLOAD_ENDPOINT=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="UploadEndpoint") | .OutputValue')
S3_BUCKET=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="S3BucketName") | .OutputValue')
DYNAMODB_TABLE=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="DynamoDBTableName") | .OutputValue')

# Save deployment information
cat > aws-infrastructure/deployment-info.json << EOF
{
  "environment": "$ENVIRONMENT",
  "region": "$REGION",
  "stackName": "$STACK_NAME",
  "apiUrl": "$API_URL",
  "uploadEndpoint": "$UPLOAD_ENDPOINT",
  "s3Bucket": "$S3_BUCKET",
  "dynamodbTable": "$DYNAMODB_TABLE",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

# Display results
echo ""
print_success "🚀 Deployment Summary"
echo "========================="
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Stack Name: $STACK_NAME"
echo ""
echo "📍 Endpoints:"
echo "API Gateway URL: $API_URL"
echo "Upload Endpoint: $UPLOAD_ENDPOINT"
echo ""
echo "📦 Resources:"
echo "S3 Bucket: $S3_BUCKET"
echo "DynamoDB Table: $DYNAMODB_TABLE"
echo ""
print_status "Deployment information saved to: aws-infrastructure/deployment-info.json"
echo ""
print_warning "Next steps:"
echo "1. Update your frontend to use the new upload endpoint"
echo "2. Test the deployment with a sample CSV file"
echo "3. Monitor CloudWatch logs for any issues"
echo ""
print_success "Deployment completed! 🎉" 