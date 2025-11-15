# Deployment Guide for vibe.marketcalls.in

## Server Details
- **Domain**: vibe.marketcalls.in
- **IP Address**: 65.20.83.180
- **Server**: Ubuntu
- **RAM**: 3.4GB
- **DNS**: A record should point to 65.20.83.180

## Pre-Deployment Checklist

Before starting deployment, ensure:

1. **DNS is configured**: Your A record for `vibe.marketcalls.in` points to `65.20.83.180`
2. **SSH access**: You can connect to `root@65.20.83.180`
3. **Domain propagation**: Check with `nslookup vibe.marketcalls.in` (should return 65.20.83.180)

## Step-by-Step Deployment

### Step 1: Push Configuration to GitHub

First, commit and push all the deployment files:

```bash
# On your local machine
cd "D:\AI Bootcamp 2025\Session18\trading-journal"

git add .
git commit -m "Add production deployment configuration for vibe.marketcalls.in"
git push origin master
```

### Step 2: Connect to Your Server

```bash
ssh root@65.20.83.180
```

### Step 3: Run Automated Deployment

Choose one of these methods:

#### Method A: Quick One-Line Deployment (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/marketcalls/trading-journal/master/deploy.sh | sudo bash
```

#### Method B: Download and Run Script

```bash
# Download deployment script
curl -o deploy.sh https://raw.githubusercontent.com/marketcalls/trading-journal/master/deploy.sh

# Make executable
chmod +x deploy.sh

# Run deployment
sudo ./deploy.sh
```

The script will:
- ✓ Update system packages
- ✓ Install Docker and Docker Compose
- ✓ Configure firewall (ports 22, 80, 443)
- ✓ Clone your repository to `/opt/vibe-journal`
- ✓ Generate secure SECRET_KEY
- ✓ Build and start all containers
- ✓ Display access information

**Deployment time**: ~5-10 minutes (depending on download speeds)

### Step 4: Verify Deployment

After deployment completes, test the application:

```bash
# Check if containers are running
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml ps

# Should show 3 running containers:
# - vibe-journal-backend
# - vibe-journal-frontend
# - vibe-journal-nginx

# Test HTTP access
curl -I http://vibe.marketcalls.in
curl -I http://65.20.83.180
```

Visit in your browser:
- **Application**: http://vibe.marketcalls.in
- **API Docs**: http://vibe.marketcalls.in/docs

### Step 5: Set Up SSL/HTTPS (Highly Recommended)

Once HTTP is working, add SSL for secure HTTPS:

```bash
# Download SSL setup script
curl -o setup-ssl.sh https://raw.githubusercontent.com/marketcalls/trading-journal/master/setup-ssl.sh

# Make executable
chmod +x setup-ssl.sh

# Run SSL setup
sudo ./setup-ssl.sh
```

When prompted:
- **Domain name**: `vibe.marketcalls.in`
- **Email**: Your email address (for SSL renewal notifications)

The script will:
- ✓ Install Certbot
- ✓ Obtain Let's Encrypt SSL certificate
- ✓ Update Nginx configuration for HTTPS
- ✓ Redirect HTTP → HTTPS
- ✓ Set up auto-renewal (daily at 3 AM)
- ✓ Rebuild containers with SSL

**After SSL setup**, your application will be accessible at:
- **Secure URL**: https://vibe.marketcalls.in
- **API Docs**: https://vibe.marketcalls.in/docs

## Post-Deployment Configuration

### 1. Create Your Admin Account

1. Visit https://vibe.marketcalls.in
2. Click **"Register"**
3. Fill in your details:
   - Email
   - Username
   - Password
   - Full Name
4. Click **"Register"**

Your first account is automatically an **admin account**.

### 2. Test the Application

1. **Create a Portfolio**:
   - Name: "My Trading Portfolio"
   - Initial Balance: ₹100,000

2. **Add a Sample Trade**:
   - Symbol: RELIANCE
   - Type: Long
   - Entry Price: ₹2,500
   - Quantity: 10
   - Entry Date: Today

3. **Close the Trade**:
   - Exit Price: ₹2,550
   - Exit Date: Today
   - Check if P&L is calculated correctly

4. **Upload Screenshot**:
   - Test file upload functionality

5. **View Analytics**:
   - Check dashboard metrics
   - Verify charts are working

### 3. Verify SSL Certificate

```bash
# Check SSL certificate details
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run
```

## Monitoring and Maintenance

### View Application Logs

```bash
# All services
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs -f

# Backend only
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs -f backend

# Frontend only
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs -f frontend

# Nginx only
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs -f nginx
```

### Restart Services

```bash
# Restart all services
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml restart

# Restart specific service
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml restart backend
```

### Update Application

```bash
# Pull latest changes from GitHub
cd /opt/vibe-journal
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml --env-file .env.production down
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Backup Database

