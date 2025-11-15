# Deployment Guide - Vibe Journal on Ubuntu Server

This guide will walk you through deploying the Vibe Journal application on an Ubuntu server with Docker, Nginx, and optional SSL/HTTPS support.

## Server Requirements

- **OS**: Ubuntu 20.04 LTS or newer
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB
- **CPU**: 2 cores or more
- **Network**: Public IP address and domain name (for SSL)

## Current Server Information

- **IP Address**: 65.20.83.180
- **RAM**: 3.4GB (Available: 2.8GB)
- **Swap**: 2.9GB
- **OS**: Ubuntu (confirmed)

## Prerequisites

Before you begin, ensure you have:

1. SSH access to your Ubuntu server
2. Root or sudo privileges
3. A domain name pointed to your server IP (optional, for SSL)
4. Basic knowledge of Linux command line

## Deployment Methods

You can deploy in two ways:

### Option 1: Automated Deployment (Recommended)

Use the provided deployment script for a fully automated setup.

### Option 2: Manual Deployment

Follow step-by-step manual instructions for full control over the deployment process.

---

## Option 1: Automated Deployment

### Step 1: Connect to Your Server

```bash
ssh root@65.20.83.180
```

### Step 2: Download and Run Deployment Script

```bash
# Download the deployment script
curl -o deploy.sh https://raw.githubusercontent.com/marketcalls/trading-journal/master/deploy.sh

# Make it executable
chmod +x deploy.sh

# Run the deployment script
sudo ./deploy.sh
```

The script will automatically:
- Update system packages
- Install Docker and Docker Compose
- Configure firewall
- Clone your repository
- Set up the application
- Start all services

### Step 3: Access Your Application

After the script completes, your application will be available at:
- **Application**: http://65.20.83.180
- **API Docs**: http://65.20.83.180/docs

### Step 4: Set Up SSL (Optional but Recommended)

If you have a domain name:

```bash
# Download SSL setup script
curl -o setup-ssl.sh https://raw.githubusercontent.com/marketcalls/trading-journal/master/setup-ssl.sh

# Make it executable
chmod +x setup-ssl.sh

# Run SSL setup
sudo ./setup-ssl.sh
```

Follow the prompts to enter your domain name and email address.

---

## Option 2: Manual Deployment

### Step 1: Connect to Server

```bash
ssh root@65.20.83.180
```

### Step 2: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 3: Install Docker

```bash
# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Verify installation
docker --version
```

### Step 4: Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### Step 5: Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Reload firewall
sudo ufw reload

# Check status
sudo ufw status
```

### Step 6: Clone Repository

```bash
# Create application directory
sudo mkdir -p /opt/vibe-journal
cd /opt/vibe-journal

# Clone the repository
sudo git clone https://github.com/marketcalls/trading-journal.git .
```

### Step 7: Set Up Environment Variables

```bash
# Generate a secure secret key
SECRET_KEY=$(openssl rand -hex 32)

# Create production environment file
cat > .env.production <<EOF
# Production Environment Variables
SECRET_KEY=$SECRET_KEY
NEXT_PUBLIC_API_URL=http://65.20.83.180/api
EOF

# For domain-based deployment, replace with your domain:
# NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

### Step 8: Create Necessary Directories

```bash
# Create directories for data persistence
sudo mkdir -p backend/uploads
sudo mkdir -p nginx/ssl
sudo chmod 755 backend/uploads
```

### Step 9: Build and Start Containers

```bash
# Build and start all containers
sudo docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# This will build and start:
# - Backend (FastAPI)
# - Frontend (Next.js)
# - Nginx (Reverse Proxy)
```

### Step 10: Verify Deployment

```bash
# Check running containers
sudo docker-compose -f docker-compose.prod.yml ps

# View logs
sudo docker-compose -f docker-compose.prod.yml logs -f

# Check if services are responding
curl http://localhost
curl http://localhost/api/docs
```

### Step 11: Access Your Application

Your application should now be accessible at:
- **Application**: http://65.20.83.180
- **API Documentation**: http://65.20.83.180/docs

