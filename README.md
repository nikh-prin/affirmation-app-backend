# Affirmation App Backend API

A robust Node.js backend API for the Affirmation App, providing user authentication, affirmation management, and push notification services.

## Features

- **RESTful API**: Well-structured endpoints for all app features
- **User Authentication**: Secure JWT-based authentication system
- **Database Integration**: PostgreSQL with Prisma ORM for efficient data management
- **Push Notifications**: Server-side scheduling and delivery of affirmation notifications
- **Premium Subscriptions**: Support for premium user features and payment processing
- **Docker Support**: Containerized deployment for consistent environments

## Tech Stack

- **Node.js & Express**: Fast, minimalist web framework
- **TypeScript**: Type-safe JavaScript for improved reliability
- **PostgreSQL**: Powerful open-source relational database
- **Prisma ORM**: Next-generation ORM for database access
- **JWT**: Secure authentication mechanism
- **Docker**: Containerization for easy deployment

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Docker and Docker Compose (optional, for containerized deployment)

### Option 1: Using Docker (Recommended)

The easiest way to get started is using Docker Compose:

1. Make sure Docker and Docker Compose are installed on your system
2. Clone this repository:

```bash
git clone https://github.com/yourusername/affirmation-app-backend.git
cd affirmation-app-backend
```

3. Start the services:

```bash
./docker-deploy.sh up
```

4. The backend will be available at http://localhost:4000

5. To seed the database with initial data:

```bash
./docker-deploy.sh seed
```

6. To view logs:

```bash
./docker-deploy.sh logs
```

7. To stop the services:

```bash
./docker-deploy.sh down
```

### Option 2: Manual Setup

1. Clone this repository:

```bash
git clone https://github.com/yourusername/affirmation-app-backend.git
cd affirmation-app-backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your database credentials and other settings
```

4. Set up the database:

```bash
npx prisma migrate dev
npm run prisma:seed
```

5. Start the development server:

```bash
npm run dev
```

## Environment Variables

Create a `.env` file with the following variables:

```
DATABASE_URL="postgresql://username:password@localhost:5432/affirmation_app"
JWT_SECRET="your_secure_jwt_secret"
PORT=4000
NODE_ENV=development
EXPO_ACCESS_TOKEN="your_expo_access_token" # Optional, for push notifications
```

## API Documentation

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login with email and password
- `GET /api/auth/me`: Get current user information

### Affirmations

- `GET /api/affirmations`: Get a list of affirmations
- `GET /api/affirmations/random`: Get a random affirmation
- `GET /api/affirmations/:id`: Get a specific affirmation
- `POST /api/affirmations`: Create a new affirmation (admin only)
- `PUT /api/affirmations/:id`: Update an affirmation (admin only)
- `DELETE /api/affirmations/:id`: Delete an affirmation (admin only)

### Favorites

- `GET /api/favorites`: Get user's favorite affirmations
- `POST /api/favorites/:id`: Add an affirmation to favorites
- `DELETE /api/favorites/:id`: Remove an affirmation from favorites

### Subscriptions

- `GET /api/subscriptions`: Get user's subscription information
- `POST /api/subscriptions`: Subscribe to premium plan
- `DELETE /api/subscriptions`: Cancel subscription

### Users

- `GET /api/users/profile`: Get user profile
- `PUT /api/users/profile`: Update user profile
- `PUT /api/users/password`: Change password

## Deployment

This backend can be deployed to various cloud platforms:

- **Render**: Use the included `render.yaml` blueprint
- **Railway**: Use the included `railway.toml` configuration
- **Docker-based platforms**: Use the included Docker configuration

For detailed deployment instructions, see [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md).

## Development

### Database Migrations

To create a new migration after modifying the Prisma schema:

```bash
npx prisma migrate dev --name your_migration_name
```

### Generating Prisma Client

After updating the schema:

```bash
npx prisma generate
```

### Running Tests

```bash
npm test
```

## Push Notifications

The backend uses Expo's push notification service to deliver affirmations to users. Notifications are scheduled via cron jobs to deliver at specific times.

To enable push notifications:

1. Ensure `expo-server-sdk` is installed
2. Configure CRON jobs as described in `src/services/pushNotificationService.js`
3. Ensure users register their push tokens via the API

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Prisma team for the amazing ORM
- Express.js for the great web framework
- All contributors to this project

#### Deploying to Railway

1. Install Railway CLI
2. Login and link your project
3. Deploy with one command

```bash
railway up
```

#### Deploying to Render

1. Connect your GitHub repository to Render
2. Render will automatically detect the configuration
3. Click Deploy

## API Documentation

The API provides endpoints for:

- Authentication (signup, login)
- Affirmation management
- User preferences
- Push notification registration

For detailed API documentation, see the `docs/API.md` file.

## Environment Variables

See `.env.example` for all required environment variables.

## Push Notifications

The backend uses Expo's push notification service to deliver affirmations to users. Notifications are scheduled via cron jobs to deliver at specific times.

To enable push notifications:

1. Ensure `expo-server-sdk` is installed
2. Configure CRON jobs as described in `src/services/pushNotificationService.js`
3. Ensure users register their push tokens via the API
