# OWASP Juice Shop - Peak3000 Demo Deployment Guide

## Overview
This guide will help you deploy the OWASP Juice Shop application to your Cloudflare domain `demo.peak3000.co.uk`.

## Prerequisites
- Cloudflare account with Pages enabled
- Domain `peak3000.co.uk` configured in Cloudflare
- Node.js 20+ installed locally
- Docker installed (optional, for containerized deployment)

## Deployment Options

### Option 1: Cloudflare Pages (Recommended)
Cloudflare Pages is perfect for hosting the Angular frontend with serverless functions for the API.

#### Steps:
1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Configure Environment**:
   ```bash
   export NODE_ENV=production
   export NODE_CONFIG_ENV=peak3000
   export BASE_URL="https://demo.peak3000.co.uk"
   ```

3. **Build and Deploy**:
   ```bash
   ./deploy-to-cloudflare.sh production
   ```

4. **Configure Custom Domain**:
   - Go to Cloudflare Dashboard > Pages > juice-shop-peak3000
   - Add custom domain: `demo.peak3000.co.uk`
   - Update DNS records as instructed

### Option 2: Cloudflare Workers
For a more integrated approach, you can deploy the entire application as a Cloudflare Worker.

#### Steps:
1. **Deploy Worker**:
   ```bash
   wrangler deploy --env production
   ```

2. **Configure Routes**:
   ```bash
   wrangler route add "demo.peak3000.co.uk/*" juice-shop-peak3000
   ```

### Option 3: Docker + Cloudflare Tunnel
Deploy using Docker and expose via Cloudflare Tunnel.

#### Steps:
1. **Build Docker Image**:
   ```bash
   docker build -f Dockerfile.cloudflare -t juice-shop-peak3000:latest .
   ```

2. **Run Container**:
   ```bash
   docker run -d \
     --name juice-shop-peak3000 \
     -p 3000:3000 \
     -e NODE_ENV=production \
     -e NODE_CONFIG_ENV=peak3000 \
     -e BASE_URL="https://demo.peak3000.co.uk" \
     juice-shop-peak3000:latest
   ```

3. **Setup Cloudflare Tunnel**:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

## Configuration Files

### Environment Configuration
The application uses the `peak3000.yml` configuration file which includes:
- Custom branding for Peak3000
- Proper domain configuration
- Security settings
- Demo-specific welcome message

### Key Features Configured:
- **Domain**: `demo.peak3000.co.uk`
- **Branding**: "OWASP Juice Shop - Peak3000 Demo"
- **Contact**: `demo@peak3000.co.uk`
- **Welcome Message**: Customized for Peak3000 demo

## Security Considerations

### For Demo Environment:
- This is a **vulnerable by design** application
- Contains intentional security flaws for educational purposes
- Should only be used in controlled environments
- Consider adding access restrictions if needed

### Recommended Security Measures:
1. **Access Control**: Consider adding basic auth or IP restrictions
2. **Monitoring**: Enable Cloudflare Analytics and Security
3. **Backup**: Regular database backups (SQLite file)
4. **Updates**: Keep the application updated

## Monitoring and Maintenance

### Health Checks:
- Application health: `https://demo.peak3000.co.uk/rest/admin/application-version`
- Metrics endpoint: `https://demo.peak3000.co.uk/metrics`

### Logs:
- Cloudflare Pages: Available in Cloudflare Dashboard
- Application logs: Check container logs if using Docker

### Updates:
```bash
git pull origin master
./deploy-to-cloudflare.sh production
```

## Troubleshooting

### Common Issues:
1. **Build Failures**: Check Node.js version compatibility
2. **Domain Issues**: Verify DNS configuration in Cloudflare
3. **API Errors**: Check CORS settings and environment variables

### Debug Commands:
```bash
# Check application status
curl -f https://demo.peak3000.co.uk/rest/admin/application-version

# View logs (if using Docker)
docker logs juice-shop-peak3000

# Test local build
npm run build:frontend && npm run build:server
```

## Cost Considerations

### Cloudflare Pages:
- **Free Tier**: 500 builds/month, 20,000 requests/day
- **Pro**: $20/month for higher limits
- **Bandwidth**: Unlimited on all plans

### Cloudflare Workers:
- **Free Tier**: 100,000 requests/day
- **Paid**: $5/month for 10M requests

## Support

For issues specific to this deployment:
- Check Cloudflare documentation
- Review OWASP Juice Shop documentation
- Contact Peak3000 technical team

For OWASP Juice Shop issues:
- GitHub: https://github.com/juice-shop/juice-shop
- Documentation: https://pwning.owasp-juice.shop