---

## SSL/HTTPS Setup with Let's Encrypt

### Prerequisites for SSL

1. A registered domain name (e.g., tradingjournal.com)
2. DNS A record pointing to your server IP (65.20.83.180)
3. Domain propagation completed (check with: `nslookup yourdomain.com`)

### Automated SSL Setup

```bash
cd /opt/vibe-journal

# Run SSL setup script
sudo ./setup-ssl.sh

# Enter your domain name when prompted
# Enter your email address for Let's Encrypt notifications
```

The script will:
- Install Certbot
- Obtain SSL certificates
- Update Nginx configuration
- Enable HTTPS
- Set up auto-renewal

### Manual SSL Setup

If you prefer manual setup:

```bash
# Install Certbot
sudo apt install -y certbot

# Stop Nginx container temporarily
sudo docker-compose -f docker-compose.prod.yml stop nginx

# Obtain certificate
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/vibe-journal/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/vibe-journal/nginx/ssl/
sudo chmod 644 /opt/vibe-journal/nginx/ssl/fullchain.pem
sudo chmod 600 /opt/vibe-journal/nginx/ssl/privkey.pem

# Update nginx configuration
cd /opt/vibe-journal
sudo nano nginx/nginx.conf

# In nginx.conf:
# 1. Comment out the initial HTTP server block (lines starting with "# HTTP Server (use this initially")
# 2. Uncomment the HTTPS server block
# 3. Uncomment the HTTP to HTTPS redirect block
# 4. Replace "your-domain.com" with your actual domain

# Update .env.production
sudo nano .env.production
# Change NEXT_PUBLIC_API_URL to: https://yourdomain.com/api

# Rebuild and restart
sudo docker-compose -f docker-compose.prod.yml --env-file .env.production down
sudo docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Set up auto-renewal
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'cp /etc/letsencrypt/live/yourdomain.com/*.pem /opt/vibe-journal/nginx/ssl/ && docker-compose -f /opt/vibe-journal/docker-compose.prod.yml restart nginx'") | crontab -
```

---

## Maintenance and Management

### View Logs

```bash
# All services
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs -f

# Backend only
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs -f backend

# Frontend only
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs -f frontend

# Nginx only
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs -f nginx
```

### Restart Services

```bash
# Restart all services
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml restart

# Restart specific service
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml restart backend
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml restart frontend
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml restart nginx
```

### Stop Services

```bash
# Stop all services
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml down

# Stop and remove volumes (WARNING: This will delete data)
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml down -v
```

### Update Application

```bash
cd /opt/vibe-journal

# Pull latest changes
sudo git pull

# Rebuild and restart
sudo docker-compose -f docker-compose.prod.yml --env-file .env.production down
sudo docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Backup Database

```bash
# Create backup directory
sudo mkdir -p /opt/vibe-journal/backups

# Backup SQLite database
sudo cp /opt/vibe-journal/backend/trade_journal.db \
  /opt/vibe-journal/backups/trade_journal_$(date +%Y%m%d_%H%M%S).db

# Backup uploads
sudo tar -czf /opt/vibe-journal/backups/uploads_$(date +%Y%m%d_%H%M%S).tar.gz \
  /opt/vibe-journal/backend/uploads
```

### Restore Database

```bash
# Stop services
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml down

# Restore database
sudo cp /opt/vibe-journal/backups/trade_journal_YYYYMMDD_HHMMSS.db \
  /opt/vibe-journal/backend/trade_journal.db

# Start services
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml --env-file .env.production up -d
```

### Monitor Resources

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check Docker container stats
docker stats

# Check system resources
htop  # (install with: sudo apt install htop)
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check container status
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml ps

# Check logs for errors
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs

# Remove and rebuild
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml down
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml up -d --build
```

### Cannot Access Application

```bash
# Check if containers are running
sudo docker ps

# Check if ports are listening
sudo netstat -tlnp | grep -E ':(80|443|3000|8000)'

# Check firewall rules
sudo ufw status

# Check Nginx configuration
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml exec nginx nginx -t
```

