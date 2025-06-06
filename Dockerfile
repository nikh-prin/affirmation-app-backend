FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the TypeScript application
RUN npm run build

# Make sure data files are copied (as a fallback)
RUN mkdir -p dist/data && cp -r src/data/*.json dist/data/ || echo "No JSON files found"

# Expose the port the app runs on
EXPOSE 4000

# Define the command to run the app
CMD ["npm", "start"]
