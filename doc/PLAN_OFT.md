# Oracle Cloud Free Tier Deployment Guide

**Application:** Christmas Spotify Playlist Uploader
**Platform:** Oracle Cloud Infrastructure (OCI) Always Free Tier
**SSL:** Let's Encrypt with automatic renewal
**Date:** December 15, 2025

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Oracle Cloud Free Tier Resources](#oracle-cloud-free-tier-resources)
4. [Phase 1: Oracle Cloud Account Setup](#phase-1-oracle-cloud-account-setup)
5. [Phase 2: VM Instance Creation](#phase-2-vm-instance-creation)
6. [Phase 3: Network & Security Configuration](#phase-3-network--security-configuration)
7. [Phase 4: Domain & DNS Setup](#phase-4-domain--dns-setup)
8. [Phase 5: Server Initial Setup](#phase-5-server-initial-setup)
9. [Phase 6: Docker Installation](#phase-6-docker-installation)
10. [Phase 7: Application Deployment](#phase-7-application-deployment)
11. [Phase 8: SSL Certificate with Let's Encrypt](#phase-8-ssl-certificate-with-lets-encrypt)
12. [Phase 9: Nginx Reverse Proxy](#phase-9-nginx-reverse-proxy)
13. [Phase 10: Monitoring & Maintenance](#phase-10-monitoring--maintenance)
14. [Troubleshooting](#troubleshooting)
15. [Cost Optimization](#cost-optimization)

---

## Overview

This guide deploys the Christmas Spotify Playlist Uploader to Oracle Cloud's Always Free Tier using:
- **ARM-based Ampere A1 compute** (4 OCPUs, 24 GB RAM)
- **Docker Compose** for container orchestration
- **Let's Encrypt** for free SSL/TLS certificates
- **Nginx** as reverse proxy for HTTPS termination
- **Certbot** for automatic certificate renewal

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Oracle Cloud Free Tier                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  VM.Standard.A1.Flex (ARM Ampere A1)                       │ │
│  │  4 OCPUs, 24 GB RAM, 200 GB Storage                        │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │ Nginx (Reverse Proxy)                                  │ │ │
│  │  │ Port 80 → 443 redirect                                 │ │ │
│  │  │ Port 443 → Application (HTTPS with Let's Encrypt)      │ │ │
│  │  └────────────────┬───────────────────────────────────────┘ │ │
│  │                   │                                          │ │
│  │  ┌────────────────▼───────────────────────────────────────┐ │ │
│  │  │ Docker Compose Stack                                   │ │ │
│  │  │                                                          │ │ │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │ │
│  │  │  │  Frontend    │  │   Backend    │  │   MongoDB    │  │ │ │
│  │  │  │  (Nginx)     │  │  (Express)   │  │   (Data)     │  │ │ │
│  │  │  │  Port 80     │  │  Port 3000   │  │  Port 27017  │  │ │ │
│  │  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │ │
│  │  │                                                          │ │ │
│  │  │  ┌──────────────┐                                       │ │ │
│  │  │  │ Backup Svc   │                                       │ │ │
│  │  │  │ (Daily)      │                                       │ │ │
│  │  │  └──────────────┘                                       │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Internet Gateway → Security List (Firewall)                    │
│  - Port 80 (HTTP)                                               │
│  - Port 443 (HTTPS)                                             │
│  - Port 22 (SSH)                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Let's Encrypt (SSL/TLS)
                    Spotify Web API
```

---

## Prerequisites

### Required Items
- [ ] Oracle Cloud account (free sign-up)
- [ ] Domain name (required for SSL certificate)
- [ ] Spotify Developer credentials (Client ID & Secret)
- [ ] SSH key pair for server access
- [ ] Local terminal with SSH client

### Recommended Knowledge
- Basic Linux command line
- Docker fundamentals
- DNS configuration
- SSH key management

---

## Oracle Cloud Free Tier Resources

### Always Free Tier Includes:

| Resource | Specification | Notes |
|----------|--------------|-------|
| **Compute** | 4 OCPUs Ampere A1 (ARM) | Or 2 AMD VMs (1/8 OCPU, 1GB each) |
| **Memory** | 24 GB RAM total | Flexible allocation |
| **Storage** | 200 GB Block Volume | Boot + additional volumes |
| **Network** | 10 TB/month outbound | Inbound is free |
| **Public IP** | 2 IPv4 addresses | Reserved IPs |
| **Load Balancer** | 1 instance, 10 Mbps | Optional |
| **Database** | 2 Autonomous Databases | 20 GB each (not needed) |

### Resource Allocation for This Application

**Recommended VM Configuration:**
- **Shape:** VM.Standard.A1.Flex
- **OCPUs:** 2-4 (we'll use 2 to stay safe)
- **Memory:** 12 GB (adequate for all containers)
- **Boot Volume:** 100 GB
- **OS:** Ubuntu 22.04 LTS (ARM64)

**Why These Choices:**
- ARM Ampere A1 is more powerful than AMD free tier
- 2 OCPUs + 12 GB RAM leaves headroom (avoiding 20% idle reclaim)
- Ubuntu 22.04 has excellent ARM support
- Leaves resources for future scaling

---

## Phase 1: Oracle Cloud Account Setup

### 1.1 Create Oracle Cloud Account

1. Visit [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
2. Click **"Start for free"**
3. Fill in account details:
   - Email address
   - Country/Territory
   - Account name (choose wisely, cannot change)
4. Verify email address
5. Provide payment information (required but **not charged** for Always Free resources)
6. Complete identity verification
7. Choose **Home Region** (cannot change later)
   - Choose closest region for best latency
   - Example: eu-frankfurt-1, eu-amsterdam-1, us-ashburn-1

### 1.2 Access Oracle Cloud Console

1. Go to [cloud.oracle.com](https://cloud.oracle.com)
2. Sign in with your credentials
3. Note your **tenancy name** (shown after login)

---

## Phase 2: VM Instance Creation

### 2.1 Create Compute Instance

1. **Navigate to Compute Instances:**
   - Oracle Cloud Console → ☰ Menu → Compute → Instances
   - Click **"Create Instance"**

2. **Configure Instance:**

   **Name:**
   ```
   spotify-uploader-prod
   ```

   **Placement:**
   - Availability Domain: (select any available AD)
   - Fault Domain: (leave default)

   **Image and Shape:**
   - Click **"Change Image"**
     - Platform image: **Ubuntu 22.04 Minimal (ARM64)**
     - Or: **Canonical Ubuntu 22.04 aarch64**
     - Click **"Select Image"**

   - Click **"Change Shape"**
     - Instance type: **Virtual Machine**
     - Shape series: **Ampere**
     - Shape: **VM.Standard.A1.Flex**
     - OCPUs: **2** (adjustable 1-4)
     - Memory: **12 GB** (adjustable 1-24 GB)
     - Click **"Select Shape"**

   **Networking:**
   - VCN: Create new virtual cloud network
     - Name: `spotify-uploader-vcn`
   - Subnet: Create new public subnet
     - Name: `spotify-uploader-subnet`
   - ✅ **Assign a public IPv4 address**

   **Add SSH Keys:**
   - ⚪ Generate a key pair for me (download both keys)
   - OR
   - ⚪ Upload public key files (`.pub` file)
   - OR
   - ⚪ Paste public keys (paste contents of `~/.ssh/id_rsa.pub`)

   **Boot Volume:**
   - Size: **100 GB** (default is 47 GB minimum)
   - Performance: Balanced
   - ✅ Use in-transit encryption

3. **Create the Instance:**
   - Click **"Create"**
   - Wait 1-2 minutes for provisioning
   - Instance state will change: Provisioning → Running

4. **Note Important Information:**
   ```
   Public IP Address: xxx.xxx.xxx.xxx
   Username: ubuntu
   Private Key: (location of your SSH private key)
   ```

---

## Phase 3: Network & Security Configuration

### 3.1 Configure VCN Security List (Firewall)

1. **Navigate to VCN:**
   - ☰ Menu → Networking → Virtual Cloud Networks
   - Click on `spotify-uploader-vcn`
   - Click **"Security Lists"** (left menu)
   - Click **"Default Security List for spotify-uploader-vcn"**

2. **Add Ingress Rules:**

   Click **"Add Ingress Rules"** for each of these:

   **Rule 1: HTTP (Port 80)**
   ```
   Source Type: CIDR
   Source CIDR: 0.0.0.0/0
   IP Protocol: TCP
   Source Port Range: All
   Destination Port Range: 80
   Description: HTTP traffic for Let's Encrypt validation
   ```

   **Rule 2: HTTPS (Port 443)**
   ```
   Source Type: CIDR
   Source CIDR: 0.0.0.0/0
   IP Protocol: TCP
   Source Port Range: All
   Destination Port Range: 443
   Description: HTTPS traffic for web application
   ```

   **Rule 3: SSH (Port 22)** - Usually already exists
   ```
   Source Type: CIDR
   Source CIDR: 0.0.0.0/0
   IP Protocol: TCP
   Source Port Range: All
   Destination Port Range: 22
   Description: SSH access
   ```

   **Optional - Restrict SSH to your IP:**
   ```
   Source CIDR: YOUR_IP_ADDRESS/32
   ```

3. **Verify Ingress Rules:**
   You should now have ingress rules for ports: 22, 80, 443

### 3.2 Configure Ubuntu Firewall (UFW)

We'll configure this later after SSH access is established.

---

## Phase 4: Domain & DNS Setup

### 4.1 Domain Requirements

You need a domain name for Let's Encrypt SSL certificates. Options:

1. **Use existing domain** (e.g., example.com)
2. **Register new domain:**
   - Namecheap ($8-15/year for .com)
   - Google Domains
   - Cloudflare Registrar
3. **Free subdomain services** (not recommended for production):
   - DuckDNS (free)
   - No-IP (free tier)

### 4.2 Configure DNS Records

Add DNS records pointing to your Oracle Cloud VM's public IP:

**Required DNS Records:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | xxx.xxx.xxx.xxx | 300 |
| A | www | xxx.xxx.xxx.xxx | 300 |

**Example with domain `spotify-uploader.com`:**
```
A     @               xxx.xxx.xxx.xxx   300
A     www             xxx.xxx.xxx.xxx   300
CNAME spotify-app     @                 300
```

**Access patterns:**
- https://spotify-uploader.com
- https://www.spotify-uploader.com

### 4.3 Verify DNS Propagation

```bash
# Wait 5-30 minutes, then verify DNS
nslookup spotify-uploader.com
dig spotify-uploader.com

# Should return your Oracle Cloud public IP
```

---

## Phase 5: Server Initial Setup

### 5.1 Connect to Your VM

```bash
# Set correct permissions on private key
chmod 600 ~/path/to/ssh-key-*.key

# SSH to your instance
ssh -i ~/path/to/ssh-key-*.key ubuntu@YOUR_PUBLIC_IP

# First connection will ask to verify fingerprint, type 'yes'
```

### 5.2 Update System

```bash
# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y \
  curl \
  wget \
  git \
  htop \
  nano \
  vim \
  ufw \
  unzip \
  software-properties-common \
  ca-certificates \
  gnupg \
  lsb-release
```

### 5.3 Configure Firewall (UFW)

```bash
# Configure Ubuntu firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

Expected output:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

### 5.4 Configure Swap (Recommended)

```bash
# Create 4GB swap file (helps with 12GB RAM)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify swap
free -h
```

### 5.5 Set Timezone

```bash
# Set timezone (adjust to your location)
sudo timedatectl set-timezone Europe/Oslo

# Verify
timedatectl
```

---

## Phase 6: Docker Installation

### 6.1 Install Docker Engine (ARM64)

```bash
# Remove old versions (if any)
sudo apt remove docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository (ARM64)
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index
sudo apt update

# Install Docker Engine
sudo apt install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

Expected output:
```
Docker version 24.x.x, build xxxxx
Docker Compose version v2.x.x
```

### 6.2 Configure Docker for Non-Root User

```bash
# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Apply group changes
newgrp docker

# Verify (should work without sudo)
docker ps
```

### 6.3 Configure Docker Daemon

```bash
# Create daemon config for production
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true
}
EOF

# Restart Docker
sudo systemctl restart docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Verify status
sudo systemctl status docker
```

---

## Phase 7: Application Deployment

### 7.1 Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/YOUR_USERNAME/spotifyuploader.git
cd spotifyuploader

# Or if using alternative method, create directory structure
mkdir -p ~/spotifyuploader
cd ~/spotifyuploader
```

If you don't have a git repository yet, transfer files using SCP:

```bash
# From your local machine:
scp -i ~/path/to/ssh-key.key -r /path/to/local/spotifyuploader ubuntu@YOUR_PUBLIC_IP:~/

# Then SSH back to the server
ssh -i ~/path/to/ssh-key.key ubuntu@YOUR_PUBLIC_IP
cd ~/spotifyuploader
```

### 7.2 Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Generate session secret
openssl rand -base64 32

# Edit .env file
nano .env
```

**Update `.env` with your domain and credentials:**

```bash
# Spotify API Credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here

# Spotify Redirect URI - IMPORTANT: Use your domain!
SPOTIFY_REDIRECT_URI=https://your-domain.com/auth/callback

# Session Secret
SESSION_SECRET=your_generated_secret_from_openssl_command

# Frontend URL - Use your domain
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# Port (Nginx will handle 443, app listens on 8080 internally)
PORT=8080

# Node Environment
NODE_ENV=production

# Database Backup Configuration
BACKUP_RETENTION_DAYS=7

# Logging Configuration
LOG_LEVEL=info
```

**⚠️ CRITICAL: Update Spotify App Settings**

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Click **"Edit Settings"**
4. Update **Redirect URIs** to:
   ```
   https://your-domain.com/auth/callback
   ```
5. Click **"Save"**

### 7.3 Create Required Directories

```bash
# Create backups directory
mkdir -p ~/spotifyuploader/backups
touch ~/spotifyuploader/backups/.gitkeep

# Create logs directory (will be created by app, but good to have)
mkdir -p ~/spotifyuploader/backend/logs

# Set permissions
chmod 755 ~/spotifyuploader/backups
```

### 7.4 Update docker-compose for Production

Create a production-specific compose file:

```bash
nano docker-compose.oracle.yml
```

Add this configuration:

```yaml
services:
  mongodb:
    image: mongo:7
    container_name: spotify-uploader-mongodb-prod
    restart: always
    environment:
      MONGO_INITDB_DATABASE: spotify-uploader
    volumes:
      - mongodb_data_prod:/data/db
    networks:
      - spotify-network-prod
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/spotify-uploader --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: spotify-uploader-backend-prod
    restart: always
    depends_on:
      mongodb:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - PORT=3000
      - MONGO_URI=mongodb://mongodb:27017/spotify-uploader
      - SESSION_SECRET=${SESSION_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
      - FRONTEND_URL=${FRONTEND_URL}
      - SPOTIFY_CLIENT_ID=${SPOTIFY_CLIENT_ID}
      - SPOTIFY_CLIENT_SECRET=${SPOTIFY_CLIENT_SECRET}
      - SPOTIFY_REDIRECT_URI=${SPOTIFY_REDIRECT_URI}
      - LOG_LEVEL=${LOG_LEVEL}
    networks:
      - spotify-network-prod
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      start_period: 10s
      retries: 3
    volumes:
      - ./backend/logs:/app/logs

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: spotify-uploader-frontend-prod
    restart: always
    depends_on:
      - backend
    ports:
      - "${PORT:-8080}:80"
    networks:
      - spotify-network-prod
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 3s
      start_period: 5s
      retries: 3

  mongodb-backup:
    image: mongo:7
    container_name: spotify-uploader-backup-prod
    restart: always
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - spotify-network-prod
    volumes:
      - ./backups:/backups
    environment:
      - MONGO_URI=mongodb://mongodb:27017/spotify-uploader
      - BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
    command: >
      bash -c "
      echo '🎄 MongoDB Backup Service Started';
      while true; do
        TIMESTAMP=$$(date +%Y%m%d-%H%M%S);
        BACKUP_DIR=\"/backups/backup-$${TIMESTAMP}\";
        echo \"[$$(date +'%Y-%m-%d %H:%M:%S')] Starting backup...\";
        if mongodump --uri=\"$${MONGO_URI}\" --out=\"$${BACKUP_DIR}\" --quiet; then
          echo \"[$$(date +'%Y-%m-%d %H:%M:%S')] ✅ Backup completed\";
        fi;
        find /backups -maxdepth 1 -type d -name 'backup-*' -mtime +$${BACKUP_RETENTION_DAYS} -exec rm -rf {} + 2>/dev/null || true;
        sleep 86400;
      done
      "

networks:
  spotify-network-prod:
    driver: bridge

volumes:
  mongodb_data_prod:
```

### 7.5 Build and Start Application

```bash
# Build containers (this may take 5-10 minutes on ARM)
docker compose -f docker-compose.oracle.yml build

# Start application
docker compose -f docker-compose.oracle.yml up -d

# Check container status
docker ps

# Check logs
docker compose -f docker-compose.oracle.yml logs -f

# Verify backend is healthy
curl http://localhost:8080/health
```

Expected output:
```
{"status":"ok","timestamp":"2025-12-15T..."}
```

---

## Phase 8: SSL Certificate with Let's Encrypt

### 8.1 Install Certbot

```bash
# Install Certbot and Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### 8.2 Stop Temporary Services

```bash
# Temporarily stop app to free port 80 for Let's Encrypt validation
docker compose -f docker-compose.oracle.yml down
```

### 8.3 Obtain SSL Certificate

```bash
# Obtain certificate (replace with your domain and email)
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com \
  --http-01-port 80

# Or for interactive mode:
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

**Follow the prompts:**
1. Enter email address (for renewal notifications)
2. Agree to Terms of Service (Y)
3. Share email with EFF (optional, N)

Expected output:
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/your-domain.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### 8.4 Verify Certificate Files

```bash
# List certificate files
sudo ls -la /etc/letsencrypt/live/your-domain.com/

# Should show:
# cert.pem       - Your domain's certificate
# chain.pem      - Let's Encrypt chain certificate
# fullchain.pem  - cert.pem + chain.pem
# privkey.pem    - Your certificate's private key
```

### 8.5 Configure Automatic Renewal

```bash
# Test renewal process (dry run)
sudo certbot renew --dry-run

# If successful, certbot will auto-renew via systemd timer
# Check renewal timer
sudo systemctl status certbot.timer

# Enable timer (usually already enabled)
sudo systemctl enable certbot.timer
```

**Certbot automatically renews certificates within 30 days of expiration.**

---

## Phase 9: Nginx Reverse Proxy

### 9.1 Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Stop nginx temporarily
sudo systemctl stop nginx
```

### 9.2 Configure Nginx as Reverse Proxy

```bash
# Backup default config
sudo mv /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak

# Create new site configuration
sudo nano /etc/nginx/sites-available/spotify-uploader
```

Add this configuration (replace `your-domain.com`):

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL Configuration (Mozilla Intermediate)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/spotify-uploader-access.log;
    error_log /var/log/nginx/spotify-uploader-error.log;

    # Client upload size (for CSV files)
    client_max_body_size 10M;

    # Proxy settings
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Reverse proxy to Docker application
    location / {
        proxy_pass http://127.0.0.1:8080;
    }

    # Health check endpoint (optional, no auth required)
    location /health {
        proxy_pass http://127.0.0.1:8080/health;
        access_log off;
    }
}
```

### 9.3 Enable Site and Test Configuration

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/spotify-uploader /etc/nginx/sites-enabled/

# Remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Should output:
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 9.4 Start Services

```bash
# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Start application
cd ~/spotifyuploader
docker compose -f docker-compose.oracle.yml up -d

# Check status
docker ps
sudo systemctl status nginx
```

### 9.5 Verify HTTPS Access

```bash
# Test from server
curl -I https://your-domain.com

# Should return:
# HTTP/2 200
# server: nginx
# ...

# Test SSL certificate
curl -vI https://your-domain.com 2>&1 | grep -A 5 "SSL certificate"
```

**Open browser and navigate to:**
- https://your-domain.com

You should see:
- 🔒 Secure padlock icon
- Christmas Spotify Playlist Uploader login page
- Valid SSL certificate from Let's Encrypt

---

## Phase 10: Monitoring & Maintenance

### 10.1 Setup Log Rotation for Application Logs

```bash
# Create logrotate config for app logs
sudo nano /etc/logrotate.d/spotify-uploader
```

Add:

```
/home/ubuntu/spotifyuploader/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
}
```

### 10.2 Monitor Resource Usage

```bash
# Real-time monitoring
htop

# Docker stats
docker stats

# Disk usage
df -h

# Memory usage
free -h

# Check logs
docker compose -f docker-compose.oracle.yml logs -f --tail=100
```

### 10.3 Automated Health Checks

Create a monitoring script:

```bash
nano ~/check-health.sh
```

Add:

```bash
#!/bin/bash

# Check if containers are running
CONTAINERS=$(docker ps --format "{{.Names}}" | wc -l)
if [ "$CONTAINERS" -lt 4 ]; then
    echo "WARNING: Only $CONTAINERS containers running (expected 4)"
    # Send notification (email, webhook, etc.)
fi

# Check application health
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/health)
if [ "$HTTP_CODE" -ne 200 ]; then
    echo "WARNING: Application health check failed (HTTP $HTTP_CODE)"
    # Restart containers
    cd ~/spotifyuploader
    docker compose -f docker-compose.oracle.yml restart
fi

echo "Health check passed: $CONTAINERS containers, HTTP $HTTP_CODE"
```

Make executable and add to crontab:

```bash
chmod +x ~/check-health.sh

# Add to crontab (run every 5 minutes)
crontab -e

# Add this line:
*/5 * * * * /home/ubuntu/check-health.sh >> /home/ubuntu/health-check.log 2>&1
```

### 10.4 Backup Monitoring

```bash
# Check backup status
ls -lh ~/spotifyuploader/backups/

# Check backup logs
docker logs spotify-uploader-backup-prod --tail 50

# Manual backup
cd ~/spotifyuploader
./backup.sh
```

### 10.5 Oracle Cloud CPU Usage (Prevent Reclaim)

Oracle reclaims Always Free instances if CPU usage < 20% for 7 days.

**Monitor CPU usage:**

```bash
# Install monitoring
sudo apt install -y sysstat

# Check CPU average
mpstat 1 10
```

**If CPU consistently < 20%, add a keep-alive task:**

```bash
# Edit crontab
crontab -e

# Add: Run CPU-intensive task daily to prevent reclaim
0 3 * * * nice -n 19 gzip -9 /tmp/dummy-$(date +\%s).txt 2>/dev/null; find /tmp -name 'dummy-*.txt.gz' -delete
```

**Better approach:** Your application should maintain > 20% CPU usage naturally with:
- Regular health checks
- Daily backups
- Log rotation
- Monitoring scripts

### 10.6 Security Updates

```bash
# Create update script
nano ~/update-system.sh
```

Add:

```bash
#!/bin/bash
echo "Starting system update: $(date)"

# Update packages
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y

# Update Docker containers (rebuild with latest base images)
cd ~/spotifyuploader
docker compose -f docker-compose.oracle.yml pull
docker compose -f docker-compose.oracle.yml up -d --build

echo "Update complete: $(date)"
```

Make executable and schedule:

```bash
chmod +x ~/update-system.sh

# Add to crontab (run weekly on Sunday at 3 AM)
crontab -e

# Add:
0 3 * * 0 /home/ubuntu/update-system.sh >> /home/ubuntu/update.log 2>&1
```

---

## Troubleshooting

### Issue: Cannot connect to HTTPS

**Solution:**

1. Verify DNS is correctly configured:
   ```bash
   nslookup your-domain.com
   ```

2. Check Oracle Cloud Security List has port 443 open

3. Check UFW firewall:
   ```bash
   sudo ufw status
   ```

4. Check Nginx is running:
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

5. Check Nginx logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### Issue: SSL certificate error

**Solution:**

1. Verify certificate exists:
   ```bash
   sudo ls -la /etc/letsencrypt/live/your-domain.com/
   ```

2. Test certificate renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

3. Check certificate expiry:
   ```bash
   sudo certbot certificates
   ```

4. Manually renew if needed:
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

### Issue: Application not responding

**Solution:**

1. Check container status:
   ```bash
   docker ps
   docker compose -f docker-compose.oracle.yml ps
   ```

2. Check logs:
   ```bash
   docker compose -f docker-compose.oracle.yml logs backend
   docker compose -f docker-compose.oracle.yml logs frontend
   ```

3. Restart containers:
   ```bash
   docker compose -f docker-compose.oracle.yml restart
   ```

4. Full rebuild if needed:
   ```bash
   docker compose -f docker-compose.oracle.yml down
   docker compose -f docker-compose.oracle.yml up -d --build
   ```

### Issue: Spotify OAuth redirect failing

**Solution:**

1. Verify `SPOTIFY_REDIRECT_URI` in `.env`:
   ```
   SPOTIFY_REDIRECT_URI=https://your-domain.com/auth/callback
   ```

2. Check Spotify Developer Dashboard redirect URIs match exactly

3. Verify `FRONTEND_URL` and `CORS_ORIGIN` use HTTPS:
   ```
   FRONTEND_URL=https://your-domain.com
   CORS_ORIGIN=https://your-domain.com
   ```

4. Check backend logs for CORS errors:
   ```bash
   docker logs spotify-uploader-backend-prod --tail 100
   ```

### Issue: Out of disk space

**Solution:**

1. Check disk usage:
   ```bash
   df -h
   ```

2. Clean Docker images:
   ```bash
   docker system prune -a --volumes
   ```

3. Clean old backups:
   ```bash
   find ~/spotifyuploader/backups -mtime +14 -delete
   ```

4. Clean logs:
   ```bash
   sudo journalctl --vacuum-time=7d
   docker compose -f docker-compose.oracle.yml logs --tail=0
   ```

### Issue: High memory usage

**Solution:**

1. Check memory:
   ```bash
   free -h
   docker stats
   ```

2. Restart containers:
   ```bash
   docker compose -f docker-compose.oracle.yml restart
   ```

3. If persistent, reduce container resources in docker-compose.oracle.yml:
   ```yaml
   backend:
     deploy:
       resources:
         limits:
           memory: 2G
   ```

---

## Cost Optimization

### Always Free Tier Limits

✅ **Free Resources (Forever):**
- 2 OCPUs + 12 GB RAM (within 4 OCPU / 24 GB total)
- 100 GB boot volume (within 200 GB total)
- 10 TB outbound transfer/month
- 2 Public IPs

⚠️ **Potential Costs:**
- **Backup storage** - Store backups locally (free) or use Object Storage (10 GB free)
- **Egress > 10 TB/month** - Unlikely for small app ($0.0085/GB)
- **Additional compute** - Stay within Always Free limits

### Cost Monitoring

```bash
# Monitor outbound traffic
sudo apt install -y vnstat
sudo systemctl enable vnstat
sudo systemctl start vnstat

# Check monthly usage
vnstat -m

# Monitor in real-time
vnstat -l
```

### Optimize Transfer Costs

1. **Enable compression in Nginx:**

   ```nginx
   # Already in config
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

2. **Use CloudFlare (optional):**
   - Free CDN reduces Oracle bandwidth
   - DDoS protection
   - Add your domain to CloudFlare
   - Point DNS to CloudFlare nameservers
   - CloudFlare proxies traffic (orange cloud)

---

## Summary

### What You've Deployed

✅ **Infrastructure:**
- Oracle Cloud ARM compute instance (Always Free)
- Ubuntu 22.04 LTS with Docker
- Nginx reverse proxy with SSL/TLS termination
- Let's Encrypt SSL certificate (auto-renewal)

✅ **Application:**
- Christmas Spotify Playlist Uploader
- Frontend (Nginx + Svelte)
- Backend (Express.js)
- MongoDB database
- Automated daily backups

✅ **Security:**
- HTTPS with modern TLS 1.2/1.3
- Security headers (HSTS, XSS, etc.)
- Oracle Cloud Security Lists (firewall)
- UFW firewall
- No exposed MongoDB port

✅ **Monitoring:**
- Health checks (application + containers)
- Log rotation
- Automated backups
- Resource monitoring

### Access Points

- **Application:** https://your-domain.com
- **SSH:** `ssh -i ~/key.pem ubuntu@YOUR_IP`
- **Logs:** `docker compose -f docker-compose.oracle.yml logs -f`

### Maintenance Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| Check health | Daily | `docker ps && curl https://your-domain.com/health` |
| Review logs | Weekly | `docker compose -f docker-compose.oracle.yml logs --tail=100` |
| Verify backups | Weekly | `ls -lh ~/spotifyuploader/backups/` |
| Update system | Monthly | `sudo apt update && sudo apt upgrade -y` |
| Check SSL expiry | Monthly | `sudo certbot certificates` |
| Monitor disk | Monthly | `df -h` |

### Next Steps

1. ✅ Test application thoroughly
2. ✅ Add your Spotify account to app's User Management
3. ⚠️ Monitor Oracle Cloud billing dashboard (should be $0.00)
4. ✅ Set up monitoring alerts (email/webhook)
5. ✅ Document any custom configurations
6. ✅ Create backup of `.env` file (securely)

---

## Support Resources

- **Oracle Cloud Docs:** https://docs.oracle.com/cloud/
- **Let's Encrypt Docs:** https://letsencrypt.org/docs/
- **Docker Docs:** https://docs.docker.com/
- **Nginx Docs:** https://nginx.org/en/docs/
- **Application Docs:** See README.md and PHASE*.md files

---

**Deployment Date:** December 15, 2025
**Document Version:** 1.0
**Maintainer:** Update with your information

---

🎄 **Merry Christmas and happy deploying!** 🎄