### Database Issues

```bash
# Check if database file exists
ls -lh /opt/vibe-journal/backend/trade_journal.db

# Check permissions
sudo chmod 644 /opt/vibe-journal/backend/trade_journal.db

# Reset database (WARNING: This will delete all data)
sudo rm /opt/vibe-journal/backend/trade_journal.db
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml restart backend
```

### SSL Certificate Issues

```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Check certificate expiry
sudo certbot certificates

# Force certificate renewal
sudo certbot renew --force-renewal
```

### High Memory Usage

```bash
# Check container memory usage
docker stats

# Restart specific service
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml restart backend

# Clear Docker cache
sudo docker system prune -a
```

---

## Security Best Practices

### 1. Change Default Secret Key

```bash
# Generate a new secret key
openssl rand -hex 32

# Update .env.production
sudo nano /opt/vibe-journal/.env.production
# Replace SECRET_KEY with the newly generated key

# Restart services
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml restart
```

### 2. Enable Firewall

```bash
# Only allow necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Regular Updates

```bash
# Update system packages weekly
sudo apt update && sudo apt upgrade -y

# Update Docker images monthly
cd /opt/vibe-journal
sudo docker-compose -f docker-compose.prod.yml pull
sudo docker-compose -f docker-compose.prod.yml up -d
```

### 4. Monitor Logs

```bash
# Check for suspicious activity
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs nginx | grep -i error
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs backend | grep -i error
```

### 5. Backup Regularly

Set up automated backups:

```bash
# Create backup script
sudo nano /opt/backup-vibe-journal.sh

# Add the following content:
#!/bin/bash
BACKUP_DIR="/opt/vibe-journal/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /opt/vibe-journal/backend/trade_journal.db $BACKUP_DIR/trade_journal_$DATE.db
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/vibe-journal/backend/uploads
# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

# Make executable
sudo chmod +x /opt/backup-vibe-journal.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup-vibe-journal.sh") | crontab -
```

---

## Performance Optimization

### 1. Enable Gzip Compression

Already configured in nginx.conf

### 2. Enable Caching

Already configured for static assets in nginx.conf

### 3. Monitor Performance

```bash
# Install monitoring tools
sudo apt install -y htop iotop

# Monitor in real-time
htop
```

### 4. Optimize Docker

```bash
# Clean up unused Docker resources
sudo docker system prune -a

# Limit container resources (optional)
# Edit docker-compose.prod.yml and add under each service:
# deploy:
#   resources:
#     limits:
#       cpus: '1'
#       memory: 512M
```

---

## Production Checklist

Before going live, ensure:

- [ ] Server has adequate resources (RAM, CPU, Storage)
- [ ] Firewall is properly configured
- [ ] Secret key is changed from default
- [ ] SSL/HTTPS is enabled (if using domain)
- [ ] Domain DNS is pointing to server IP
- [ ] Backup system is in place
- [ ] Logs are being monitored
- [ ] System updates are scheduled
- [ ] All services are running (`docker-compose ps`)
- [ ] Application is accessible from internet
- [ ] API documentation is accessible
- [ ] First admin user is created
- [ ] Application is tested with real trades

---

## Quick Reference Commands

```bash
# Start application
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml --env-file .env.production up -d

# Stop application
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml down

# Restart application
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml restart

# View logs
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs -f

# Update application
cd /opt/vibe-journal && sudo git pull && sudo docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Backup database
sudo cp /opt/vibe-journal/backend/trade_journal.db /opt/vibe-journal/backups/trade_journal_$(date +%Y%m%d).db

# Check status
sudo docker-compose -f /opt/vibe-journal/docker-compose.prod.yml ps
```

---

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review logs for error messages
3. Create an issue on GitHub: https://github.com/marketcalls/trading-journal/issues
4. Ensure all prerequisites are met

---

## License

This deployment guide is part of the Vibe Journal project and is available for educational purposes.

Happy Trading! 📈
