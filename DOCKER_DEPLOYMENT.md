# Docker Deployment Guide for Affirmation App

This guide provides detailed instructions for deploying the Affirmation App using Docker.

## Table of Contents

- [Docker Deployment Guide for Affirmation App](#docker-deployment-guide-for-affirmation-app)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Local Development with Docker](#local-development-with-docker)
  - [Production Deployment with Docker](#production-deployment-with-docker)
  - [Using the Docker Deployment Script](#using-the-docker-deployment-script)
  - [Deploying to Cloud Providers](#deploying-to-cloud-providers)
  - [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Git (to clone the repository)

## Local Development with Docker

For local development, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/my-affirmation-app.git
   cd my-affirmation-app
   ```

2. Start the services using the deployment script:

   ```bash
   ./docker-deploy.sh up
   ```

3. The backend will be running at [http://localhost:4000](http://localhost:4000)

4. Run database migrations and seed data:

   ```bash
   ./docker-deploy.sh migrate
   ./docker-deploy.sh seed
   ```

5. To view logs:

   ```bash
   ./docker-deploy.sh logs
   ```

6. When you're done, stop the services:
   ```bash
   ./docker-deploy.sh down
   ```

## Production Deployment with Docker

For production deployment, you'll need to configure environment variables properly:

1. Create a `.env` file in the root directory with production settings:

   ```
   DATABASE_URL=postgresql://username:password@your-production-db-host:5432/affirmation_app
   JWT_SECRET=your-secure-jwt-secret
   NODE_ENV=production
   PORT=4000
   ```

2. Build a production Docker image:

   ```bash
   ./docker-deploy.sh build
   ```

3. Push the image to a container registry:

   ```bash
   ./docker-deploy.sh push your-registry/name
   ```

4. On your production server, pull and run the image:
   ```bash
   docker pull your-registry/name/affirmation-app-backend:latest
   docker run -d -p 4000:4000 --name affirmation-backend --env-file .env your-registry/name/affirmation-app-backend:latest
   ```

## Using the Docker Deployment Script

The included `docker-deploy.sh` script provides several commands:

- `./docker-deploy.sh build` - Build Docker images
- `./docker-deploy.sh up` - Start all services
- `./docker-deploy.sh down` - Stop all services
- `./docker-deploy.sh logs [service]` - View logs (optionally for a specific service)
- `./docker-deploy.sh ps` - List running containers
- `./docker-deploy.sh migrate` - Run database migrations
- `./docker-deploy.sh seed` - Seed the database with initial data
- `./docker-deploy.sh push <registry>` - Build and push image to a registry

## Deploying to Cloud Providers

### Render

1. Update the `render.yaml` file with your specific settings
2. Connect your GitHub repository to Render
3. Create a new Web Service, selecting "Deploy from Blueprint"
4. Render will automatically configure the services as defined in `render.yaml`

### AWS

1. Create an ECR repository for your Docker image
2. Push your image:

   ```bash
   aws ecr get-login-password --region region | docker login --username AWS --password-stdin your-aws-account.dkr.ecr.region.amazonaws.com

   ./docker-deploy.sh push your-aws-account.dkr.ecr.region.amazonaws.com/affirmation-app
   ```

3. Deploy using AWS ECS or Fargate

### Google Cloud

1. Configure Google Cloud authentication:
   ```bash
   gcloud auth configure-docker
   ```
2. Push your image:
   ```bash
   ./docker-deploy.sh push gcr.io/your-project/affirmation-app
   ```
3. Deploy using Google Cloud Run:
   ```bash
   gcloud run deploy affirmation-app-backend --image gcr.io/your-project/affirmation-app --platform managed
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**

   - Ensure your `DATABASE_URL` environment variable is correctly set
   - Check if the database is accessible from the Docker container network

2. **Permission Issues**

   - If you encounter permission issues with the deployment script:
     ```bash
     chmod +x docker-deploy.sh
     ```

3. **Port Conflicts**

   - If port 4000 is already in use, modify the ports in `docker-compose.yml`:
     ```yaml
     ports:
       - "4001:4000" # Maps host port 4001 to container port 4000
     ```

4. **Checking Container Logs**
   - If the application isn't working as expected:
     ```bash
     ./docker-deploy.sh logs api
     ```

### Getting Help

If you encounter issues not covered in this guide, please:

1. Check the Docker and Docker Compose documentation
2. Review the logs using `./docker-deploy.sh logs`
3. Open an issue in the GitHub repository with detailed information about your problem
