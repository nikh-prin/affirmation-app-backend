#!/bin/bash
# Affirmation App Docker Deployment Script

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}    Affirmation App Docker Deployment Tool    ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo ""

# Function to show usage information
show_usage() {
  echo -e "Usage: $0 [command]"
  echo ""
  echo -e "Commands:"
  echo -e "  ${GREEN}build${NC}      - Build Docker images"
  echo -e "  ${GREEN}up${NC}         - Start all services"
  echo -e "  ${GREEN}down${NC}       - Stop all services"
  echo -e "  ${GREEN}logs${NC}       - View logs"
  echo -e "  ${GREEN}ps${NC}         - List running containers"
  echo -e "  ${GREEN}migrate${NC}    - Run database migrations"
  echo -e "  ${GREEN}seed${NC}       - Seed the database with initial data"
  echo -e "  ${GREEN}push${NC}       - Build and push image to a registry"
  echo -e "  ${GREEN}help${NC}       - Show this help message"
  echo ""
  echo -e "Examples:"
  echo -e "  $0 build     # Build all Docker images"
  echo -e "  $0 up        # Start all containers"
  echo -e "  $0 down      # Stop all containers"
  echo ""
}

# Check if any command is provided
if [ $# -eq 0 ]; then
  show_usage
  exit 1
fi

# Process commands
case "$1" in
  build)
    echo -e "${YELLOW}Building Docker images...${NC}"
    docker-compose build
    echo -e "${GREEN}Build completed.${NC}"
    ;;
    
  up)
    echo -e "${YELLOW}Starting services...${NC}"
    docker-compose up -d
    echo -e "${GREEN}Services started. Backend available at http://localhost:4000${NC}"
    ;;
    
  down)
    echo -e "${YELLOW}Stopping services...${NC}"
    docker-compose down
    echo -e "${GREEN}Services stopped.${NC}"
    ;;
    
  logs)
    if [ -z "$2" ]; then
      echo -e "${YELLOW}Showing logs for all services...${NC}"
      docker-compose logs -f
    else
      echo -e "${YELLOW}Showing logs for $2...${NC}"
      docker-compose logs -f "$2"
    fi
    ;;
    
  ps)
    echo -e "${YELLOW}Listing running containers...${NC}"
    docker-compose ps
    ;;
    
  migrate)
    echo -e "${YELLOW}Running database migrations...${NC}"
    docker-compose exec api npx prisma migrate deploy
    echo -e "${GREEN}Migrations completed.${NC}"
    ;;
    
  seed)
    echo -e "${YELLOW}Seeding the database...${NC}"
    docker-compose exec api npx prisma db seed
    echo -e "${GREEN}Database seeded.${NC}"
    ;;
    
  push)
    if [ -z "$2" ]; then
      echo -e "${RED}Error: Please provide a registry name.${NC}"
      echo -e "Usage: $0 push <registry-name>"
      echo -e "Example: $0 push docker.io/myusername"
      exit 1
    fi
    
    REGISTRY=$2
    TAG=${3:-latest}
    
    echo -e "${YELLOW}Building and pushing image to $REGISTRY/affirmation-app-backend:$TAG${NC}"
    docker build -t $REGISTRY/affirmation-app-backend:$TAG .
    
    echo -e "${YELLOW}Pushing image...${NC}"
    docker push $REGISTRY/affirmation-app-backend:$TAG
    echo -e "${GREEN}Image pushed successfully.${NC}"
    ;;
    
  help)
    show_usage
    ;;
    
  *)
    echo -e "${RED}Unknown command: $1${NC}"
    show_usage
    exit 1
    ;;
esac

exit 0
