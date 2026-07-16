/**
 * Pexels Integration Test Script
 * Tests all Pexels API endpoints with authentication
 */

const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

// Test credentials (update these with valid credentials)
const TEST_USER = {
  email: 'admin@digitpenhub.com',
  password: 'admin123' // Update with actual password
};

let authCookie = '';

async function login() {
  console.log('🔐 Logging in...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER, {
      withCredentials: true
    });
    
    // Extract cookie from response
    const cookies = response.headers['set-cookie'];
    if (cookies && cookies.length > 0) {
      authCookie = cookies[0].split(';')[0];
      console.log('✅ Login successful\n');
      return true;
    }
    
    console.log('❌ No auth cookie received\n');
    return false;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testEndpoint(name, url, method = 'GET', data = null) {
  console.log(`\n📡 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Cookie': authCookie
      },
      withCredentials: true
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (response.data.success) {
      console.log('✅ Success');
      
      // Show sample data
      if (response.data.data) {
        if (response.data.data.photos) {
          console.log(`   📸 Photos returned: ${response.data.data.photos.length}`);
          if (response.data.data.photos.length > 0) {
            const photo = response.data.data.photos[0];
            console.log(`   📷 Sample: "${photo.alt}" by ${photo.photographer}`);
          }
        } else if (Array.isArray(response.data.data)) {
          console.log(`   📦 Items returned: ${response.data.data.length}`);
        } else {
          console.log(`   📦 Data:`, JSON.stringify(response.data.data).substring(0, 100) + '...');
        }
      }
      
      return true;
    } else {
      console.log('⚠️  Request succeeded but returned success: false');
      console.log('   Message:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Failed');
    console.log('   Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Pexels Integration Test Suite\n');
  console.log('='.repeat(50));
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    console.log('💡 Update TEST_USER credentials in this script');
    process.exit(1);
  }
  
  const results = {
    passed: 0,
    failed: 0
  };
  
  // Test 1: Status endpoint (public)
  console.log('\n' + '='.repeat(50));
  console.log('TEST 1: Status Check (Public)');
  console.log('='.repeat(50));
  const statusResult = await testEndpoint(
    'Pexels Status',
    '/pexels/status'
  );
  statusResult ? results.passed++ : results.failed++;
  
  // Test 2: Categories
  console.log('\n' + '='.repeat(50));
  console.log('TEST 2: Categories');
  console.log('='.repeat(50));
  const categoriesResult = await testEndpoint(
    'Get Categories',
    '/pexels/categories'
  );
  categoriesResult ? results.passed++ : results.failed++;
  
  // Test 3: Curated photos
  console.log('\n' + '='.repeat(50));
  console.log('TEST 3: Curated Photos');
  console.log('='.repeat(50));
  const curatedResult = await testEndpoint(
    'Get Curated Photos',
    '/pexels/curated?page=1&perPage=5'
  );
  curatedResult ? results.passed++ : results.failed++;
  
  // Test 4: Search photos
  console.log('\n' + '='.repeat(50));
  console.log('TEST 4: Search Photos');
  console.log('='.repeat(50));
  const searchResult = await testEndpoint(
    'Search Photos (business)',
    '/pexels/search?query=business&perPage=5'
  );
  searchResult ? results.passed++ : results.failed++;
  
  // Test 5: Search with orientation
  console.log('\n' + '='.repeat(50));
  console.log('TEST 5: Search with Filters');
  console.log('='.repeat(50));
  const searchFilterResult = await testEndpoint(
    'Search Photos (landscape orientation)',
    '/pexels/search?query=nature&perPage=5&orientation=landscape'
  );
  searchFilterResult ? results.passed++ : results.failed++;
  
  // Test 6: Category photos
  console.log('\n' + '='.repeat(50));
  console.log('TEST 6: Category Photos');
  console.log('='.repeat(50));
  const categoryResult = await testEndpoint(
    'Get Category Photos (business)',
    '/pexels/category/business?perPage=5'
  );
  categoryResult ? results.passed++ : results.failed++;
  
  // Test 7: Popular photos
  console.log('\n' + '='.repeat(50));
  console.log('TEST 7: Popular Photos');
  console.log('='.repeat(50));
  const popularResult = await testEndpoint(
    'Get Popular Photos',
    '/pexels/popular?perPage=5'
  );
  popularResult ? results.passed++ : results.failed++;
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Pexels integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Test in browser: https://suite.digitpenhub.com/builder');
  console.log('   2. Click "Add Image" or "Stock Photos" button');
  console.log('   3. Search for photos and verify results appear');
  console.log('   4. Select a photo and verify it\'s inserted correctly');
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error.message);
  process.exit(1);
});
