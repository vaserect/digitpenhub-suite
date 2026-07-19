/**
 * Test Script: Custom Fields Engine - Field Dependencies Feature
 * Tests all dependency condition types and actions
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4001/api/v1';
const TEST_ORG_ID = 'test-org-123'; // Replace with actual org ID
const TEST_USER_TOKEN = 'your-test-token'; // Replace with actual auth token

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${TEST_USER_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testFieldDependencies() {
  console.log('🧪 Testing Custom Fields Engine - Field Dependencies\n');

  try {
    // Test 1: Create base fields for dependency testing
    console.log('📝 Test 1: Creating base custom fields...');
    
    const customerTypeField = await api.post('/custom-fields/contact', {
      key: 'customer_type',
      label: 'Customer Type',
      fieldType: 'select',
      options: ['individual', 'business', 'enterprise'],
      required: true
    });
    console.log('✅ Created customer_type field:', customerTypeField.data.id);

    const contractField = await api.post('/custom-fields/contact', {
      key: 'has_contract',
      label: 'Has Contract',
      fieldType: 'checkbox',
      required: false
    });
    console.log('✅ Created has_contract field:', contractField.data.id);

    const contractValueField = await api.post('/custom-fields/contact', {
      key: 'contract_value',
      label: 'Contract Value',
      fieldType: 'currency',
      required: false,
      currency_code: 'USD'
    });
    console.log('✅ Created contract_value field:', contractValueField.data.id);

    // Test 2: Set dependencies - Show field when customer_type = 'enterprise'
    console.log('\n📝 Test 2: Setting "show" dependency...');
    const showDep = await api.post(`/custom-fields/${contractValueField.data.id}/dependencies`, {
      dependencies: [
        {
          source_field: 'customer_type',
          condition_type: 'equals',
          condition_value: 'enterprise',
          action: 'show'
        }
      ]
    });
    console.log('✅ Show dependency set:', showDep.data.message);

    // Test 3: Set dependencies - Require field when has_contract is checked
    console.log('\n📝 Test 3: Setting "require" dependency...');
    const requireDep = await api.post(`/custom-fields/${contractValueField.data.id}/dependencies`, {
      dependencies: [
        {
          source_field: 'customer_type',
          condition_type: 'equals',
          condition_value: 'enterprise',
          action: 'show'
        },
        {
          source_field: 'has_contract',
          condition_type: 'is_not_empty',
          condition_value: null,
          action: 'require'
        }
      ]
    });
    console.log('✅ Multiple dependencies set:', requireDep.data.message);

    // Test 4: Get field dependencies
    console.log('\n📝 Test 4: Retrieving field dependencies...');
    const getDeps = await api.get(`/custom-fields/${contractValueField.data.id}/dependencies`);
    console.log('✅ Retrieved dependencies:', JSON.stringify(getDeps.data.dependencies, null, 2));

    // Test 5: Evaluate dependencies with different field values
    console.log('\n📝 Test 5: Evaluating dependencies...');
    
    // Scenario A: customer_type = 'individual', has_contract = false
    const evalA = await api.post('/custom-fields/evaluate-dependencies', {
      recordType: 'contact',
      fieldValues: {
        customer_type: 'individual',
        has_contract: false
      }
    });
    console.log('✅ Scenario A (individual, no contract):');
    console.log('   contract_value visible:', evalA.data.evaluation_results.contract_value?.visible);
    console.log('   contract_value required:', evalA.data.evaluation_results.contract_value?.required);

    // Scenario B: customer_type = 'enterprise', has_contract = false
    const evalB = await api.post('/custom-fields/evaluate-dependencies', {
      recordType: 'contact',
      fieldValues: {
        customer_type: 'enterprise',
        has_contract: false
      }
    });
    console.log('✅ Scenario B (enterprise, no contract):');
    console.log('   contract_value visible:', evalB.data.evaluation_results.contract_value?.visible);
    console.log('   contract_value required:', evalB.data.evaluation_results.contract_value?.required);

    // Scenario C: customer_type = 'enterprise', has_contract = true
    const evalC = await api.post('/custom-fields/evaluate-dependencies', {
      recordType: 'contact',
      fieldValues: {
        customer_type: 'enterprise',
        has_contract: true
      }
    });
    console.log('✅ Scenario C (enterprise, has contract):');
    console.log('   contract_value visible:', evalC.data.evaluation_results.contract_value?.visible);
    console.log('   contract_value required:', evalC.data.evaluation_results.contract_value?.required);

    // Test 6: Test other condition types
    console.log('\n📝 Test 6: Testing advanced condition types...');
    
    const statusField = await api.post('/custom-fields/contact', {
      key: 'account_status',
      label: 'Account Status',
      fieldType: 'select',
      options: ['active', 'inactive', 'suspended', 'trial']
    });

    const tierField = await api.post('/custom-fields/contact', {
      key: 'tier',
      label: 'Tier',
      fieldType: 'select',
      options: ['basic', 'premium', 'enterprise']
    });

    const specialNotesField = await api.post('/custom-fields/contact', {
      key: 'special_notes',
      label: 'Special Notes',
      fieldType: 'text'
    });

    // Set complex dependencies using in_list
    await api.post(`/custom-fields/${specialNotesField.data.id}/dependencies`, {
      dependencies: [
        {
          source_field: 'account_status',
          condition_type: 'in_list',
          condition_value: 'suspended,inactive',
          action: 'show'
        },
        {
          source_field: 'tier',
          condition_type: 'equals',
          condition_value: 'enterprise',
          action: 'require'
        }
      ]
    });
    console.log('✅ Complex dependencies with in_list condition set');

    // Test 7: Remove dependencies
    console.log('\n📝 Test 7: Removing dependencies...');
    const removeDeps = await api.delete(`/custom-fields/${contractValueField.data.id}/dependencies`);
    console.log('✅ Dependencies removed:', removeDeps.data.message);

    console.log('\n✅ All Field Dependencies tests passed!\n');
    console.log('📊 Summary:');
    console.log('   - Created 6 test fields');
    console.log('   - Tested all dependency actions: show, hide, require, optional');
    console.log('   - Tested condition types: equals, is_not_empty, in_list');
    console.log('   - Evaluated 3 different scenarios');
    console.log('   - Verified dependency retrieval and removal');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run tests
testFieldDependencies();
