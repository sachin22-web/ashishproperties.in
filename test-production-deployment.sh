#!/bin/bash

# Production Deployment Test Script for Hostinger
# Run this after deploying to verify everything works

DOMAIN="aashish.posttrr.com"
API_URL="https://${DOMAIN}/api"
FRONTEND_URL="https://${DOMAIN}"

echo "🚀 Testing Production Deployment for ${DOMAIN}"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local test_name="$1"
    local url="$2"
    local expected_status="$3"
    local extra_args="$4"
    
    echo -n "Testing ${test_name}... "
    
    if [ -n "$extra_args" ]; then
        response=$(curl -s -w "%{http_code}" $extra_args "$url" -o /dev/null)
    else
        response=$(curl -s -w "%{http_code}" "$url" -o /dev/null)
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (${response})"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: ${expected_status}, Got: ${response})"
        return 1
    fi
}

# Test function with response body
test_endpoint_with_body() {
    local test_name="$1"
    local url="$2"
    local expected_status="$3"
    local extra_args="$4"
    
    echo -n "Testing ${test_name}... "
    
    if [ -n "$extra_args" ]; then
        response=$(curl -s -w "\n%{http_code}" $extra_args "$url")
    else
        response=$(curl -s -w "\n%{http_code}" "$url")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (${status_code})"
        echo "   Response: $(echo "$body" | head -c 100)..."
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: ${expected_status}, Got: ${status_code})"
        echo "   Response: $(echo "$body" | head -c 200)..."
        return 1
    fi
}

echo ""
echo "1. Testing Backend Health (Direct)"
test_endpoint_with_body "Backend Health Check" "${API_URL}/ping" "200"

echo ""
echo "2. Testing Frontend Loading"
test_endpoint "Frontend HTML" "${FRONTEND_URL}/" "200"

echo ""
echo "3. Testing SPA Routing"
test_endpoint "SPA Route (Properties)" "${FRONTEND_URL}/properties" "200"
test_endpoint "SPA Route (Dashboard)" "${FRONTEND_URL}/dashboard" "200"

echo ""
echo "4. Testing CORS Headers"
test_endpoint "CORS Preflight" "${API_URL}/ping" "200" "-H 'Origin: ${FRONTEND_URL}' -X OPTIONS"

echo ""
echo "5. Testing API Endpoints"
test_endpoint_with_body "Properties API" "${API_URL}/properties" "200"
test_endpoint_with_body "Categories API" "${API_URL}/categories" "200"
test_endpoint_with_body "Packages API" "${API_URL}/packages" "200"

echo ""
echo "6. Testing Authentication Endpoints"
test_endpoint "Auth Login Endpoint" "${API_URL}/auth/login" "400" "-X POST -H 'Content-Type: application/json' -d '{}'"

echo ""
echo "7. Testing Static Assets"
test_endpoint "Favicon" "${FRONTEND_URL}/favicon.ico" "200"
test_endpoint "Manifest" "${FRONTEND_URL}/manifest.json" "200"

echo ""
echo "8. Testing Security Headers"
echo -n "Testing Security Headers... "
headers=$(curl -s -I "${FRONTEND_URL}/" | grep -i "x-frame-options\|x-xss-protection\|x-content-type-options")
if [ -n "$headers" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    echo "   Headers found: $(echo "$headers" | tr '\n' ' ')"
else
    echo -e "${YELLOW}⚠️  WARNING${NC} (No security headers detected)"
fi

echo ""
echo "9. Testing SSL Certificate"
echo -n "Testing SSL Certificate... "
ssl_info=$(curl -s -I "${FRONTEND_URL}/" | grep -i "strict-transport-security")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING${NC} (HSTS not enabled)"
fi

echo ""
echo "10. Performance Test"
echo -n "Testing Page Load Time... "
load_time=$(curl -s -w "%{time_total}" -o /dev/null "${FRONTEND_URL}/")
echo "Load time: ${load_time}s"
if (( $(echo "$load_time < 3.0" | bc -l) )); then
    echo -e "${GREEN}✅ GOOD${NC} (< 3s)"
else
    echo -e "${YELLOW}⚠️  SLOW${NC} (> 3s)"
fi

echo ""
echo "==========================================="
echo "🏁 Deployment Test Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. If any tests failed, check the troubleshooting guide"
echo "2. Verify aaPanel Node.js service is running on port 8003"
echo "3. Check Nginx configuration is applied correctly"
echo "4. Test the application manually in a browser"
echo ""
echo "🌐 Access your application at: ${FRONTEND_URL}"
