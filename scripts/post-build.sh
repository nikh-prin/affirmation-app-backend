#!/bin/bash
# Ensure JSON files are copied to the dist directory

echo "Copying JSON files to dist directory..."
if [ -d "src/data" ]; then
  mkdir -p dist/data
  cp src/data/*.json dist/data/ 2>/dev/null || echo "No JSON files found in src/data"
fi

# Copy any other data files if needed
if [ -d "src/assets" ]; then
  mkdir -p dist/assets
  cp -r src/assets/* dist/assets/ 2>/dev/null || echo "No files found in src/assets"
fi

echo "Post-build file copying completed!"
