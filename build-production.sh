#!/bin/bash

# Backend Deployment Script
echo "===== BUILDING BACKEND FOR PRODUCTION ====="

# Navigate to the backend directory
cd "$(dirname "$0")"

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build TypeScript
echo "Building TypeScript..."
npm run build

echo "===== BACKEND BUILD COMPLETED ====="
echo "To start the server, run: npm start"
