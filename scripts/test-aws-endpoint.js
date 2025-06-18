#!/usr/bin/env node

// Test script for AWS CSV upload endpoint
// Generated at: 2025-06-17T23:00:07.125Z

const https = require('https');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const ENDPOINT = 'https://d25gvf0ekg.execute-api.us-west-2.amazonaws.com/Prod/energy/upload';
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
