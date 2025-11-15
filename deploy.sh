#!/bin/bash

# Deployment script for Vibe Journal on Ubuntu Server
# This script will set up and deploy the application

set -e  # Exit on error

echo "=========================================="
echo "Vibe Journal Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root or with sudo"
    exit 1
fi

print_info "Starting deployment process..."
echo ""

# Update system packages
print_info "Updating system packages..."
apt update
apt upgrade -y
print_success "System packages updated"
echo ""

# Install required packages
print_info "Installing required packages..."
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    ufw
print_success "Required packages installed"
echo ""

# Install Docker
if ! command -v docker &> /dev/null; then
    print_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    print_success "Docker installed and started"
else
    print_success "Docker is already installed"
fi
echo ""

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_info "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed"
else
    print_success "Docker Compose is already installed"
fi
echo ""

# Configure firewall
print_info "Configuring firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw reload
print_success "Firewall configured"
echo ""

# Create application directory
APP_DIR="/opt/vibe-journal"
print_info "Creating application directory at $APP_DIR..."
mkdir -p "$APP_DIR"
print_success "Application directory created"
echo ""

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    print_info "Updating existing repository..."
    cd "$APP_DIR"
    git pull
    print_success "Repository updated"
else
    print_info "Cloning repository..."
    git clone https://github.com/marketcalls/trading-journal.git "$APP_DIR"
    cd "$APP_DIR"
    print_success "Repository cloned"
fi
echo ""

# Create necessary directories
print_info "Creating necessary directories..."
mkdir -p "$APP_DIR/backend/uploads"
mkdir -p "$APP_DIR/nginx/ssl"
chmod 755 "$APP_DIR/backend/uploads"
print_success "Directories created"
echo ""

# Set up environment file
if [ ! -f "$APP_DIR/.env.production" ]; then
    print_info "Creating .env.production file..."
    cat > "$APP_DIR/.env.production" <<EOF
# Production Environment Variables
SECRET_KEY=$(openssl rand -hex 32)
NEXT_PUBLIC_API_URL=http://$(hostname -I | awk '{print $1}')/api
EOF
    print_success ".env.production file created"
    print_info "A random SECRET_KEY has been generated"
else
    print_success ".env.production file already exists"
fi
echo ""

# Build and start containers
print_info "Building and starting Docker containers..."
cd "$APP_DIR"
docker-compose -f docker-compose.prod.yml --env-file .env.production down
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
print_success "Docker containers started"
echo ""

# Wait for services to be ready
print_info "Waiting for services to start..."
sleep 10
print_success "Services should be ready"
echo ""

# Show container status
print_info "Container status:"
docker-compose -f docker-compose.prod.yml ps
echo ""

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo "=========================================="
print_success "Deployment completed successfully!"
echo "=========================================="
echo ""
echo "Your application is now running at:"
echo "  → http://$SERVER_IP"
echo ""
echo "API Documentation available at:"
echo "  → http://$SERVER_IP/docs"
echo ""
echo "Next steps:"
echo "  1. Set up your domain DNS to point to: $SERVER_IP"
echo "  2. Run the SSL setup script to enable HTTPS"
echo "  3. Update .env.production with your domain name"
echo ""
echo "To view logs:"
echo "  docker-compose -f $APP_DIR/docker-compose.prod.yml logs -f"
echo ""
echo "To stop the application:"
echo "  docker-compose -f $APP_DIR/docker-compose.prod.yml down"
echo ""
print_info "Happy trading! 📈"
