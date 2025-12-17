#!/bin/bash

# Christmas Spotify Playlist Uploader - Test Runner
# Runs all tests in Docker containers

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Banner
echo ""
echo -e "${GREEN}🎄 Christmas Spotify Playlist Uploader - Test Suite 🎄${NC}"
echo ""

# Parse command line arguments
COVERAGE=false
BACKEND_ONLY=false
FRONTEND_ONLY=false
WATCH=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --coverage)
      COVERAGE=true
      shift
      ;;
    --backend)
      BACKEND_ONLY=true
      shift
      ;;
    --frontend)
      FRONTEND_ONLY=true
      shift
      ;;
    --watch)
      WATCH=true
      shift
      ;;
    --help)
      echo "Usage: ./run-tests.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --coverage       Run tests with coverage report"
      echo "  --backend        Run only backend tests"
      echo "  --frontend       Run only frontend tests"
      echo "  --watch          Run tests in watch mode (interactive)"
      echo "  --help           Show this help message"
      echo ""
      echo "Examples:"
      echo "  ./run-tests.sh                    # Run all tests"
      echo "  ./run-tests.sh --coverage         # Run all tests with coverage"
      echo "  ./run-tests.sh --backend          # Run only backend tests"
      echo "  ./run-tests.sh --frontend --watch # Run frontend tests in watch mode"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Run './run-tests.sh --help' for usage information"
      exit 1
      ;;
  esac
done

# Cleanup function
cleanup() {
  echo ""
  echo -e "${YELLOW}🧹 Cleaning up test containers...${NC}"
  docker-compose -f docker-compose.test.yml down --remove-orphans 2>/dev/null || true
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Error: Docker is not running${NC}"
  echo "Please start Docker and try again"
  exit 1
fi

# Determine which command to run
if [ "$COVERAGE" = true ]; then
  BACKEND_CMD="backend-test-coverage"
  FRONTEND_CMD="frontend-test-coverage"
else
  BACKEND_CMD="backend-test"
  FRONTEND_CMD="frontend-test"
fi

# Watch mode override (not available with coverage)
if [ "$WATCH" = true ]; then
  if [ "$COVERAGE" = true ]; then
    echo -e "${RED}❌ Error: Watch mode is not available with coverage reports${NC}"
    exit 1
  fi
  echo -e "${YELLOW}⚠️  Watch mode: Press Ctrl+C to exit${NC}"
  echo ""
fi

# Run backend tests
if [ "$FRONTEND_ONLY" = false ]; then
  echo -e "${BLUE}🧪 Running Backend Tests...${NC}"
  echo ""

  if [ "$WATCH" = true ]; then
    docker-compose -f docker-compose.test.yml run --rm backend-test sh -c "npm install && npm run test:watch"
  else
    if docker-compose -f docker-compose.test.yml run --rm $BACKEND_CMD; then
      echo ""
      echo -e "${GREEN}✅ Backend tests passed!${NC}"
    else
      echo ""
      echo -e "${RED}❌ Backend tests failed!${NC}"
      exit 1
    fi
  fi

  # Show coverage report location if coverage was run
  if [ "$COVERAGE" = true ]; then
    echo -e "${BLUE}📊 Backend coverage report: backend/coverage/index.html${NC}"
  fi

  echo ""
fi

# Run frontend tests
if [ "$BACKEND_ONLY" = false ]; then
  echo -e "${BLUE}🧪 Running Frontend Tests...${NC}"
  echo ""

  if [ "$WATCH" = true ]; then
    docker-compose -f docker-compose.test.yml run --rm frontend-test sh -c "npm install && npm run test:watch"
  else
    if docker-compose -f docker-compose.test.yml run --rm $FRONTEND_CMD; then
      echo ""
      echo -e "${GREEN}✅ Frontend tests passed!${NC}"
    else
      echo ""
      echo -e "${RED}❌ Frontend tests failed!${NC}"
      exit 1
    fi
  fi

  # Show coverage report location if coverage was run
  if [ "$COVERAGE" = true ]; then
    echo -e "${BLUE}📊 Frontend coverage report: frontend/coverage/index.html${NC}"
  fi

  echo ""
fi

# Success message
echo ""
echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
echo ""

if [ "$COVERAGE" = true ]; then
  echo -e "${BLUE}📊 Coverage Reports:${NC}"
  if [ "$FRONTEND_ONLY" = false ]; then
    echo "   Backend:  backend/coverage/index.html"
  fi
  if [ "$BACKEND_ONLY" = false ]; then
    echo "   Frontend: frontend/coverage/index.html"
  fi
  echo ""
  echo "Open coverage reports with:"
  if [ "$FRONTEND_ONLY" = false ]; then
    echo "  open backend/coverage/index.html"
  fi
  if [ "$BACKEND_ONLY" = false ]; then
    echo "  open frontend/coverage/index.html"
  fi
  echo ""
fi

exit 0
