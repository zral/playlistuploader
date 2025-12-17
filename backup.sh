#!/bin/bash

# 🎄 Christmas Spotify Playlist Uploader - Manual Backup Script
# This script creates a manual backup of the MongoDB database

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎄 MongoDB Manual Backup Script${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Error: Docker is not running${NC}"
  echo "Please start Docker Desktop and try again."
  exit 1
fi

# Check if MongoDB container is running
if ! docker ps --format '{{.Names}}' | grep -q "spotify-uploader-mongodb-prod"; then
  echo -e "${YELLOW}⚠️  Warning: Production MongoDB container is not running${NC}"
  echo ""
  echo "Starting services with docker-compose..."
  docker-compose -f docker-compose.prod.yml up -d mongodb
  echo ""
  echo "Waiting for MongoDB to be ready..."
  sleep 5
fi

# Create backup directory if it doesn't exist
mkdir -p backups

# Generate timestamp for backup
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backups/manual-backup-${TIMESTAMP}"

echo -e "${BLUE}📦 Creating backup...${NC}"
echo "Timestamp: ${TIMESTAMP}"
echo "Location: ${BACKUP_DIR}"
echo ""

# Run mongodump in a container
if docker run --rm \
  --network spotifyuploader_spotify-network-prod \
  -v "$(pwd)/backups:/backups" \
  mongo:7 \
  mongodump \
  --uri="mongodb://mongodb:27017/spotify-uploader" \
  --out="/backups/manual-backup-${TIMESTAMP}" \
  --quiet; then

  # Get backup size
  BACKUP_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)

  echo ""
  echo -e "${GREEN}✅ Backup completed successfully!${NC}"
  echo ""
  echo "Backup Details:"
  echo "  Location: ${BACKUP_DIR}"
  echo "  Size: ${BACKUP_SIZE}"
  echo "  Collections backed up:"

  # List collections in backup
  for collection in "${BACKUP_DIR}/spotify-uploader"/*.bson; do
    if [ -f "$collection" ]; then
      COLLECTION_NAME=$(basename "$collection" .bson)
      COLLECTION_SIZE=$(du -sh "$collection" | cut -f1)
      echo "    - ${COLLECTION_NAME} (${COLLECTION_SIZE})"
    fi
  done

  echo ""
  echo -e "${BLUE}📋 Backup Info:${NC}"
  echo "  To restore this backup, run:"
  echo "    ./restore.sh ${BACKUP_DIR}"
  echo ""

  # List all backups
  BACKUP_COUNT=$(find backups -maxdepth 1 -type d -name 'backup-*' -o -name 'manual-backup-*' | wc -l | tr -d ' ')
  echo -e "${BLUE}📁 Total backups: ${BACKUP_COUNT}${NC}"
  echo ""

else
  echo ""
  echo -e "${RED}❌ Backup failed!${NC}"
  echo "Please check Docker logs for more information:"
  echo "  docker logs spotify-uploader-mongodb-prod"
  exit 1
fi
