#!/bin/bash

# 🎄 Christmas Spotify Playlist Uploader - Database Restore Script
# This script restores a MongoDB backup

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎄 MongoDB Restore Script${NC}"
echo ""

# Check if backup directory is provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: No backup directory specified${NC}"
  echo ""
  echo "Usage: ./restore.sh <backup-directory>"
  echo ""
  echo "Available backups:"

  # List available backups
  BACKUPS=$(find backups -maxdepth 1 -type d -name 'backup-*' -o -name 'manual-backup-*' | sort -r)

  if [ -z "$BACKUPS" ]; then
    echo "  No backups found in ./backups/"
  else
    echo "$BACKUPS" | while read backup; do
      BACKUP_SIZE=$(du -sh "$backup" 2>/dev/null | cut -f1)
      echo "  - $backup ($BACKUP_SIZE)"
    done
  fi

  echo ""
  exit 1
fi

BACKUP_DIR="$1"

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
  echo -e "${RED}❌ Error: Backup directory does not exist: ${BACKUP_DIR}${NC}"
  echo ""
  echo "Please check the path and try again."
  exit 1
fi

# Check if backup contains the database
if [ ! -d "$BACKUP_DIR/spotify-uploader" ]; then
  echo -e "${RED}❌ Error: Invalid backup directory${NC}"
  echo "Expected to find 'spotify-uploader' directory in ${BACKUP_DIR}"
  exit 1
fi

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

# Display backup information
echo -e "${BLUE}📦 Backup Information:${NC}"
echo "  Location: ${BACKUP_DIR}"
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
echo "  Size: ${BACKUP_SIZE}"
echo ""
echo "Collections to restore:"
for collection in "${BACKUP_DIR}/spotify-uploader"/*.bson; do
  if [ -f "$collection" ]; then
    COLLECTION_NAME=$(basename "$collection" .bson)
    COLLECTION_SIZE=$(du -sh "$collection" | cut -f1)
    echo "  - ${COLLECTION_NAME} (${COLLECTION_SIZE})"
  fi
done
echo ""

# Confirm restoration
echo -e "${YELLOW}⚠️  WARNING: This will overwrite the current database!${NC}"
echo ""
read -p "Are you sure you want to restore this backup? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo ""
  echo -e "${YELLOW}Restore cancelled.${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}🔄 Restoring database...${NC}"
echo ""

# Convert relative path to absolute path
ABS_BACKUP_DIR=$(cd "$BACKUP_DIR" && pwd)

# Run mongorestore in a container
if docker run --rm \
  --network spotifyuploader_spotify-network-prod \
  -v "${ABS_BACKUP_DIR}:/backup" \
  mongo:7 \
  mongorestore \
  --uri="mongodb://mongodb:27017" \
  --drop \
  /backup \
  --quiet; then

  echo ""
  echo -e "${GREEN}✅ Database restored successfully!${NC}"
  echo ""
  echo -e "${BLUE}📋 Next Steps:${NC}"
  echo "  1. Restart the application:"
  echo "     docker-compose -f docker-compose.prod.yml restart backend"
  echo ""
  echo "  2. Verify the restoration by logging in to the application"
  echo ""

else
  echo ""
  echo -e "${RED}❌ Restore failed!${NC}"
  echo "Please check Docker logs for more information:"
  echo "  docker logs spotify-uploader-mongodb-prod"
  exit 1
fi
