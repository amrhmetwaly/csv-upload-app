#!/bin/bash

# Get the API Gateway REST API ID
API_ID=$(aws apigateway get-rest-apis --query 'items[?starts_with(name, `ServerlessRestApi`)].id' --output text)

if [ -z "$API_ID" ]; then
    echo "Error: Could not find API Gateway"
    exit 1
fi

# Construct the endpoint URL
REGION="us-west-2"
STAGE="Prod"
ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}"
UPLOAD_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE}/energy/upload"

echo "🚀 AWS Deployment Complete!"
echo ""
echo "📍 API Gateway Endpoint: ${ENDPOINT}"
echo "📤 Upload Endpoint: ${UPLOAD_ENDPOINT}"
echo ""

# Save deployment info
cat > deployment-info.json << EOF
{
  "environment": "dev",
  "region": "${REGION}",
  "apiGatewayId": "${API_ID}",
  "apiGatewayUrl": "${ENDPOINT}",
  "uploadEndpoint": "${UPLOAD_ENDPOINT}",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "✅ Deployment info saved to deployment-info.json"
echo ""
echo "Next steps:"
echo "1. Run: cd .. && node scripts/update-frontend.js"
echo "2. Test with: npm run dev:aws" 