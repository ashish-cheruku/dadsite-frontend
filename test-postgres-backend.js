#!/usr/bin/env node
/**
 * Test script to verify frontend compatibility with PostgreSQL backend
 * Run this script to test basic API connectivity after migration
 */

const axios = require('axios');

// Use the same API URL configuration as the frontend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1821';

console.log('🔍 Testing Frontend-Backend Connectivity');
console.log(`📡 Backend URL: ${API_URL}`);
console.log('=' .repeat(50));

async function testConnection() {
  try {
    // Test 1: Basic API connectivity
    console.log('1. Testing basic API connectivity...');
    const response = await axios.get(`${API_URL}/`);
    console.log('   ✅ Backend is accessible');
    console.log(`   📋 Response: ${response.data.message}`);
    
    // Test 2: Test announcements endpoint (public endpoint)
    console.log('\n2. Testing announcements endpoint...');
    try {
      const announcementsResponse = await axios.get(`${API_URL}/announcements`);
      console.log('   ✅ Announcements endpoint working');
      console.log(`   📊 Found ${announcementsResponse.data.length} announcements`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('   ⚠️  Announcements endpoint requires authentication (expected)');
      } else {
        throw error;
      }
    }
    
    // Test 3: Test faculty endpoint (public endpoint)
    console.log('\n3. Testing faculty endpoint...');
    try {
      const facultyResponse = await axios.get(`${API_URL}/faculty`);
      console.log('   ✅ Faculty endpoint working');
      console.log(`   👨‍🏫 Found ${facultyResponse.data.length} faculty members`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('   ⚠️  Faculty endpoint requires authentication (expected)');
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 All tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the frontend: npm start');
    console.log('   2. Login with principal credentials');
    console.log('   3. Test all functionality through the UI');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:');
    if (error.code === 'ECONNREFUSED') {
      console.error('   🔌 Cannot connect to backend. Make sure it\'s running on port 1821');
      console.error('   🚀 Start backend with: uvicorn app.main:app --reload --host 0.0.0.0 --port 1821');
    } else if (error.response) {
      console.error(`   📡 HTTP ${error.response.status}: ${error.response.statusText}`);
      console.error(`   📄 Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   🐛 Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the test
testConnection(); 