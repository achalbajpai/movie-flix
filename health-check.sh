#!/bin/bash

# Production Health Monitoring Script for Bus Booking System
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
API_URL="http://localhost"
COMPOSE_FILE="docker-compose.prod.yml"

echo "🔍 Bus Booking System Health Monitor"
echo "=================================="

# Check Docker services
echo ""
print_info "Checking Docker services..."
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up.*healthy"; then
    print_status "Docker services are running"
else
    print_error "Some Docker services are not healthy"
    docker-compose -f "$COMPOSE_FILE" ps
fi

# Check health endpoint
echo ""
print_info "Checking API health..."
health_response=$(curl -s "$API_URL/health" 2>/dev/null || echo "ERROR")

if echo "$health_response" | grep -q "healthy"; then
    print_status "API health check passed"
    uptime=$(echo "$health_response" | jq -r '.data.uptime' 2>/dev/null || echo "unknown")
    print_info "System uptime: ${uptime}s"
else
    print_error "API health check failed"
    echo "Response: $health_response"
fi

# Check database connectivity
echo ""
print_info "Checking database connectivity..."
cities_response=$(curl -s "$API_URL/api/v1/cities" 2>/dev/null || echo "ERROR")

if echo "$cities_response" | grep -q "success.*true"; then
    print_status "Database connectivity OK"
    city_count=$(echo "$cities_response" | jq -r '.data | length' 2>/dev/null || echo "unknown")
    print_info "Cities available: $city_count"
else
    print_error "Database connectivity failed"
fi

# Check resource usage
echo ""
print_info "Checking resource usage..."
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "(bus-booking|CONTAINER)"

# Check disk space
echo ""
print_info "Checking disk space..."
df -h / | awk 'NR==2 {print "Disk usage: " $5 " (" $3 " used / " $2 " total)"}'

# Check logs for errors
echo ""
print_info "Checking recent logs for errors..."
error_count=$(docker-compose -f "$COMPOSE_FILE" logs --since="1h" 2>/dev/null | grep -i error | wc -l)
if [ "$error_count" -gt 0 ]; then
    print_warning "Found $error_count error(s) in last hour"
    echo "Recent errors:"
    docker-compose -f "$COMPOSE_FILE" logs --since="1h" 2>/dev/null | grep -i error | tail -5
else
    print_status "No recent errors found"
fi

# Summary
echo ""
echo "=================================="
echo "Health check completed at $(date)"