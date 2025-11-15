#!/bin/bash

# SSL Setup Script for Vibe Journal using Let's Encrypt
# This script will set up SSL certificates for your domain

set -e  # Exit on error

echo "=========================================="
echo "SSL Setup Script for Vibe Journal"
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

# Get domain name from user
print_info "Please enter your domain name (e.g., example.com):"
read -r DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    print_error "Domain name cannot be empty"
    exit 1
fi

print_info "Please enter your email address for Let's Encrypt notifications:"
read -r EMAIL

if [ -z "$EMAIL" ]; then
    print_error "Email address cannot be empty"
    exit 1
fi

echo ""
print_info "Domain: $DOMAIN_NAME"
print_info "Email: $EMAIL"
echo ""
print_info "Setting up SSL for $DOMAIN_NAME..."
echo ""

APP_DIR="/opt/vibe-journal"

# Install certbot
print_info "Installing Certbot..."
apt update
apt install -y certbot
print_success "Certbot installed"
echo ""

# Stop nginx container temporarily
print_info "Stopping nginx container..."
cd "$APP_DIR"
docker-compose -f docker-compose.prod.yml stop nginx
print_success "Nginx stopped"
echo ""

# Obtain SSL certificate
print_info "Obtaining SSL certificate from Let's Encrypt..."
certbot certonly --standalone \
    -d "$DOMAIN_NAME" \
    -d "www.$DOMAIN_NAME" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --preferred-challenges http

if [ $? -eq 0 ]; then
    print_success "SSL certificate obtained successfully"
else
    print_error "Failed to obtain SSL certificate"
    docker-compose -f docker-compose.prod.yml start nginx
    exit 1
fi
echo ""

# Copy certificates to nginx directory
print_info "Copying certificates to nginx directory..."
mkdir -p "$APP_DIR/nginx/ssl"
cp "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" "$APP_DIR/nginx/ssl/"
cp "/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem" "$APP_DIR/nginx/ssl/"
chmod 644 "$APP_DIR/nginx/ssl/fullchain.pem"
chmod 600 "$APP_DIR/nginx/ssl/privkey.pem"
print_success "Certificates copied"
echo ""

# Update nginx configuration
print_info "Updating nginx configuration for HTTPS..."
NGINX_CONF="$APP_DIR/nginx/nginx.conf"

# Backup original configuration
cp "$NGINX_CONF" "$NGINX_CONF.backup"

# Update server_name in nginx.conf
sed -i "s/your-domain.com/$DOMAIN_NAME/g" "$NGINX_CONF"

# Uncomment HTTPS server block
sed -i '/# HTTPS Server/,/# }$/s/^    # /    /' "$NGINX_CONF"
sed -i '/# HTTP Server - Redirect to HTTPS/,/# }/s/^    # /    /' "$NGINX_CONF"

# Comment out the initial HTTP server block
sed -i '/# HTTP Server (use this initially/,/^    }$/s/^    /    # /' "$NGINX_CONF"

print_success "Nginx configuration updated"
echo ""

# Update .env.production with HTTPS URL
print_info "Updating .env.production with HTTPS URL..."
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://$DOMAIN_NAME/api|" "$APP_DIR/.env.production"
print_success ".env.production updated"
echo ""

# Rebuild and restart containers
print_info "Rebuilding and restarting containers..."
cd "$APP_DIR"
docker-compose -f docker-compose.prod.yml --env-file .env.production down
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
print_success "Containers restarted with SSL"
echo ""

# Set up automatic certificate renewal
print_info "Setting up automatic certificate renewal..."
CRON_JOB="0 3 * * * certbot renew --quiet --post-hook 'cp /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem $APP_DIR/nginx/ssl/ && cp /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem $APP_DIR/nginx/ssl/ && docker-compose -f $APP_DIR/docker-compose.prod.yml restart nginx'"

# Add to crontab if not already present
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -
print_success "Automatic renewal configured"
echo ""

# Test certificate renewal
print_info "Testing certificate renewal..."
certbot renew --dry-run
if [ $? -eq 0 ]; then
    print_success "Certificate renewal test passed"
else
    print_error "Certificate renewal test failed - please check manually"
fi
echo ""

echo "=========================================="
print_success "SSL Setup completed successfully!"
echo "=========================================="
echo ""
echo "Your application is now running with HTTPS at:"
echo "  → https://$DOMAIN_NAME"
echo "  → https://www.$DOMAIN_NAME"
echo ""
echo "Certificate will auto-renew every 3 AM daily"
echo ""
echo "To manually renew the certificate:"
echo "  certbot renew"
echo ""
print_info "Enjoy your secure trading journal! 🔒📈"
