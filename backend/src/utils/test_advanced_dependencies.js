/**
 * Test Suite for Advanced Field Dependencies (Feature #13)
 * Tests complex logic operators (AND/OR/NOT) and backward compatibility
 */

const {
  evaluateCondition,
  evaluateComplexConditions,
  evaluateFieldDependencies,
  validateDependency,
  isAdvancedDependency,
} = require('./fieldDependencyEvaluator');

console.log('=== Testing Advanced Field Dependencies (Feature #13) ===\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Test 1: Simple dependency (backward compatibility)
test('Simple dependency - equals condition', () => {
  const result = evaluateCondition('active', {
    condition_type: 'equals',
    condition_value: 'active'
  });
  assert(result === true, 'Should return true for matching values');
});

// Test 2: Advanced dependency detection
test('isAdvancedDependency - detects advanced dependency', () => {
  const advanced = { logic_operator: 'AND', conditions: [] };
  const simple = { source_field: 'status', condition_type: 'equals' };
  
  assert(isAdvancedDependency(advanced) === true, 'Should detect advanced dependency');
  assert(isAdvancedDependency(simple) === false, 'Should detect simple dependency');
});

// Test 3: AND logic operator
test('Complex conditions - AND operator (all true)', () => {
  const conditions = [
    { source_field: 'status', condition_type: 'equals', condition_value: 'active' },
    { source_field: 'role', condition_type: 'equals', condition_value: 'admin' }
  ];
  const values = { status: 'active', role: 'admin' };
  
  const result = evaluateComplexConditions(conditions, 'AND', values);
  assert(result === true, 'AND should return true when all conditions are true');
});

test('Complex conditions - AND operator (one false)', () => {
  const conditions = [
    { source_field: 'status', condition_type: 'equals', condition_value: 'active' },
    { source_field: 'role', condition_type: 'equals', condition_value: 'admin' }
  ];
  const values = { status: 'active', role: 'user' };
  
  const result = evaluateComplexConditions(conditions, 'AND', values);
  assert(result === false, 'AND should return false when any condition is false');
});

// Test 4: OR logic operator
test('Complex conditions - OR operator (one true)', () => {
  const conditions = [
    { source_field: 'status', condition_type: 'equals', condition_value: 'active' },
    { source_field: 'role', condition_type: 'equals', condition_value: 'admin' }
  ];
  const values = { status: 'inactive', role: 'admin' };
  
  const result = evaluateComplexConditions(conditions, 'OR', values);
  assert(result === true, 'OR should return true when any condition is true');
});

test('Complex conditions - OR operator (all false)', () => {
  const conditions = [
    { source_field: 'status', condition_type: 'equals', condition_value: 'active' },
    { source_field: 'role', condition_type: 'equals', condition_value: 'admin' }
  ];
  const values = { status: 'inactive', role: 'user' };
  
  const result = evaluateComplexConditions(conditions, 'OR', values);
  assert(result === false, 'OR should return false when all conditions are false');
});

// Test 5: NOT logic operator
test('Complex conditions - NOT operator', () => {
  const conditions = [
    { source_field: 'status', condition_type: 'equals', condition_value: 'active' }
  ];
  const values = { status: 'inactive' };
  
  const result = evaluateComplexConditions(conditions, 'NOT', values);
  assert(result === true, 'NOT should negate the condition result');
});

// Test 6: New condition types
test('Advanced condition - greater_than_or_equal', () => {
  const result = evaluateCondition(10, {
    condition_type: 'greater_than_or_equal',
    condition_value: 10
  });
  assert(result === true, 'Should return true for equal values');
});

test('Advanced condition - starts_with', () => {
  const result = evaluateCondition('Hello World', {
    condition_type: 'starts_with',
    condition_value: 'hello'
  });
  assert(result === true, 'Should be case-insensitive');
});

test('Advanced condition - matches_regex', () => {
  const result = evaluateCondition('test@example.com', {
    condition_type: 'matches_regex',
    condition_value: '^[a-z]+@[a-z]+\\.[a-z]+$'
  });
  assert(result === true, 'Should match email pattern');
});

// Test 7: Field dependencies with advanced logic
test('evaluateFieldDependencies - advanced dependency with AND', () => {
  const fieldDef = {
    key: 'special_field',
    required: false,
    dependencies: [
      {
        logic_operator: 'AND',
        conditions: [
          { source_field: 'status', condition_type: 'equals', condition_value: 'active' },
          { source_field: 'role', condition_type: 'equals', condition_value: 'admin' }
        ],
        action: 'show'
      }
    ]
  };
  const values = { status: 'active', role: 'admin' };
  
  const result = evaluateFieldDependencies(fieldDef, values);
  assert(result.visible === true, 'Field should be visible when AND conditions are met');
});

// Test 8: Backward compatibility
test('evaluateFieldDependencies - simple dependency (backward compatible)', () => {
  const fieldDef = {
    key: 'simple_field',
    required: false,
    dependencies: [
      {
        source_field: 'status',
        condition_type: 'equals',
        condition_value: 'active',
        action: 'show'
      }
    ]
  };
  const values = { status: 'active' };
  
  const result = evaluateFieldDependencies(fieldDef, values);
  assert(result.visible === true, 'Simple dependencies should still work');
});

// Test 9: Validation - valid advanced dependency
test('validateDependency - valid advanced dependency', () => {
  const dep = {
    logic_operator: 'AND',
    conditions: [
      { source_field: 'status', condition_type: 'equals', condition_value: 'active' }
    ],
    action: 'show'
  };
  
  const result = validateDependency(dep);
  assert(result.valid === true, 'Should validate correct advanced dependency');
});

// Test 10: Validation - invalid logic operator
test('validateDependency - invalid logic operator', () => {
  const dep = {
    logic_operator: 'XOR',
    conditions: [
      { source_field: 'status', condition_type: 'equals', condition_value: 'active' }
    ],
    action: 'show'
  };
  
  const result = validateDependency(dep);
  assert(result.valid === false, 'Should reject invalid logic operator');
  assert(result.error.includes('Invalid logic_operator'), 'Should provide helpful error message');
});

// Test 11: Validation - missing conditions array
test('validateDependency - missing conditions array', () => {
  const dep = {
    logic_operator: 'AND',
    action: 'show'
  };
  
  const result = validateDependency(dep);
  assert(result.valid === false, 'Should reject missing conditions array');
});

// Test 12: Validation - valid simple dependency
test('validateDependency - valid simple dependency', () => {
  const dep = {
    source_field: 'status',
    condition_type: 'equals',
    condition_value: 'active',
    action: 'show'
  };
  
  const result = validateDependency(dep);
  assert(result.valid === true, 'Should validate simple dependency');
});

// Summary
console.log('\n=== Test Results ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n✓ All tests passed! Feature #13 is working correctly.');
  process.exit(0);
} else {
  console.log('\n✗ Some tests failed. Please review the implementation.');
  process.exit(1);
}
