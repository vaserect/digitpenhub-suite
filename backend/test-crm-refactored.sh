#!/bin/bash

# Manual Testing Script for Refactored CRM Controller
# This script helps test the refactored CRM endpoints in development

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_BASE="${BASE_URL}/api/v1/crm"

echo -e "${YELLOW}=== CRM Controller Manual Testing Script ===${NC}\n"

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
if ! curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server is not running at ${BASE_URL}${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}\n"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠ jq is not installed. Install it for better JSON formatting${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    echo "  macOS: brew install jq"
    echo ""
fi

# Function to make authenticated request
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}Testing: ${description}${NC}"
    echo "  ${method} ${endpoint}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -X "${method}" \
            -H "Content-Type: application/json" \
            -H "Cookie: token=${AUTH_TOKEN}" \
            -d "${data}" \
            "${API_BASE}${endpoint}")
    else
        response=$(curl -s -X "${method}" \
            -H "Cookie: token=${AUTH_TOKEN}" \
            "${API_BASE}${endpoint}")
    fi
    
    # Check if jq is available
    if command -v jq &> /dev/null; then
        echo "$response" | jq '.'
    else
        echo "$response"
    fi
    
    echo ""
}

# Check for authentication token
if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}❌ AUTH_TOKEN environment variable is not set${NC}"
    echo ""
    echo "Please set your authentication token:"
    echo "  export AUTH_TOKEN='your-jwt-token-here'"
    echo ""
    echo "Or login first to get a token:"
    echo "  curl -X POST ${BASE_URL}/api/v1/auth/login \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"email\":\"your@email.com\",\"password\":\"yourpassword\"}'"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Authentication token found${NC}\n"

# Test 1: List Contacts
echo -e "${YELLOW}=== Test 1: List Contacts ===${NC}"
make_request "GET" "/contacts" "" "List all contacts with statistics"

# Test 2: Create Contact
echo -e "${YELLOW}=== Test 2: Create Contact ===${NC}"
CONTACT_DATA='{
  "fullName": "Test Contact",
  "email": "test@example.com",
  "phone": "+1234567890",
  "company": "Test Company",
  "stage": "new",
  "valueNgn": 10000,
  "tags": ["test", "manual"]
}'
response=$(make_request "POST" "/contacts" "$CONTACT_DATA" "Create a new contact")
CONTACT_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$CONTACT_ID" ]; then
    echo -e "${GREEN}✓ Contact created with ID: ${CONTACT_ID}${NC}\n"
else
    echo -e "${RED}❌ Failed to create contact${NC}\n"
    exit 1
fi

# Test 3: Get Contact by ID
echo -e "${YELLOW}=== Test 3: Get Contact by ID ===${NC}"
make_request "GET" "/contacts/${CONTACT_ID}" "" "Get contact details"

# Test 4: Update Contact
echo -e "${YELLOW}=== Test 4: Update Contact ===${NC}"
UPDATE_DATA='{
  "fullName": "Updated Test Contact",
  "stage": "contacted",
  "valueNgn": 20000
}'
make_request "PATCH" "/contacts/${CONTACT_ID}" "$UPDATE_DATA" "Update contact"

# Test 5: Create Note
echo -e "${YELLOW}=== Test 5: Create Contact Note ===${NC}"
NOTE_DATA='{
  "body": "This is a test note from manual testing script"
}'
response=$(make_request "POST" "/contacts/${CONTACT_ID}/notes" "$NOTE_DATA" "Create a note")
NOTE_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$NOTE_ID" ]; then
    echo -e "${GREEN}✓ Note created with ID: ${NOTE_ID}${NC}\n"
fi

# Test 6: List Notes
echo -e "${YELLOW}=== Test 6: List Contact Notes ===${NC}"
make_request "GET" "/contacts/${CONTACT_ID}/notes" "" "List all notes for contact"

# Test 7: Create Task
echo -e "${YELLOW}=== Test 7: Create Contact Task ===${NC}"
TASK_DATA='{
  "title": "Follow up call",
  "dueDate": "2026-07-20"
}'
response=$(make_request "POST" "/contacts/${CONTACT_ID}/tasks" "$TASK_DATA" "Create a task")
TASK_ID=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$TASK_ID" ]; then
    echo -e "${GREEN}✓ Task created with ID: ${TASK_ID}${NC}\n"
fi

# Test 8: List Tasks
echo -e "${YELLOW}=== Test 8: List Contact Tasks ===${NC}"
make_request "GET" "/contacts/${CONTACT_ID}/tasks" "" "List all tasks for contact"

# Test 9: Update Task
if [ -n "$TASK_ID" ]; then
    echo -e "${YELLOW}=== Test 9: Update Task ===${NC}"
    TASK_UPDATE='{
      "status": "done"
    }'
    make_request "PATCH" "/contacts/${CONTACT_ID}/tasks/${TASK_ID}" "$TASK_UPDATE" "Mark task as done"
fi

# Test 10: Bulk Import
echo -e "${YELLOW}=== Test 10: Bulk Import Contacts ===${NC}"
BULK_DATA='{
  "contacts": [
    {"fullName": "Bulk Contact 1", "email": "bulk1@test.com"},
    {"fullName": "Bulk Contact 2", "email": "bulk2@test.com"},
    {"fullName": "Bulk Contact 3", "email": "bulk3@test.com"}
  ]
}'
make_request "POST" "/contacts/import" "$BULK_DATA" "Import multiple contacts"

# Test 11: Search/Filter (if implemented)
echo -e "${YELLOW}=== Test 11: Search Contacts ===${NC}"
make_request "GET" "/contacts?search=Test" "" "Search contacts by name"

# Test 12: Delete Note
if [ -n "$NOTE_ID" ]; then
    echo -e "${YELLOW}=== Test 12: Delete Note ===${NC}"
    make_request "DELETE" "/contacts/${CONTACT_ID}/notes/${NOTE_ID}" "" "Delete note"
fi

# Test 13: Delete Task
if [ -n "$TASK_ID" ]; then
    echo -e "${YELLOW}=== Test 13: Delete Task ===${NC}"
    make_request "DELETE" "/contacts/${CONTACT_ID}/tasks/${TASK_ID}" "" "Delete task"
fi

# Test 14: Delete Contact
echo -e "${YELLOW}=== Test 14: Delete Contact ===${NC}"
make_request "DELETE" "/contacts/${CONTACT_ID}" "" "Delete contact"

# Test 15: Error Handling - Invalid Data
echo -e "${YELLOW}=== Test 15: Error Handling - Invalid Data ===${NC}"
INVALID_DATA='{
  "stage": "invalid-stage"
}'
make_request "POST" "/contacts" "$INVALID_DATA" "Create contact with invalid data (should fail)"

# Test 16: Error Handling - Non-existent Resource
echo -e "${YELLOW}=== Test 16: Error Handling - Non-existent Resource ===${NC}"
make_request "GET" "/contacts/non-existent-id" "" "Get non-existent contact (should return 404)"

# Summary
echo -e "${GREEN}=== Testing Complete ===${NC}\n"
echo "All manual tests have been executed."
echo "Please review the responses above to verify:"
echo "  ✓ All endpoints are working correctly"
echo "  ✓ Data validation is functioning"
echo "  ✓ Error handling is appropriate"
echo "  ✓ Response formats are correct"
echo ""
echo "Next steps:"
echo "  1. Review any errors or unexpected responses"
echo "  2. Test with different user roles/permissions"
echo "  3. Test tenant isolation (different organizations)"
echo "  4. Run integration tests: npm test -- crmController.integration.test.js"
echo "  5. Deploy to staging if all tests pass"
echo ""
