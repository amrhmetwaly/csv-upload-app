#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function printStatus(message) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
}

function printSuccess(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

function printError(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

// Read deployment info
function readDeploymentInfo() {
  const deploymentInfoPath = path.join(__dirname, '..', 'aws-infrastructure', 'deployment-info.json');
  
  try {
    if (!fs.existsSync(deploymentInfoPath)) {
      throw new Error('Deployment info file not found. Please run the deployment script first.');
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
    
    if (!deploymentInfo.uploadEndpoint) {
      throw new Error('Upload endpoint not found in deployment info.');
    }
    
    return deploymentInfo;
  } catch (error) {
    printError(`Failed to read deployment info: ${error.message}`);
    process.exit(1);
  }
}

// Create environment config file
function createEnvConfig(deploymentInfo) {
  const envConfigPath = path.join(__dirname, '..', 'src', 'config', 'env.ts');
  const configDir = path.dirname(envConfigPath);
  
  // Create config directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const envConfig = `// Auto-generated environment configuration
// Generated at: ${new Date().toISOString()}

export interface EnvConfig {
  apiEndpoint: string;
  environment: string;
  region: string;
  useLocalApi: boolean;
}

const config: EnvConfig = {
  apiEndpoint: '${deploymentInfo.uploadEndpoint}',
  environment: '${deploymentInfo.environment}',
  region: '${deploymentInfo.region}',
  useLocalApi: process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_API === 'true'
};

export default config;

// Helper function to get the correct API endpoint
export function getApiEndpoint(): string {
  if (config.useLocalApi) {
    return '/api/upload';
  }
  return config.apiEndpoint;
}
`;

  fs.writeFileSync(envConfigPath, envConfig);
  printSuccess(`Environment config created: ${envConfigPath}`);
}

// Update the frontend page to use the new endpoint
function updateFrontendPage() {
  const pagePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
  
  try {
    let pageContent = fs.readFileSync(pagePath, 'utf8');
    
    // Check if config import already exists
    if (!pageContent.includes("import { getApiEndpoint }")) {
      // Add import at the top
      const importLine = "import { getApiEndpoint } from '../config/env';\n";
      const importIndex = pageContent.indexOf("'use client';") + "'use client';\n\n".length;
      pageContent = pageContent.slice(0, importIndex) + importLine + pageContent.slice(importIndex);
    }
    
    // Replace the hardcoded API endpoint
    const oldFetchPattern = /const response = await fetch\('\/api\/upload'/g;
    const newFetchPattern = "const response = await fetch(getApiEndpoint()";
    
    if (oldFetchPattern.test(pageContent)) {
      pageContent = pageContent.replace(oldFetchPattern, newFetchPattern);
      fs.writeFileSync(pagePath, pageContent);
      printSuccess('Frontend page updated to use dynamic API endpoint');
    } else {
      printWarning('Could not find the API endpoint pattern to replace. You may need to update manually.');
    }
    
  } catch (error) {
    printError(`Failed to update frontend page: ${error.message}`);
  }
}

// Create .env.local file for development
function createEnvFile(deploymentInfo) {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  const envContent = `# AWS Configuration
# Generated at: ${new Date().toISOString()}

# Set to 'true' to use local API during development
USE_LOCAL_API=true

# AWS Information (for reference)
AWS_REGION=${deploymentInfo.region}
AWS_ENVIRONMENT=${deploymentInfo.environment}
AWS_API_ENDPOINT=${deploymentInfo.uploadEndpoint}
AWS_S3_BUCKET=${deploymentInfo.s3Bucket}
AWS_DYNAMODB_TABLE=${deploymentInfo.dynamodbTable}
`;

  fs.writeFileSync(envPath, envContent);
  printSuccess('Environment file created: .env.local');
}

// Create a test script
function createTestScript(deploymentInfo) {
  const testScriptPath = path.join(__dirname, 'test-aws-endpoint.js');
  
  const testScript = `#!/usr/bin/env node

// Test script for AWS CSV upload endpoint
// Generated at: ${new Date().toISOString()}

const https = require('https');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const ENDPOINT = '${deploymentInfo.uploadEndpoint}';
const SAMPLE_CSV_PATH = path.join(__dirname, '..', 'public', 'sample-usage-data.csv');

async function testUpload() {
  console.log('🧪 Testing AWS CSV Upload Endpoint...');
  console.log('Endpoint:', ENDPOINT);
  
  try {
    // Check if sample CSV exists
    if (!fs.existsSync(SAMPLE_CSV_PATH)) {
      throw new Error('Sample CSV file not found');
    }
    
    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream(SAMPLE_CSV_PATH));
    form.append('threshold', '1000');
    
    // Make request
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      body: form
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Test successful!');
      console.log('Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Test failed:');
      console.log('Status:', response.status);
      console.log('Error:', result);
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

// Run the test
testUpload();
`;

  fs.writeFileSync(testScriptPath, testScript);
  fs.chmodSync(testScriptPath, '755'); // Make executable
  printSuccess('Test script created: scripts/test-aws-endpoint.js');
}

// Update package.json scripts
function updatePackageJson() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add new scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      'deploy:aws': './scripts/deploy-aws.sh',
      'update:frontend': 'node scripts/update-frontend.js',
      'test:aws': 'node scripts/test-aws-endpoint.js',
      'dev:local': 'USE_LOCAL_API=true npm run dev',
      'dev:aws': 'USE_LOCAL_API=false npm run dev'
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    printSuccess('Package.json scripts updated');
    
  } catch (error) {
    printError(`Failed to update package.json: ${error.message}`);
  }
}

// Main execution
function main() {
  console.log('🚀 Updating frontend to use AWS endpoints...\n');
  
  // Read deployment information
  const deploymentInfo = readDeploymentInfo();
  
  printStatus(`Deployment Environment: ${deploymentInfo.environment}`);
  printStatus(`Upload Endpoint: ${deploymentInfo.uploadEndpoint}`);
  printStatus(`Deployed At: ${deploymentInfo.deployedAt}`);
  console.log('');
  
  // Create configuration files
  createEnvConfig(deploymentInfo);
  createEnvFile(deploymentInfo);
  
  // Update frontend code
  updateFrontendPage();
  
  // Create test script
  createTestScript(deploymentInfo);
  
  // Update package.json
  updatePackageJson();
  
  console.log('');
  printSuccess('🎉 Frontend update completed!');
  console.log('');
  printWarning('Next steps:');
  console.log('1. Run `npm run dev:aws` to test with AWS endpoints');
  console.log('2. Run `npm run dev:local` to use local API during development');
  console.log('3. Run `npm run test:aws` to test the AWS endpoint directly');
  console.log('4. Deploy your frontend with the updated configuration');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  readDeploymentInfo,
  createEnvConfig,
  updateFrontendPage,
  main
}; 