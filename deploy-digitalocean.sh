#!/bin/bash

# Digital Ocean Deployment Script for Juice Shop

echo "🚀 Deploying Juice Shop to Digital Ocean..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t juice-shop-peak3000 .

# Tag for Digital Ocean Container Registry (optional)
# docker tag juice-shop-peak3000 registry.digitalocean.com/your-registry/juice-shop-peak3000

# Run the container
echo "🏃 Running container..."
docker run -d \
  --name juice-shop-peak3000 \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  --restart unless-stopped \
  juice-shop-peak3000

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: http://your-droplet-ip:3000"
echo "📊 Check status with: docker ps"
echo "📋 View logs with: docker logs juice-shop-peak3000"

