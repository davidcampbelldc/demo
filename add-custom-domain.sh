#!/bin/bash

# Script to add custom domain to Cloudflare Pages project using API
# This script uses the Cloudflare API to add demo.peak3000.co.uk to our Pages project

set -e

PROJECT_NAME="juice-shop-peak3000"
DOMAIN="demo.peak3000.co.uk"
ACCOUNT_ID="d8234a8f646e47abe3809473445e4d9a"

echo "🔧 Adding custom domain $DOMAIN to Pages project $PROJECT_NAME"

# Get the API token from wrangler
echo "📋 Getting API token from wrangler..."
API_TOKEN=$(wrangler whoami 2>/dev/null | grep -o 'd8234a8f646e47abe3809473445e4d9a' || echo "")

if [ -z "$API_TOKEN" ]; then
    echo "❌ Could not get API token. Please make sure you're logged in with 'wrangler login'"
    echo "💡 Alternative: You can add the domain manually through the Cloudflare Dashboard"
    echo "   1. Go to https://dash.cloudflare.com"
    echo "   2. Navigate to Pages > juice-shop-peak3000"
    echo "   3. Go to Custom domains tab"
    echo "   4. Add demo.peak3000.co.uk"
    exit 1
fi

# Get the project ID
echo "🔍 Getting project ID for $PROJECT_NAME..."
PROJECT_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Could not find project ID for $PROJECT_NAME"
    exit 1
fi

echo "✅ Found project ID: $PROJECT_ID"

# Add the custom domain
echo "🌐 Adding custom domain $DOMAIN..."
RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT_NAME/domains" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"domain\":\"$DOMAIN\"}")

echo "📋 Response: $RESPONSE"

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Successfully added custom domain $DOMAIN!"
    echo "🌐 Your Juice Shop should be available at: https://$DOMAIN"
    echo "📋 Note: DNS propagation may take a few minutes"
else
    echo "❌ Failed to add custom domain. Response: $RESPONSE"
    echo "💡 You may need to add the domain manually through the Cloudflare Dashboard"
fi
