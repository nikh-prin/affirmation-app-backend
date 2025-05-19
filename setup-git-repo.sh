#!/bin/bash
# Script to initialize a git repository and push to GitHub

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}    Affirmation App Backend Git Setup Tool    ${NC}"
echo -e "${BLUE}==============================================${NC}"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed.${NC}"
    echo "Please install git and try again."
    exit 1
fi

# Check if already in a git repository
if git rev-parse --is-inside-work-tree &> /dev/null; then
    echo -e "${YELLOW}This directory is already a git repository.${NC}"
    GIT_REMOTE=$(git remote -v 2>/dev/null)
    if [ -n "$GIT_REMOTE" ]; then
        echo -e "Remote already configured:"
        echo "$GIT_REMOTE"
    else
        echo -e "No remote is configured yet."
    fi
else
    # Initialize a new git repository
    echo -e "${YELLOW}Initializing a new git repository...${NC}"
    git init
    echo -e "${GREEN}Git repository initialized.${NC}"
fi

# Prompt for GitHub repository details
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter the repository name [affirmation-app-backend]: " REPO_NAME
REPO_NAME=${REPO_NAME:-affirmation-app-backend}

# Check if remote already exists
REMOTE_EXISTS=$(git remote -v | grep -c "origin")
if [ "$REMOTE_EXISTS" -gt 0 ]; then
    echo -e "${YELLOW}Remote 'origin' already exists. Do you want to update it?${NC}"
    read -p "Update remote? (y/n): " UPDATE_REMOTE
    if [[ "$UPDATE_REMOTE" =~ ^[Yy]$ ]]; then
        git remote set-url origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
        echo -e "${GREEN}Remote 'origin' updated.${NC}"
    fi
else
    # Add GitHub remote
    echo -e "${YELLOW}Adding GitHub remote...${NC}"
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo -e "${GREEN}Remote 'origin' added.${NC}"
fi

# Stage all files
echo -e "${YELLOW}Staging all files...${NC}"
git add .
echo -e "${GREEN}All files staged.${NC}"

# Commit
echo -e "${YELLOW}Committing changes...${NC}"
read -p "Enter commit message [Initial commit]: " COMMIT_MSG
COMMIT_MSG=${COMMIT_MSG:-"Initial commit"}
git commit -m "$COMMIT_MSG"
echo -e "${GREEN}Changes committed.${NC}"

# Push to GitHub
echo -e "${YELLOW}Do you want to push to GitHub now?${NC}"
read -p "Push to GitHub? (y/n): " PUSH_TO_GITHUB
if [[ "$PUSH_TO_GITHUB" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Pushing to GitHub...${NC}"
    echo -e "${BLUE}Note: You may be prompted for your GitHub credentials.${NC}"
    
    # Check if the default branch is master or main
    DEFAULT_BRANCH=$(git branch --show-current)
    
    # Push to GitHub
    git push -u origin "$DEFAULT_BRANCH"
    
    echo -e "${GREEN}Repository pushed to GitHub.${NC}"
    echo -e "${BLUE}Your repository is available at: https://github.com/$GITHUB_USERNAME/$REPO_NAME${NC}"
else
    echo -e "${BLUE}Skipping push to GitHub.${NC}"
    echo -e "${YELLOW}To push later, run:${NC} git push -u origin main"
fi

echo ""
echo -e "${GREEN}Backend repository setup complete!${NC}"
echo -e "${BLUE}==============================================${NC}"