```bash
# Create backup directory
mkdir -p /opt/vibe-journal/backups

# Backup database
cp /opt/vibe-journal/backend/trade_journal.db \
   /opt/vibe-journal/backups/trade_journal_$(date +%Y%m%d_%H%M%S).db

# Backup uploads
tar -czf /opt/vibe-journal/backups/uploads_$(date +%Y%m%d_%H%M%S).tar.gz \
   /opt/vibe-journal/backend/uploads
```

### Set Up Automated Backups

```bash
# Create backup script
cat > /opt/backup-vibe-journal.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/vibe-journal/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
cp /opt/vibe-journal/backend/trade_journal.db $BACKUP_DIR/trade_journal_$DATE.db

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/vibe-journal/backend/uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

# Make executable
chmod +x /opt/backup-vibe-journal.sh

# Test backup
/opt/backup-vibe-journal.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup-vibe-journal.sh >> /var/log/vibe-journal-backup.log 2>&1") | crontab -
```

## Troubleshooting

### Application Not Accessible

```bash
# Check if containers are running
docker ps

# Check container logs for errors
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs

# Check if ports are open
sudo netstat -tlnp | grep -E ':(80|443)'

# Check firewall
sudo ufw status
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# View certificate expiry date
openssl s_client -connect vibe.marketcalls.in:443 -servername vibe.marketcalls.in 2>/dev/null | openssl x509 -noout -dates
```

### Database Issues

```bash
# Check if database exists
ls -lh /opt/vibe-journal/backend/trade_journal.db

# Check database permissions
sudo chmod 644 /opt/vibe-journal/backend/trade_journal.db

# View recent database logs
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs backend | grep -i database
```

### Performance Issues

```bash
# Check system resources
free -h
df -h

# Check Docker container stats
docker stats

# Check if swap is being used
swapon --show
```

### DNS Not Resolving

```bash
# Check DNS from server
nslookup vibe.marketcalls.in

# Check DNS from different location
# Visit: https://dnschecker.org/#A/vibe.marketcalls.in

# Flush DNS cache (if needed)
sudo systemd-resolve --flush-caches
```

## Security Best Practices

### 1. Change Default Secret Key

The deploy.sh script automatically generates a random SECRET_KEY. To verify:

```bash
cat /opt/vibe-journal/.env.production | grep SECRET_KEY
```

It should be a long random string, not the default "CHANGE_THIS..." text.

### 2. Regular Updates

```bash
# Update system packages weekly
sudo apt update && sudo apt upgrade -y

# Update Docker images monthly
cd /opt/vibe-journal
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Monitor Failed Login Attempts

```bash
# Check backend logs for failed authentication
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs backend | grep -i "401\|authentication"
```

### 4. Enable Fail2Ban (Optional)

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure for nginx
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Performance Optimization

### Monitor Application Performance

```bash
# Install monitoring tools
sudo apt install -y htop iotop

# Monitor in real-time
htop
```

### Check Application Metrics

```bash
# Container resource usage
docker stats

# Nginx access patterns
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs nginx | tail -100

# Backend response times
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs backend | grep -i "INFO:"
```

## Quick Command Reference

```bash
# Start application
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml up -d

# Stop application
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml down

# Restart application
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml restart

# View logs (live)
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml logs -f

# Update application
cd /opt/vibe-journal && git pull && docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f /opt/vibe-journal/docker-compose.prod.yml ps

# Backup database
cp /opt/vibe-journal/backend/trade_journal.db /opt/vibe-journal/backups/backup_$(date +%Y%m%d).db
```

## Expected Timeline

- **DNS Propagation**: 5 minutes - 48 hours (usually instant for new records)
- **Initial Deployment**: 5-10 minutes
- **SSL Setup**: 2-3 minutes
- **Total Setup Time**: ~15-20 minutes

## Access URLs

After successful deployment:

### HTTP (Initial)
- Application: http://vibe.marketcalls.in
- API Docs: http://vibe.marketcalls.in/docs

### HTTPS (After SSL Setup)
- Application: https://vibe.marketcalls.in
- API Docs: https://vibe.marketcalls.in/docs

## Support Contacts

- **Repository**: https://github.com/marketcalls/trading-journal
- **Issues**: https://github.com/marketcalls/trading-journal/issues

## Next Steps

1. ✓ Deploy application (Step 3)
2. ✓ Verify HTTP access (Step 4)
3. ✓ Set up SSL/HTTPS (Step 5)
4. ✓ Create admin account
5. ✓ Test functionality
6. ✓ Set up automated backups
7. ✓ Share with your trading community!

---

**Happy Trading!** 📈🚀

Your trading journal is now live at **https://vibe.marketcalls.in**
