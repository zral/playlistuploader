# Digital Ocean Deployment Guide

**Application:** Christmas Spotify Playlist Uploader
**Platform:** Digital Ocean Droplets
**SSL:** Let's Encrypt with automatic renewal
**Date:** December 17, 2025

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Digital Ocean Pricing](#digital-ocean-pricing)
4. [Phase 1: Digital Ocean Account Setup](#phase-1-digital-ocean-account-setup)
5. [Phase 2: Droplet Creation](#phase-2-droplet-creation)
6. [Phase 3: Network & Security Configuration](#phase-3-network--security-configuration)
7. [Phase 4: Domain & DNS Setup](#phase-4-domain--dns-setup)
8. [Phase 5: Server Initial Setup](#phase-5-server-initial-setup)
9. [Phase 6: Docker Installation](#phase-6-docker-installation)
10. [Phase 7: Application Deployment](#phase-7-application-deployment)
11. [Phase 8: SSL Certificate with Let's Encrypt](#phase-8-ssl-certificate-with-lets-encrypt)
12. [Phase 9: Nginx Reverse Proxy](#phase-9-nginx-reverse-proxy)
13. [Phase 10: Monitoring & Maintenance](#phase-10-monitoring--maintenance)
14. [Phase 11: Optional Enhancements](#phase-11-optional-enhancements)
15. [Troubleshooting](#troubleshooting)
16. [Cost Optimization](#cost-optimization)

---

## Overview

This guide deploys the Christmas Spotify Playlist Uploader to Digital Ocean using:
- **Droplet (VPS)** - Ubuntu 22.04 LTS (2 GB RAM minimum)
- **Docker Compose** for container orchestration
- **Let's Encrypt** for free SSL/TLS certificates
- **Nginx** as reverse proxy for HTTPS termination
- **Certbot** for automatic certificate renewal
- **Cloud Firewall** for network security (optional but recommended)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Digital Ocean Platform                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Droplet (Ubuntu 22.04 LTS)                                │ │
│  │  2 GB RAM / 1 vCPU / 50 GB SSD                             │ │
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
│  │  │  ┌──────────────┐  ┌──────────────┐                    │ │ │
│  │  │  │   Redis      │  │ Backup Svc   │                    │ │ │
│  │  │  │  (Cache)     │  │   (Daily)    │                    │ │ │
│  │  │  │  Port 6379   │  └──────────────┘                    │ │ │
│  │  │  └──────────────┘                                       │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Cloud Firewall (Optional)                                      │
│  - Port 80 (HTTP)                                               │
│  - Port 443 (HTTPS)                                             │
│  - Port 22 (SSH)                                                │
│                                                                  │
│  Floating IP (Optional)                                         │
│  - Reserved IP for easy Droplet replacement                     │
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
- [ ] Digital Ocean account (new users get $200 credit for 60 days)
- [ ] Domain name (required for SSL certificate)
- [ ] Spotify Developer credentials (Client ID & Secret)
- [ ] SSH key pair for server access
- [ ] Local terminal with SSH client
- [ ] Payment method (credit card - charges start after free credit expires)

### Recommended Knowledge
- Basic Linux command line
- Docker fundamentals
- DNS configuration
- SSH key management

---

## Digital Ocean Pricing

### Droplet Options

**Recommended for this application:**

| Plan | vCPU | RAM | Storage | Transfer | Price/Month |
|------|------|-----|---------|----------|-------------|
| **Basic** | 1 vCPU | 2 GB | 50 GB SSD | 2 TB | $12/month |
| **Basic** | 2 vCPU | 4 GB | 80 GB SSD | 4 TB | $24/month |
| **Premium (Intel)** | 2 vCPU | 4 GB | 80 GB SSD | 4 TB | $32/month |
| **Premium (AMD)** | 2 vCPU | 4 GB | 80 GB SSD | 4 TB | $28/month |

**Minimum Recommendation:** 2 GB RAM Droplet ($12/month)
- Sufficient for MongoDB, Redis, Backend, Frontend containers
- 50 GB storage adequate for application + backups
- 2 TB monthly transfer more than enough

**Optional Add-ons:**
- **Block Storage:** $0.10/GB/month (10 GB minimum = $1/month)
- **Backups:** 20% of Droplet cost (automated weekly snapshots)
- **Snapshots:** $0.05/GB/month (manual snapshots)
- **Floating IP:** Free while assigned to Droplet
- **Cloud Firewall:** Free
- **DNS Management:** Free
- **Monitoring:** Free (basic metrics)

### New User Benefits

Digital Ocean offers **$200 credit valid for 60 days** for new users:
- Sign up via referral link: https://m.do.co/c/your-referral-code
- Credit applied automatically after adding payment method
- Enough to run 2 GB Droplet for ~16 months free
- Or run 4 GB Droplet for ~8 months free

### Monthly Cost Estimate

**Minimal Setup (Recommended):**
- 2 GB Droplet: $12/month
- DNS: Free
- Cloud Firewall: Free
- Total: **$12/month** ($0.018/hour)

**With Backups:**
- 2 GB Droplet: $12/month
- Automated Backups: $2.40/month (20% of Droplet)
- Total: **$14.40/month**

**With Block Storage for Backups:**
- 2 GB Droplet: $12/month
- 20 GB Block Storage: $2/month
- Total: **$14/month**

---

## Phase 1: Digital Ocean Account Setup

### 1.1 Create Digital Ocean Account

1. Visit [Digital Ocean](https://www.digitalocean.com/)
2. Click **"Sign Up"** or use referral link for $200 credit
3. Choose sign-up method:
   - Email + password
   - GitHub account
   - Google account
4. Verify email address
5. Add payment method (credit card or PayPal)
   - Required even with free credit
   - Will not be charged during credit period
6. Complete profile setup

### 1.2 Access Digital Ocean Console

1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. Sign in with your credentials
3. You'll see the Control Panel dashboard

### 1.3 Install doctl CLI (Optional but Recommended)

```bash
# macOS (Homebrew)
brew install doctl

# Linux
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.104.0/doctl-1.104.0-linux-amd64.tar.gz
tar xf doctl-1.104.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin

# Verify installation
doctl version

# Authenticate
doctl auth init
# Paste your API token (create at: cloud.digitalocean.com/account/api/tokens)

# Verify authentication
doctl account get
```

---

## Phase 2: Droplet Creation

### 2.1 Create SSH Key (if you don't have one)

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/digitalocean_rsa

# Display public key
cat ~/.ssh/digitalocean_rsa.pub
# Copy this output
```

### 2.2 Add SSH Key to Digital Ocean

**Via Web Console:**
1. Navigate to **Settings** → **Security** → **SSH Keys**
2. Click **"Add SSH Key"**
3. Paste your public key
4. Give it a name (e.g., "My Laptop")
5. Click **"Add SSH Key"**

**Via doctl:**
```bash
doctl compute ssh-key import spotify-deployer --public-key-file ~/.ssh/digitalocean_rsa.pub
```

### 2.3 Create Droplet

**Via Web Console:**

1. Click **"Create"** → **"Droplets"**

2. **Choose Region:**
   - Select closest to your target audience
   - Examples: New York, San Francisco, Amsterdam, London, Frankfurt, Singapore

3. **Choose an Image:**
   - **Distribution:** Ubuntu 22.04 (LTS) x64
   - (Recommended: Use latest LTS version)

4. **Choose Size:**
   - **Plan:** Basic (Shared CPU)
   - **CPU options:** Regular Intel/AMD
   - **Size:** 2 GB RAM / 1 vCPU / 50 GB SSD ($12/month)
   - Or: 4 GB RAM / 2 vCPU / 80 GB SSD ($24/month) for better performance

5. **Choose Authentication:**
   - ✅ **SSH Key** (select the key you added)
   - ❌ Password (less secure, not recommended)

6. **Additional Options (Optional):**
   - ✅ **IPv6** (free)
   - ✅ **Monitoring** (free - CPU, bandwidth, disk I/O)
   - ⚪ **Backups** ($2.40/month for 2GB Droplet)
   - ⚪ **User data** (skip for now)

7. **Finalize:**
   - **Hostname:** `spotify-uploader-prod`
   - **Tags:** `production`, `spotify-app` (optional, for organization)
   - **Project:** Create new or use existing

8. Click **"Create Droplet"**

**Via doctl:**
```bash
doctl compute droplet create spotify-uploader-prod \
  --region nyc3 \
  --size s-1vcpu-2gb \
  --image ubuntu-22-04-x64 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header) \
  --enable-monitoring \
  --enable-ipv6 \
  --wait
```

### 2.4 Note Important Information

Once created, note:
```
Droplet Name: spotify-uploader-prod
Public IP: xxx.xxx.xxx.xxx
Region: nyc3 (or your chosen region)
Username: root (default for Ubuntu)
SSH Key: ~/.ssh/digitalocean_rsa
```

**Get Droplet IP via doctl:**
```bash
doctl compute droplet list --format Name,PublicIPv4
```

---

## Phase 3: Network & Security Configuration

### 3.1 Configure Cloud Firewall (Recommended)

Digital Ocean Cloud Firewalls are free and provide superior security over UFW alone.

**Via Web Console:**

1. Navigate to **Networking** → **Firewalls**
2. Click **"Create Firewall"**

3. **Name:** `spotify-uploader-firewall`

4. **Inbound Rules:**

   Add these rules:

   | Type | Protocol | Port Range | Sources |
   |------|----------|------------|---------|
   | SSH | TCP | 22 | All IPv4, All IPv6 |
   | HTTP | TCP | 80 | All IPv4, All IPv6 |
   | HTTPS | TCP | 443 | All IPv4, All IPv6 |

   **Optional - Restrict SSH to your IP:**
   - Type: SSH
   - Protocol: TCP
   - Port: 22
   - Sources: `YOUR_IP_ADDRESS/32`

5. **Outbound Rules:**

   | Type | Protocol | Port Range | Destinations |
   |------|----------|------------|--------------|
   | ICMP | ICMP | - | All IPv4, All IPv6 |
   | All TCP | TCP | All | All IPv4, All IPv6 |
   | All UDP | UDP | All | All IPv4, All IPv6 |

6. **Apply to Droplets:**
   - Select `spotify-uploader-prod`

7. Click **"Create Firewall"**

**Via doctl:**
```bash
# Create firewall
doctl compute firewall create \
  --name spotify-uploader-firewall \
  --inbound-rules "protocol:tcp,ports:22,address:0.0.0.0/0,address:::/0 protocol:tcp,ports:80,address:0.0.0.0/0,address:::/0 protocol:tcp,ports:443,address:0.0.0.0/0,address:::/0" \
  --outbound-rules "protocol:tcp,ports:all,address:0.0.0.0/0,address:::/0 protocol:udp,ports:all,address:0.0.0.0/0,address:::/0 protocol:icmp,address:0.0.0.0/0,address:::/0" \
  --droplet-ids $(doctl compute droplet list --format ID --no-header)
```

### 3.2 Configure UFW (Defense in Depth)

We'll configure UFW in Phase 5 after SSH access is established.

---

## Phase 4: Domain & DNS Setup

### 4.1 Domain Requirements

You need a domain name for Let's Encrypt SSL certificates. Options:

1. **Use existing domain** (e.g., example.com)
2. **Register new domain:**
   - Namecheap ($8-15/year for .com)
   - Google Domains
   - Cloudflare Registrar
   - **Digital Ocean Domains** (competitive pricing)
3. **Free subdomain services** (not recommended for production):
   - DuckDNS (free)
   - No-IP (free tier)

### 4.2 Add Domain to Digital Ocean DNS

Digital Ocean provides free DNS management.

**Via Web Console:**

1. Navigate to **Networking** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `your-domain.com`
4. Click **"Add Domain"**

**Via doctl:**
```bash
doctl compute domain create your-domain.com --ip-address YOUR_DROPLET_IP
```

### 4.3 Configure DNS Records

**Via Web Console:**

After adding domain, add these DNS records:

| Type | Hostname | Value | TTL |
|------|----------|-------|-----|
| A | @ | xxx.xxx.xxx.xxx | 300 |
| A | www | xxx.xxx.xxx.xxx | 300 |
| AAAA | @ | your:ipv6:address (optional) | 300 |

**Via doctl:**
```bash
# A record for root domain
doctl compute domain records create your-domain.com \
  --record-type A \
  --record-name @ \
  --record-data YOUR_DROPLET_IP \
  --record-ttl 300

# A record for www subdomain
doctl compute domain records create your-domain.com \
  --record-type A \
  --record-name www \
  --record-data YOUR_DROPLET_IP \
  --record-ttl 300
```

### 4.4 Update Domain Nameservers

If your domain is registered elsewhere (not Digital Ocean):

1. Go to your domain registrar (Namecheap, Google Domains, etc.)
2. Update nameservers to Digital Ocean's:
   ```
   ns1.digitalocean.com
   ns2.digitalocean.com
   ns3.digitalocean.com
   ```

3. Wait 24-48 hours for propagation (usually faster)

### 4.5 Verify DNS Propagation

```bash
# Check DNS resolution
nslookup your-domain.com

# Or use dig
dig your-domain.com

# Should return your Droplet's IP address
```

---

## Phase 5: Server Initial Setup

### 5.1 Connect to Your Droplet

```bash
# Set correct permissions on private key
chmod 600 ~/.ssh/digitalocean_rsa

# SSH to your Droplet
ssh -i ~/.ssh/digitalocean_rsa root@YOUR_DROPLET_IP

# First connection will ask to verify fingerprint, type 'yes'
```

**Tip:** Add to `~/.ssh/config` for easier access:
```
Host spotify-do
    HostName YOUR_DROPLET_IP
    User root
    IdentityFile ~/.ssh/digitalocean_rsa
```

Then connect with: `ssh spotify-do`

### 5.2 Update System

```bash
# Update package lists
apt update

# Upgrade all packages
apt upgrade -y

# Install essential tools
apt install -y \
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
  lsb-release \
  net-tools \
  apt-transport-https
```

### 5.3 Create Non-Root User (Recommended)

```bash
# Create new user
adduser deployer
# Follow prompts to set password

# Add to sudo group
usermod -aG sudo deployer

# Copy SSH keys to new user
mkdir -p /home/deployer/.ssh
cp ~/.ssh/authorized_keys /home/deployer/.ssh/
chown -R deployer:deployer /home/deployer/.ssh
chmod 700 /home/deployer/.ssh
chmod 600 /home/deployer/.ssh/authorized_keys

# Test SSH with new user (from local machine)
ssh -i ~/.ssh/digitalocean_rsa deployer@YOUR_DROPLET_IP

# If successful, disable root SSH login (optional but recommended)
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
systemctl restart sshd
```

**For the rest of this guide, we'll use `deployer` user. Replace with your chosen username.**

### 5.4 Configure Firewall (UFW)

```bash
# Configure Ubuntu firewall (defense in depth with Cloud Firewall)
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

### 5.5 Configure Swap (Recommended for 2 GB RAM)

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Adjust swappiness (optional - reduces swap usage)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Verify swap
free -h
```

### 5.6 Set Timezone

```bash
# Set timezone (adjust to your location)
sudo timedatectl set-timezone Europe/Oslo

# Or use interactive selector
sudo dpkg-reconfigure tzdata

# Verify
timedatectl
```

### 5.7 Configure Automatic Security Updates (Recommended)

```bash
# Install unattended-upgrades
sudo apt install -y unattended-upgrades

# Enable automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades
# Select "Yes"

# Configure update settings
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
# Ensure these lines are uncommented:
#   "${distro_id}:${distro_codename}-security";
#   "${distro_id}:${distro_codename}-updates";
```

---

## Phase 6: Docker Installation

### 6.1 Install Docker Engine

```bash
# Remove old versions (if any)
sudo apt remove docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
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
# Add deployer user to docker group
sudo usermod -aG docker deployer

# Apply group changes (re-login or use newgrp)
newgrp docker

# Verify (should work without sudo)
docker ps
```

### 6.3 Configure Docker Daemon

```bash
# Create daemon config for production
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false
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

# Or if repository is private, use SSH or personal access token
git clone git@github.com:YOUR_USERNAME/spotifyuploader.git
```

**Alternative: Transfer files using SCP (if no git repository):**

```bash
# From your local machine:
scp -i ~/.ssh/digitalocean_rsa -r /path/to/local/spotifyuploader deployer@YOUR_DROPLET_IP:~/

# Then SSH back to the server
ssh -i ~/.ssh/digitalocean_rsa deployer@YOUR_DROPLET_IP
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

# Redis Configuration
REDIS_URL=redis://redis:6379
CACHE_ENABLED=true

# Database Configuration
MONGO_URI=mongodb://mongodb:27017/spotify-uploader

# Database Backup Configuration
BACKUP_RETENTION_DAYS=7

# Logging Configuration
LOG_LEVEL=info

# AI Configuration (Optional - Phase 14)
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-3.5-turbo
AI_RATE_LIMIT_PER_USER_DAILY=1000
AI_RATE_LIMIT_PER_IP_HOURLY=500
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

# Create logs directory
mkdir -p ~/spotifyuploader/backend/logs

# Set permissions
chmod 755 ~/spotifyuploader/backups
chmod 755 ~/spotifyuploader/backend/logs
```

### 7.4 Use Production Docker Compose

The repository includes `docker-compose.prod.yml` which is optimized for production.

Review the file:
```bash
cat docker-compose.prod.yml
```

It includes:
- MongoDB (internal network only, no external port)
- Redis (internal network only, LRU eviction, 512MB limit)
- Backend (production mode, health checks)
- Frontend (Nginx with static files)
- Automated backup service (daily backups, 7-day retention)

### 7.5 Build and Start Application

```bash
# Build containers (this may take 5-10 minutes)
docker compose -f docker-compose.prod.yml build

# Start application
docker compose -f docker-compose.prod.yml up -d

# Check container status
docker ps

# Should show 5 running containers:
# - spotify-uploader-mongodb-prod
# - spotify-uploader-redis-prod
# - spotify-uploader-backend-prod
# - spotify-uploader-frontend-prod
# - spotify-uploader-backup-prod

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Verify backend is healthy
curl http://localhost:8080/health
```

Expected output:
```json
{"status":"ok","timestamp":"2025-12-17T..."}
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

### 8.2 Stop Application Temporarily

```bash
# Temporarily stop app to free port 80 for Let's Encrypt validation
cd ~/spotifyuploader
docker compose -f docker-compose.prod.yml down
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

# View timer schedule
systemctl list-timers certbot.timer
```

**Certbot automatically renews certificates within 30 days of expiration.**

**Configure renewal hook to reload Nginx:**
```bash
# Create renewal hook
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
sudo nano /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh
```

Add:
```bash
#!/bin/bash
systemctl reload nginx
```

Make executable:
```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh
```

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
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

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

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml;

    # Reverse proxy to Docker application
    location / {
        proxy_pass http://127.0.0.1:8080;
    }

    # Health check endpoint (optional, no auth required)
    location /health {
        proxy_pass http://127.0.0.1:8080/health;
        access_log off;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
    }

    # Auth endpoints
    location /auth/ {
        proxy_pass http://127.0.0.1:8080/auth/;
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
docker compose -f docker-compose.prod.yml up -d

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
/home/deployer/spotifyuploader/backend/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 deployer deployer
}
```

Test:
```bash
sudo logrotate -d /etc/logrotate.d/spotify-uploader
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

# Network usage
ifstat
# Or install: sudo apt install -y ifstat

# Check logs
docker compose -f docker-compose.prod.yml logs -f --tail=100
```

### 10.3 Digital Ocean Monitoring

**Via Web Console:**
1. Navigate to **Droplets** → Select your Droplet
2. Click **"Graphs"** tab
3. View metrics:
   - CPU usage
   - Memory usage
   - Disk I/O
   - Bandwidth usage
   - Public network traffic

**Set up alerts:**
1. Navigate to **Monitoring** → **Alerts**
2. Click **"Create Alert Policy"**
3. Configure alerts for:
   - CPU > 80% for 5 minutes
   - Memory > 90% for 5 minutes
   - Disk usage > 85%
4. Add notification channels (email, Slack, PagerDuty)

### 10.4 Automated Health Checks

Create a monitoring script:

```bash
nano ~/check-health.sh
```

Add:

```bash
#!/bin/bash

# Check if containers are running
CONTAINERS=$(docker ps --format "{{.Names}}" | wc -l)
if [ "$CONTAINERS" -lt 5 ]; then
    echo "WARNING: Only $CONTAINERS containers running (expected 5)"
    # Restart if critical containers missing
    cd ~/spotifyuploader
    docker compose -f docker-compose.prod.yml up -d
fi

# Check application health
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/health)
if [ "$HTTP_CODE" -ne 200 ]; then
    echo "WARNING: Application health check failed (HTTP $HTTP_CODE)"
    # Restart containers
    cd ~/spotifyuploader
    docker compose -f docker-compose.prod.yml restart backend frontend
fi

echo "Health check passed: $CONTAINERS containers, HTTP $HTTP_CODE"
```

Make executable and add to crontab:

```bash
chmod +x ~/check-health.sh

# Add to crontab (run every 5 minutes)
crontab -e

# Add this line:
*/5 * * * * /home/deployer/check-health.sh >> /home/deployer/health-check.log 2>&1
```

### 10.5 Backup Monitoring

```bash
# Check backup status
ls -lh ~/spotifyuploader/backups/

# Check backup logs
docker logs spotify-uploader-backup-prod --tail 50

# Manual backup
cd ~/spotifyuploader
./backup.sh

# Test restore process
./restore.sh ~/spotifyuploader/backups/backup-YYYYMMDD-HHMMSS
```

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
sudo apt autoclean

# Update Docker containers (rebuild with latest base images)
cd ~/spotifyuploader
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --build

# Clean old Docker images
docker image prune -af --filter "until=168h"

echo "Update complete: $(date)"
```

Make executable and schedule:

```bash
chmod +x ~/update-system.sh

# Add to crontab (run weekly on Sunday at 3 AM)
crontab -e

# Add:
0 3 * * 0 /home/deployer/update-system.sh >> /home/deployer/update.log 2>&1
```

---

## Phase 11: Optional Enhancements

### 11.1 Floating IP (Reserved IP)

Floating IPs allow you to reassign IP addresses between Droplets without DNS changes.

**Benefits:**
- Quick failover to backup Droplet
- Change Droplets without DNS downtime
- Free while assigned

**Via Web Console:**
1. Navigate to **Networking** → **Floating IPs**
2. Click **"Assign Floating IP"**
3. Select your Droplet
4. Click **"Assign Floating IP"**
5. Update DNS records to point to Floating IP

**Via doctl:**
```bash
doctl compute floating-ip create --region nyc3
doctl compute floating-ip-action assign <floating-ip> <droplet-id>
```

### 11.2 Automated Snapshots

Digital Ocean snapshots create point-in-time backups of your entire Droplet.

**Manual Snapshot:**
1. Navigate to **Droplets** → Select Droplet
2. Click **"Snapshots"** tab
3. Click **"Take Snapshot"**
4. Power off Droplet first (recommended for consistency)

**Automated Backups:**
1. Navigate to **Droplets** → Select Droplet
2. Click **"Backups"** tab
3. Click **"Enable Backups"**
4. Cost: 20% of Droplet cost ($2.40/month for $12 Droplet)
5. Weekly automated snapshots

**Via doctl:**
```bash
# Power off Droplet
doctl compute droplet-action power-off <droplet-id>

# Create snapshot
doctl compute droplet-action snapshot <droplet-id> --snapshot-name "spotify-backup-$(date +%Y%m%d)"

# Power on Droplet
doctl compute droplet-action power-on <droplet-id>
```

### 11.3 Block Storage for Backups

Attach dedicated Block Storage volume for backups (separate from Droplet disk).

**Create Volume:**
```bash
# Via doctl
doctl compute volume create spotify-backups \
  --region nyc3 \
  --size 20GiB \
  --desc "Spotify Uploader Backup Storage"

# Attach to Droplet
doctl compute volume-action attach <volume-id> <droplet-id>
```

**Mount Volume:**
```bash
# Find volume device
lsblk

# Format volume (first time only)
sudo mkfs.ext4 /dev/disk/by-id/scsi-0DO_Volume_spotify-backups

# Create mount point
sudo mkdir -p /mnt/backups

# Mount volume
sudo mount -o discard,defaults /dev/disk/by-id/scsi-0DO_Volume_spotify-backups /mnt/backups

# Make permanent
echo '/dev/disk/by-id/scsi-0DO_Volume_spotify-backups /mnt/backups ext4 defaults,nofail,discard 0 2' | sudo tee -a /etc/fstab

# Update backup directory
# Edit docker-compose.prod.yml:
# volumes:
#   - /mnt/backups:/backups
```

### 11.4 DigitalOcean Spaces (Object Storage)

Store backups in Spaces (S3-compatible object storage).

**Pricing:** $5/month for 250 GB storage + 1 TB outbound transfer

**Setup:**
1. Navigate to **Spaces** → **Create Space**
2. Create bucket: `spotify-uploader-backups`
3. Install s3cmd:
   ```bash
   sudo apt install -y s3cmd
   s3cmd --configure
   # Enter Spaces access key and secret
   ```

4. Sync backups:
   ```bash
   s3cmd sync ~/spotifyuploader/backups/ s3://spotify-uploader-backups/
   ```

5. Automate with cron:
   ```bash
   crontab -e
   # Add:
   0 4 * * * s3cmd sync ~/spotifyuploader/backups/ s3://spotify-uploader-backups/ >> ~/s3-sync.log 2>&1
   ```

### 11.5 Uptime Monitoring (External)

Use external services to monitor uptime:

**Free Options:**
- **UptimeRobot** (50 monitors free): https://uptimerobot.com
- **StatusCake** (unlimited checks): https://www.statuscake.com
- **Pingdom** (free tier): https://www.pingdom.com

**Setup:**
1. Sign up for monitoring service
2. Add monitor:
   - URL: `https://your-domain.com/health`
   - Check interval: 5 minutes
   - Alert via email/SMS/Slack when down

### 11.6 CDN with Cloudflare (Free)

Reduce bandwidth costs and improve performance with Cloudflare CDN.

**Setup:**
1. Sign up at https://cloudflare.com
2. Add your domain
3. Update nameservers to Cloudflare's
4. Enable proxy (orange cloud) for DNS records
5. Configure SSL/TLS mode: **Full (strict)**
6. Enable caching, minification, Brotli compression

**Benefits:**
- Free SSL/TLS
- DDoS protection
- Reduced bandwidth costs (Cloudflare caches static assets)
- Global CDN (faster load times worldwide)

---

## Troubleshooting

### Issue: Cannot connect to HTTPS

**Solution:**

1. Verify DNS is correctly configured:
   ```bash
   nslookup your-domain.com
   dig your-domain.com
   ```

2. Check Cloud Firewall has ports 80/443 open:
   ```bash
   doctl compute firewall list
   doctl compute firewall get <firewall-id>
   ```

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
   sudo tail -f /var/log/nginx/spotify-uploader-error.log
   ```

6. Verify application is running:
   ```bash
   curl http://localhost:8080/health
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

5. Check Nginx SSL configuration:
   ```bash
   sudo nginx -t
   # Look for SSL-related errors
   ```

### Issue: Application not responding

**Solution:**

1. Check container status:
   ```bash
   docker ps -a
   docker compose -f docker-compose.prod.yml ps
   ```

2. Check logs:
   ```bash
   docker compose -f docker-compose.prod.yml logs backend
   docker compose -f docker-compose.prod.yml logs frontend
   docker compose -f docker-compose.prod.yml logs mongodb
   docker compose -f docker-compose.prod.yml logs redis
   ```

3. Restart containers:
   ```bash
   docker compose -f docker-compose.prod.yml restart
   ```

4. Full rebuild if needed:
   ```bash
   docker compose -f docker-compose.prod.yml down
   docker compose -f docker-compose.prod.yml up -d --build
   ```

5. Check for port conflicts:
   ```bash
   sudo netstat -tulpn | grep :8080
   ```

### Issue: Spotify OAuth redirect failing

**Solution:**

1. Verify `SPOTIFY_REDIRECT_URI` in `.env`:
   ```bash
   cat .env | grep SPOTIFY_REDIRECT_URI
   # Should be: https://your-domain.com/auth/callback
   ```

2. Check Spotify Developer Dashboard redirect URIs match exactly

3. Verify `FRONTEND_URL` and `CORS_ORIGIN` use HTTPS:
   ```bash
   cat .env | grep -E "FRONTEND_URL|CORS_ORIGIN"
   ```

4. Check backend logs for CORS errors:
   ```bash
   docker logs spotify-uploader-backend-prod --tail 100
   ```

5. Test callback URL manually:
   ```bash
   curl -I https://your-domain.com/auth/callback
   # Should return 400 or 302, not 404 or 500
   ```

### Issue: Out of disk space

**Solution:**

1. Check disk usage:
   ```bash
   df -h
   du -sh ~/spotifyuploader/*
   ```

2. Clean Docker images and volumes:
   ```bash
   docker system df
   docker system prune -a --volumes
   # WARNING: This removes all unused images and volumes
   ```

3. Clean old backups:
   ```bash
   find ~/spotifyuploader/backups -mtime +14 -type d -exec rm -rf {} +
   ```

4. Clean logs:
   ```bash
   sudo journalctl --vacuum-time=7d
   sudo truncate -s 0 /var/log/nginx/*.log
   ```

5. Increase Droplet disk size:
   - Via Web Console: **Droplets** → Select Droplet → **Resize** → **Disk only**
   - Or add Block Storage volume

### Issue: High memory usage

**Solution:**

1. Check memory:
   ```bash
   free -h
   docker stats --no-stream
   htop
   ```

2. Identify memory-hungry containers:
   ```bash
   docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}"
   ```

3. Restart containers:
   ```bash
   docker compose -f docker-compose.prod.yml restart
   ```

4. Reduce Redis memory limit (edit docker-compose.prod.yml):
   ```yaml
   redis:
     command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
   ```

5. If persistent, upgrade to 4 GB Droplet ($24/month)

### Issue: Droplet unresponsive / Can't SSH

**Solution:**

1. Check Droplet status in Digital Ocean Console:
   - Navigate to **Droplets** → Select Droplet
   - Check status (Running, Off, etc.)

2. Access Droplet Console (emergency access):
   - Click **"Access"** → **"Launch Droplet Console"**
   - Login as root or deployer

3. Reboot Droplet:
   ```bash
   # Via doctl
   doctl compute droplet-action reboot <droplet-id>

   # Or via web console
   # Droplets → Select Droplet → Power → Reboot
   ```

4. Check SSH service:
   ```bash
   # From console
   sudo systemctl status sshd
   sudo systemctl restart sshd
   ```

5. Verify firewall not blocking SSH:
   ```bash
   sudo ufw status
   # Ensure port 22 is allowed
   ```

---

## Cost Optimization

### Monthly Cost Breakdown

**Minimal Production Setup:**
- 2 GB Droplet: **$12/month**
- DNS: Free
- Cloud Firewall: Free
- Monitoring: Free
- Bandwidth: Included (2 TB/month)
- Total: **$12/month**

**With Backups:**
- 2 GB Droplet: $12/month
- Automated Backups (20%): $2.40/month
- Total: **$14.40/month**

**With Block Storage for Backups:**
- 2 GB Droplet: $12/month
- 20 GB Block Storage: $2/month
- Total: **$14/month**

**Bandwidth Overage:**
- First 2 TB/month: Included
- Additional bandwidth: $0.01/GB
- (Unlikely to exceed for small app)

### Cost Optimization Tips

1. **Use New User Credit:**
   - $200 credit = ~16 months of 2 GB Droplet free
   - Sign up with referral link: https://m.do.co/c/your-code

2. **Choose Right Droplet Size:**
   - Start with 2 GB RAM ($12/month)
   - Upgrade to 4 GB ($24/month) only if needed
   - Downgrade if consistently low resource usage

3. **Leverage Free Features:**
   - Cloud Firewall (free vs. paid alternatives)
   - DNS management (free vs. $12/year elsewhere)
   - Monitoring (free vs. $10-50/month paid services)
   - Floating IPs (free while assigned)

4. **Optimize Bandwidth:**
   - Enable gzip compression in Nginx (already configured)
   - Use Cloudflare CDN to cache static assets
   - Implement Redis caching (already configured)

5. **Snapshot vs. Backups:**
   - Automated Backups: $2.40/month (weekly, rolling 4 weeks)
   - Manual Snapshots: $0.05/GB/month (pay only for what you keep)
   - Manual snapshots more cost-effective if done monthly

6. **Block Storage vs. Larger Droplet:**
   - Upgrade 2 GB to 4 GB: +$12/month (+30 GB disk)
   - Add 20 GB Block Storage: +$2/month
   - Use Block Storage for backups, cheaper than upgrading

7. **Monitor Costs:**
   - Check billing dashboard: https://cloud.digitalocean.com/billing
   - Set up billing alerts
   - Review resource usage monthly

8. **Annual Prepayment (Optional):**
   - Digital Ocean offers no discount for annual prepayment
   - Pay monthly for flexibility

### Bandwidth Monitoring

```bash
# Install vnstat for bandwidth monitoring
sudo apt install -y vnstat
sudo systemctl enable vnstat
sudo systemctl start vnstat

# Check monthly bandwidth usage
vnstat -m

# Check daily usage
vnstat -d

# Monitor in real-time
vnstat -l
```

### Droplet Resize Guide

**Increase Resources (Temporary or Permanent):**

1. **Power off Droplet:**
   ```bash
   doctl compute droplet-action power-off <droplet-id>
   ```

2. **Resize via Web Console:**
   - Navigate to **Droplets** → Select Droplet → **Resize**
   - Choose resize type:
     - **CPU + RAM only** (reversible, no disk increase)
     - **Disk + CPU + RAM** (permanent, cannot downgrade disk)

3. **Power on Droplet:**
   ```bash
   doctl compute droplet-action power-on <droplet-id>
   ```

**Decrease Resources:**
- Only possible if you did **CPU + RAM only** resize
- Cannot decrease disk size
- Alternative: Create new smaller Droplet, migrate data, delete old Droplet

---

## Summary

### What You've Deployed

✅ **Infrastructure:**
- Digital Ocean Droplet (Ubuntu 22.04 LTS, 2 GB RAM)
- Docker Engine with Docker Compose
- Nginx reverse proxy with SSL/TLS termination
- Let's Encrypt SSL certificate (auto-renewal)
- Cloud Firewall + UFW (defense in depth)

✅ **Application:**
- Christmas Spotify Playlist Uploader
- Frontend (Nginx + Svelte)
- Backend (Express.js + TypeScript)
- MongoDB database
- Redis cache (60-80% API reduction)
- Automated daily backups

✅ **Security:**
- HTTPS with modern TLS 1.2/1.3
- Security headers (HSTS, XSS, Content-Type-Options, Frame-Options)
- Cloud Firewall (network-level protection)
- UFW firewall (host-level protection)
- No exposed MongoDB/Redis ports
- SSH key-based authentication

✅ **Monitoring:**
- Health checks (application + containers)
- Digital Ocean monitoring (CPU, memory, disk, bandwidth)
- Log rotation
- Automated backups
- Resource monitoring scripts

### Access Points

- **Application:** https://your-domain.com
- **SSH:** `ssh -i ~/.ssh/digitalocean_rsa deployer@YOUR_DROPLET_IP`
- **Logs:** `docker compose -f docker-compose.prod.yml logs -f`
- **Control Panel:** https://cloud.digitalocean.com

### Maintenance Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| Check health | Daily | `docker ps && curl https://your-domain.com/health` |
| Review logs | Weekly | `docker compose -f docker-compose.prod.yml logs --tail=100` |
| Verify backups | Weekly | `ls -lh ~/spotifyuploader/backups/` |
| Update system | Monthly | `sudo apt update && sudo apt upgrade -y` |
| Check SSL expiry | Monthly | `sudo certbot certificates` |
| Monitor disk | Monthly | `df -h` |
| Review costs | Monthly | Check Digital Ocean billing dashboard |

### Next Steps

1. ✅ Test application thoroughly
2. ✅ Add your Spotify account to app's User Management
3. ✅ Set up Digital Ocean monitoring alerts (CPU, memory, disk)
4. ✅ Configure external uptime monitoring (UptimeRobot, StatusCake)
5. ✅ Document any custom configurations
6. ✅ Create backup of `.env` file (store securely offline)
7. ⚠️ Monitor Digital Ocean billing dashboard
8. ✅ Consider Cloudflare CDN for additional performance
9. ✅ Test backup restore process
10. ✅ Set up billing alerts in Digital Ocean

---

## Support Resources

- **Digital Ocean Docs:** https://docs.digitalocean.com/
- **Digital Ocean Community:** https://www.digitalocean.com/community
- **Let's Encrypt Docs:** https://letsencrypt.org/docs/
- **Docker Docs:** https://docs.docker.com/
- **Nginx Docs:** https://nginx.org/en/docs/
- **Application Docs:** See README.md and doc/PHASE*.md files
- **doctl CLI Reference:** https://docs.digitalocean.com/reference/doctl/

---

**Deployment Date:** December 17, 2025
**Document Version:** 1.0
**Estimated Monthly Cost:** $12-14/month (after free credit)
**Maintainer:** Update with your information

---

🎄 **Merry Christmas and happy deploying!** 🎄
