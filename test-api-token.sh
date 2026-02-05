#!/bin/bash

# Test script for API token authentication
# Usage: ./test-api-token.sh <your-jwt-token> <your-api-token>

JWT_TOKEN=$1
API_TOKEN=$2

if [ -z "$JWT_TOKEN" ] || [ -z "$API_TOKEN" ]; then
  echo "Usage: ./test-api-token.sh <jwt-token> <api-token>"
  echo ""
  echo "Example:"
  echo "  ./test-api-token.sh eyJhbGciOi... abc123def456..."
  exit 1
fi

BASE_URL="http://localhost:3000"

echo "=== Testing API Token Authentication ==="
echo ""

# Test 1: Get companies (should work with API token)
echo "Test 1: GET /api/companies with API token"
echo "-------------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/api/companies" \
  -H "Authorization: Bearer $API_TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ SUCCESS (HTTP $HTTP_CODE)"
  echo "Response preview: $(echo "$BODY" | head -c 100)..."
else
  echo "❌ FAILED (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
fi
echo ""

# Test 2: Get municipalities (should work if token has permission)
echo "Test 2: GET /api/municipalities with API token"
echo "-----------------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/api/municipalities" \
  -H "Authorization: Bearer $API_TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ SUCCESS (HTTP $HTTP_CODE)"
  echo "Response preview: $(echo "$BODY" | head -c 100)..."
elif [ "$HTTP_CODE" = "403" ]; then
  echo "⚠️  FORBIDDEN (HTTP $HTTP_CODE) - Token doesn't have 'municipalities' permission"
  echo "Response: $BODY"
else
  echo "❌ FAILED (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
fi
echo ""

# Test 3: Request without token (should fail)
echo "Test 3: GET /api/companies without token"
echo "-----------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X GET "$BASE_URL/api/companies")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ SUCCESS (HTTP $HTTP_CODE) - Correctly rejected request without token"
  echo "Response: $BODY"
else
  echo "❌ UNEXPECTED (HTTP $HTTP_CODE) - Should be 401"
  echo "Response: $BODY"
fi
echo ""

echo "=== Tests Complete ==="
