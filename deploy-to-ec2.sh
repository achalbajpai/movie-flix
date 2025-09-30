#!/bin/bash

# EC2 Production Deployment Script for Bus Booking System Backend
# Optimized for t2.micro instances (AWS Free Tier eligible)
# Requirements: 1 vCPU, 1GB RAM minimum
set -e

echo "🚀 Deploying Bus Booking System Backend to EC2 (t2.micro compatible)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Configuration
DEPLOY_ENV=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"
NGINX_CONF="nginx/nginx.prod.conf"

echo ""
print_info "Deployment Environment: $DEPLOY_ENV"
print_info "Using Compose File: $COMPOSE_FILE"
echo ""

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root. Consider using a non-root user for production."
fi

# Check prerequisites
echo "=== CHECKING PREREQUISITES ==="

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Run: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi
print_status "Docker is installed"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    echo "Run: sudo curl -L \"https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    exit 1
fi
print_status "Docker Compose is installed"

# Check if Docker daemon is running
if ! docker ps &> /dev/null; then
    print_error "Docker daemon is not running. Please start Docker."
    exit 1
fi
print_status "Docker daemon is running"

# Check environment file
if [ ! -f "backend/.env.production" ]; then
    print_error "Production environment file not found: backend/.env.production"
    echo "Please create it from backend/.env.production.example"
    exit 1
fi
print_status "Production environment file exists"

# Validate critical environment variables
print_info "Validating environment variables..."
ENV_FILE="backend/.env.production"
REQUIRED_VARS=("SUPABASE_URL" "SUPABASE_ANON_KEY" "JWT_SECRET" "SESSION_SECRET")

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" "$ENV_FILE" || grep -q "^$var=your-" "$ENV_FILE" || grep -q "^$var=$" "$ENV_FILE"; then
        print_error "Environment variable $var is not properly set in $ENV_FILE"
        exit 1
    fi
done
print_status "Critical environment variables are configured"

# Check SSL certificates (optional)
if [ -f "nginx/ssl/cert.pem" ] && [ -f "nginx/ssl/private.key" ]; then
    print_status "SSL certificates found"
    USE_SSL=true
else
    print_warning "SSL certificates not found. HTTPS will not be available."
    print_info "To enable HTTPS, add certificates to nginx/ssl/ directory"
    USE_SSL=false
fi

echo ""
echo "=== PREPARATION ==="

# Create necessary directories
mkdir -p nginx/ssl logs
print_status "Created necessary directories"

# Set proper permissions
chmod 600 nginx/ssl/* 2>/dev/null || true
chmod 755 logs
print_status "Set proper file permissions"

# Copy nginx configuration
if [ "$USE_SSL" = true ]; then
    print_status "Using production nginx configuration with SSL (nginx.prod.conf)"
else
    # Modify nginx config to remove SSL parts for HTTP-only deployment
    sed 's/listen 443 ssl http2/listen 80/g; s/ssl_certificate/#ssl_certificate/g; /return 301 https/d' "$NGINX_CONF" > nginx/nginx.conf
    print_status "Created HTTP-only nginx configuration"
fi

echo ""
echo "=== DEPLOYMENT ==="

# Pull latest images
print_info "Pulling latest Docker images..."
docker-compose -f "$COMPOSE_FILE" pull

# Stop existing containers gracefully
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    print_info "Stopping existing containers gracefully..."
    docker-compose -f "$COMPOSE_FILE" down --timeout 30
fi

# Remove unused images and volumes
print_info "Cleaning up unused Docker resources..."
docker system prune -f --volumes

# Build and start services
print_info "Building and starting services..."
docker-compose -f "$COMPOSE_FILE" up -d --build --remove-orphans

# Wait for services to be healthy
print_info "Waiting for services to be healthy..."
sleep 30

# Check service status
echo ""
echo "=== SERVICE STATUS ==="
docker-compose -f "$COMPOSE_FILE" ps

# Run health checks
echo ""
echo "=== HEALTH CHECKS ==="

# Check if backend is responding
for i in {1..30}; do
    if curl -s http://localhost/health > /dev/null 2>&1; then
        print_status "Backend health check passed"
        break
    elif [ $i -eq 30 ]; then
        print_error "Backend health check failed after 30 attempts"
        docker-compose -f "$COMPOSE_FILE" logs backend
        exit 1
    else
        echo -n "."
        sleep 2
    fi
done

# Test API endpoint
if curl -s http://localhost/api/v1/cities > /dev/null 2>&1; then
    print_status "API endpoint test passed"
else
    print_warning "API endpoint test failed (may require authentication)"
fi

echo ""
echo "=== DEPLOYMENT SUMMARY ==="

# Show running containers
print_info "Running containers:"
docker-compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Show resource usage
print_info "Resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Show logs location
print_info "Application logs: ./logs/"
print_info "Container logs: docker-compose -f $COMPOSE_FILE logs"

echo ""
print_status "Deployment completed successfully!"

if [ "$USE_SSL" = true ]; then
    echo "🌐 Your API is available at: https://your-domain.com/api/v1/"
    echo "🩺 Health check: https://your-domain.com/health"
else
    echo "🌐 Your API is available at: http://your-server-ip/api/v1/"
    echo "🩺 Health check: http://your-server-ip/health"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Configure your domain DNS to point to this server"
echo "2. Update frontend environment to use this API URL"
echo "3. Set up monitoring and alerting"
echo "4. Configure automated backups"
echo "5. Set up log rotation"

echo ""
print_info "Useful Commands:"
echo "  View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "  Restart services: docker-compose -f $COMPOSE_FILE restart"
echo "  Update deployment: git pull && ./deploy-to-ec2.sh"
echo "  Stop services: docker-compose -f $COMPOSE_FILE down"