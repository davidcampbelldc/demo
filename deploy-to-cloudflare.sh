#!/bin/bash

# Deployment script for OWASP Juice Shop on Cloudflare
# Usage: ./deploy-to-cloudflare.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
PROJECT_NAME="juice-shop-peak3000"

echo "🚀 Deploying OWASP Juice Shop to Cloudflare ($ENVIRONMENT)"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please log in to Cloudflare:"
    wrangler login
fi

# Set environment variables
if [ "$ENVIRONMENT" = "production" ]; then
    export NODE_ENV=production
    export NODE_CONFIG_ENV=peak3000
    export BASE_URL="https://demo.peak3000.co.uk"
    ROUTE="demo.peak3000.co.uk/*"
else
    export NODE_ENV=staging
    export NODE_CONFIG_ENV=peak3000
    export BASE_URL="https://staging.demo.peak3000.co.uk"
    ROUTE="staging.demo.peak3000.co.uk/*"
fi

echo "📦 Building application..."

# Install dependencies
npm ci

# Build frontend
cd frontend
npm ci --legacy-peer-deps
npm run build
cd ..

# Build backend
npm run build:server

echo "🏗️  Building Docker image..."

# Build Docker image
docker build -f Dockerfile.cloudflare -t juice-shop-peak3000:latest .

echo "📤 Deploying to Cloudflare Pages..."

# Deploy to Cloudflare Pages
if [ "$ENVIRONMENT" = "production" ]; then
    wrangler pages deploy frontend/dist --project-name=$PROJECT_NAME --compatibility-date=2024-01-15
else
    wrangler pages deploy frontend/dist --project-name=$PROJECT_NAME-staging --compatibility-date=2024-01-15
fi

echo "🔧 Setting up custom domain..."

# Configure custom domain (you'll need to do this manually in Cloudflare dashboard)
if [ "$ENVIRONMENT" = "production" ]; then
    echo "📋 Manual steps required:"
    echo "1. Go to Cloudflare Dashboard > Pages > $PROJECT_NAME"
    echo "2. Go to Custom domains tab"
    echo "3. Add custom domain: demo.peak3000.co.uk"
    echo "4. Configure DNS records as instructed"
else
    echo "📋 Manual steps required:"
    echo "1. Go to Cloudflare Dashboard > Pages > $PROJECT_NAME-staging"
    echo "2. Go to Custom domains tab"
    echo "3. Add custom domain: staging.demo.peak3000.co.uk"
    echo "4. Configure DNS records as instructed"
fi

echo "✅ Deployment completed!"
echo "🌐 Your Juice Shop should be available at: $BASE_URL"

# Optional: Run health check
echo "🔍 Running health check..."
sleep 10
if curl -f -s "$BASE_URL/rest/admin/application-version" > /dev/null; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check failed. Please check the deployment."
fi
