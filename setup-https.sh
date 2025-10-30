#!/bin/bash
# Setup HTTPS for Red Corner Dashboard
# Run this on your Lightsail server

set -e

echo "================================"
echo "Red Corner Dashboard - HTTPS Setup"
echo "================================"
echo ""

# Fix DNS first
echo "Step 1: Fixing DNS resolution..."
sudo bash -c 'echo "nameserver 8.8.8.8
nameserver 8.8.4.4
nameserver 1.1.1.1" > /etc/resolv.conf'

# Make DNS persistent
if [ -f /etc/systemd/resolved.conf ]; then
    sudo sed -i 's/#DNS=/DNS=8.8.8.8 8.8.4.4/' /etc/systemd/resolved.conf
    sudo systemctl restart systemd-resolved 2>/dev/null || true
fi

echo "✓ DNS configured"
echo ""

# Test DNS
echo "Step 2: Testing DNS resolution..."
if ! host google.com > /dev/null 2>&1; then
    echo "❌ DNS still not working. Please check your network configuration."
    exit 1
fi
echo "✓ DNS is working"
echo ""

# Update and install Nginx + Certbot
echo "Step 3: Installing Nginx and Certbot..."
sudo apt-get update -qq
sudo apt-get install -y nginx certbot python3-certbot-nginx

echo "✓ Nginx and Certbot installed"
echo ""

# Check if dashboard is running
echo "Step 4: Checking if dashboard is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️  Warning: Dashboard doesn't seem to be running on port 3000"
    echo "   Make sure your Node.js app is running before continuing"
    read -p "   Press Enter to continue anyway, or Ctrl+C to exit..."
fi
echo "✓ Dashboard check complete"
echo ""

# Get domain from user
echo "Step 5: Domain configuration"
echo "What domain should we use?"
echo "Examples: dashboard.redcorner.com.au"
echo ""
read -p "Enter domain name: " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ No domain entered. Exiting."
    exit 1
fi

echo ""
echo "Using domain: $DOMAIN"
echo ""

# Check if DNS is pointing here
echo "Step 6: Checking DNS..."
CURRENT_IP=$(curl -s http://checkip.amazonaws.com)
DNS_IP=$(dig +short "$DOMAIN" @8.8.8.8 | tail -n1)

echo "Current server IP: $CURRENT_IP"
echo "DNS resolves to: $DNS_IP"

if [ "$CURRENT_IP" != "$DNS_IP" ]; then
    echo ""
    echo "⚠️  WARNING: DNS is not pointing to this server yet!"
    echo ""
    echo "Go to Wix DNS settings and add:"
    echo "  Type: A"
    echo "  Host: dashboard (or your subdomain)"
    echo "  Points To: $CURRENT_IP"
    echo "  TTL: 1 Hour"
    echo ""
    echo "Wait 10-15 minutes for DNS to propagate, then run this script again."
    exit 1
fi

echo "✓ DNS is correctly configured"
echo ""

# Create Nginx configuration
echo "Step 7: Configuring Nginx..."
sudo tee /etc/nginx/sites-available/redcorner-dashboard > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/redcorner-dashboard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
if ! sudo nginx -t; then
    echo "❌ Nginx configuration error"
    exit 1
fi

# Restart Nginx
sudo systemctl restart nginx

echo "✓ Nginx configured"
echo ""

# Get SSL certificate
echo "Step 8: Getting SSL certificate from Let's Encrypt..."
echo "This may take a minute..."
echo ""

sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@redcorner.com.au --redirect

if [ $? -eq 0 ]; then
    echo ""
    echo "================================"
    echo "✅ SUCCESS!"
    echo "================================"
    echo ""
    echo "Your dashboard is now available at:"
    echo "  https://$DOMAIN"
    echo ""
    echo "Certificate will auto-renew every 90 days."
    echo ""
    echo "Open ports 80 and 443 in Lightsail firewall if not already open."
    echo ""
else
    echo ""
    echo "❌ SSL certificate installation failed"
    echo ""
    echo "This usually means:"
    echo "  1. DNS is not fully propagated yet (wait longer)"
    echo "  2. Port 80 is not open in Lightsail firewall"
    echo "  3. Another service is using port 80"
    echo ""
    echo "Check and try again."
    exit 1
fi
