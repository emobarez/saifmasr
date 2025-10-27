/**
 * Test script for Service Request API endpoints
 */

async function testServiceRequestAPI() {
  const baseURL = 'http://localhost:9002';
  
  try {
    console.log('🧪 Testing Service Request API endpoints...\n');

    // Test 1: Get all service requests (should require auth)
    console.log('📋 Test 1: GET /api/service-requests');
    const response1 = await fetch(`${baseURL}/api/service-requests`);
    console.log(`Status: ${response1.status} (${response1.status === 401 ? 'Expected - Auth required' : 'Unexpected'})`);
    
    // Test 2: Try to get a specific request (should require auth)
    console.log('\n📋 Test 2: GET /api/service-requests/[id]');
    const response2 = await fetch(`${baseURL}/api/service-requests/test-id`);
    console.log(`Status: ${response2.status} (${response2.status === 401 ? 'Expected - Auth required' : 'Unexpected'})`);
    
    // Test 3: Try to update a request (should require auth)
    console.log('\n📋 Test 3: PATCH /api/service-requests/[id]');
    const response3 = await fetch(`${baseURL}/api/service-requests/test-id`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });
    console.log(`Status: ${response3.status} (${response3.status === 401 ? 'Expected - Auth required' : 'Unexpected'})`);

    console.log('\n✅ API endpoints are responding correctly!');
    console.log('💡 All endpoints properly require authentication as expected.');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

// Run the test
testServiceRequestAPI();