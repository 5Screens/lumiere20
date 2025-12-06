#!/bin/bash
# ============================================
# LUMIERE DEPLOYMENT SCRIPT
# ============================================
# Run this script on your Debian VPS

set -e

echo "=========================================="
echo "LUMIERE DEPLOYMENT SCRIPT"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="lumiere.mindcentra.com"
APP_DIR="/var/www/lumiere"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Please do not run as root. Run as a regular user with sudo privileges.${NC}"
    exit 1
fi

# Step 1: Install Docker if not present
install_docker() {
    echo -e "${YELLOW}[1/6] Checking Docker installation...${NC}"
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        echo -e "${GREEN}Docker installed. Please log out and log back in, then run this script again.${NC}"
        exit 0
    else
        echo -e "${GREEN}Docker is already installed.${NC}"
    fi

    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        echo "Installing Docker Compose plugin..."
        sudo apt-get update
        sudo apt-get install -y docker-compose-plugin
    fi
    echo -e "${GREEN}Docker Compose is available.${NC}"
}

# Step 2: Create directories
setup_directories() {
    echo -e "${YELLOW}[2/6] Setting up directories...${NC}"
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
    mkdir -p $APP_DIR/certbot/conf
    mkdir -p $APP_DIR/certbot/www
    echo -e "${GREEN}Directories created.${NC}"
}

# Step 3: Check .env file
check_env() {
    echo -e "${YELLOW}[3/6] Checking environment configuration...${NC}"
    if [ ! -f "$APP_DIR/.env" ]; then
        echo -e "${RED}ERROR: .env file not found!${NC}"
        echo "Please create $APP_DIR/.env from .env.production.example"
        echo ""
        echo "Example:"
        echo "  cp .env.production.example $APP_DIR/.env"
        echo "  nano $APP_DIR/.env"
        exit 1
    fi
    echo -e "${GREEN}.env file found.${NC}"
}

# Step 4: Get SSL certificate
setup_ssl() {
    echo -e "${YELLOW}[4/6] Setting up SSL certificate...${NC}"
    
    if [ -f "$APP_DIR/certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
        echo -e "${GREEN}SSL certificate already exists.${NC}"
        return
    fi

    echo "Creating temporary nginx config for SSL challenge..."
    
    # Create temporary nginx config without SSL
    cat > $APP_DIR/nginx/conf.d/default.conf << 'NGINX_TEMP'
server {
    listen 80;
    server_name lumiere.mindcentra.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Waiting for SSL setup...';
        add_header Content-Type text/plain;
    }
}
NGINX_TEMP

    # Start nginx only
    docker compose up -d nginx
    sleep 5

    # Get certificate
    echo "Requesting SSL certificate from Let's Encrypt..."
    docker compose run --rm certbot certonly \
        --webroot \
        -w /var/www/certbot \
        -d $DOMAIN \
        --email admin@$DOMAIN \
        --agree-tos \
        --no-eff-email

    # Restore full nginx config
    cat > $APP_DIR/nginx/conf.d/default.conf << 'NGINX_FULL'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name lumiere.mindcentra.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name lumiere.mindcentra.com;

    ssl_certificate /etc/letsencrypt/live/lumiere.mindcentra.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lumiere.mindcentra.com/privkey.pem;

    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_FULL

    docker compose down
    echo -e "${GREEN}SSL certificate obtained.${NC}"
}

# Step 5: Build and start containers
start_containers() {
    echo -e "${YELLOW}[5/6] Building and starting containers...${NC}"
    docker compose build --no-cache
    docker compose up -d
    echo -e "${GREEN}Containers started.${NC}"
}

# Step 6: Run database migrations
run_migrations() {
    echo -e "${YELLOW}[6/6] Running database migrations...${NC}"
    sleep 10  # Wait for database to be ready
    docker compose exec -T backend npx prisma migrate deploy
    echo -e "${GREEN}Migrations completed.${NC}"
}

# Main execution
main() {
    cd $APP_DIR
    
    install_docker
    setup_directories
    check_env
    setup_ssl
    start_containers
    run_migrations

    echo ""
    echo -e "${GREEN}=========================================="
    echo "DEPLOYMENT COMPLETE!"
    echo "==========================================${NC}"
    echo ""
    echo "Your application is now available at:"
    echo "  https://$DOMAIN"
    echo ""
    echo "Useful commands:"
    echo "  docker compose logs -f        # View logs"
    echo "  docker compose ps             # Check status"
    echo "  docker compose restart        # Restart services"
    echo "  docker compose down           # Stop all services"
    echo ""
}

main "$@"
