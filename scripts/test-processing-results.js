#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const config = {
  // Change this to your endpoint
  localEndpoint: 'http://localhost:3000/api/upload',
  awsEndpoint: 'https://d25gvf0ekg.execute-api.us-west-2.amazonaws.com/Prod/energy/upload',
  testFile: path.join(__dirname, '../public/sample-usage-data.csv'),
  threshold: 1000
};

async function testProcessing(useAWS = false) {
  const endpoint = useAWS ? config.awsEndpoint : config.localEndpoint;
  console.log(`🚀 Testing ${useAWS ? 'AWS' : 'Local'} endpoint: ${endpoint}`);
  
  try {
    // Check if test file exists
    if (!fs.existsSync(config.testFile)) {
      console.error('❌ Test file not found:', config.testFile);
      console.log('📝 Creating a sample CSV file...');
      
      const sampleCsv = `Customer ID,Name,Usage (kWh),Billing Period,Rate Plan,Location
1001,John Smith,1200,2024-01,Residential,Portland
1002,Jane Doe,850,2024-01,Residential,Salem
1003,Bob Johnson,1500,2024-01,Commercial,Eugene
1004,Alice Brown,950,2024-01,Residential,Bend
1005,Charlie Wilson,2000,2024-01,Industrial,Portland
1006,Diana Lee,750,2024-01,Residential,Corvallis
1007,Frank Miller,1800,2024-01,Commercial,Medford
1008,Grace Taylor,900,2024-01,Residential,Astoria
1009,Henry Davis,2500,2024-01,Industrial,Salem
1010,Ivy Chen,800,2024-01,Residential,Eugene`;
      
      fs.writeFileSync(config.testFile, sampleCsv);
      console.log('✅ Sample CSV file created:', config.testFile);
    }

    // Prepare form data
    const form = new FormData();
    form.append('file', fs.createReadStream(config.testFile));
    form.append('threshold', config.threshold.toString());

    console.log('📤 Uploading file...');
    console.log(`   File: ${path.basename(config.testFile)}`);
    console.log(`   Threshold: ${config.threshold}`);

    // Make request
    const response = await fetch(endpoint, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const result = await response.json();

    console.log('\n📊 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      console.log('\n✅ SUCCESS! Processing Results:');
      console.log('=====================================');
      console.log(JSON.stringify(result, null, 2));
      
      // Extract key information
      if (result.data) {
        console.log('\n🔍 Key Insights:');
        console.log('================');
        console.log(`📁 File: ${result.data.fileName} (${result.data.fileSize})`);
        console.log(`📊 Rows Processed: ${result.data.totalRows}`);
        console.log(`❌ Invalid Rows: ${result.data.invalidRows}`);
        console.log(`🎯 Threshold: ${result.data.threshold} units`);
        
        if (result.data.thresholdAnalysis) {
          console.log(`⚡ Usage Column: ${result.data.thresholdAnalysis.usageColumn}`);
          console.log(`🔥 Above Threshold: ${result.data.thresholdAnalysis.rowsAboveThreshold} rows (${result.data.thresholdAnalysis.percentageAboveThreshold}%)`);
        }
        
        if (result.data.summary) {
          console.log(`📈 Total Usage: ${result.data.summary.totalUsage} units`);
          console.log(`📊 Average Usage: ${result.data.summary.averageUsage} units`);
          console.log(`📅 Days Processed: ${result.data.summary.totalDaysProcessed}`);
          console.log(`⚠️  Days Exceeding Threshold: ${result.data.summary.daysExceedingThreshold}`);
          
          if (result.data.summary.highestUsageDay) {
            console.log(`🏆 Highest Usage: ${result.data.summary.highestUsageDay.usage} units on ${result.data.summary.highestUsageDay.date}`);
          }
        }
      }
    } else {
      console.log('\n❌ ERROR! Processing Failed:');
      console.log('==================================');
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('\n💥 Request Failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Troubleshooting:');
      console.log('- Make sure your Next.js dev server is running: npm run dev');
      console.log('- Check if the endpoint URL is correct');
    }
  }
}

// Command line usage
async function main() {
  const args = process.argv.slice(2);
  const useAWS = args.includes('--aws') || args.includes('-a');
  const showHelp = args.includes('--help') || args.includes('-h');

  if (showHelp) {
    console.log(`
🧪 CSV Processing Test Script
=============================

Usage:
  node scripts/test-processing-results.js [options]

Options:
  --aws, -a     Test AWS endpoint instead of local
  --help, -h    Show this help message

Examples:
  node scripts/test-processing-results.js           # Test local endpoint
  node scripts/test-processing-results.js --aws     # Test AWS endpoint
`);
    return;
  }

  await testProcessing(useAWS);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testProcessing }; 