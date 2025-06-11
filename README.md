# CCTV Monitor API

A comprehensive REST API backend for managing CCTV cameras, recordings, and alerts built with Node.js, TypeScript, and MySQL.

## 🚀 Features

- **Camera Management**: Full CRUD operations for camera entities
- **Recording Management**: Track and manage video recordings
- **Alert System**: Handle motion detection and system alerts
- **Dashboard Statistics**: Real-time analytics and monitoring
- **Database Integration**: MySQL with connection pooling
- **Security**: Rate limiting, CORS, and input validation
- **TypeScript**: Full type safety and modern development experience

## 📋 Prerequisites

- Node.js 16+ 
- MySQL 5.7+
- npm or yarn

## 🛠️ Installation

1. **Clone and navigate to the project:**
   ```bash
   cd /Applications/www/_personal/cctv-monitor-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Initialize the database:**
   ```bash
   npm run db:init
   npm run db:seed
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=33006
DB_NAME=cctv
DB_USER=root
DB_PASSWORD=your_password

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration (for future authentication)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# API Configuration
API_VERSION=v1
```

## 🚦 Usage

### Development

Start the development server with hot reloading:

```bash
npm run dev
```

### Production

Build and start the production server:

```bash
npm run build
npm start
```

### Database Operations

```bash
# Initialize database schema
npm run db:init

# Seed with sample data
npm run db:seed

# Reset database (drop and recreate)
npm run db:reset
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Health Check
```
GET /health
```

### Database Status
```
GET /api/database/status
```

### Cameras

#### Get All Cameras
```
GET /api/cameras
```

#### Get Camera by ID
```
GET /api/cameras/:id
```

#### Create New Camera
```
POST /api/cameras
Content-Type: application/json

{
  "name": "Front Door",
  "location": "Main Entrance",
  "streamUrl": "rtsp://192.168.1.100:554/stream1",
  "resolution": "1080p",
  "type": "outdoor",
  "recordingEnabled": true
}
```

#### Update Camera
```
PUT /api/cameras/:id
Content-Type: application/json

{
  "name": "Updated Camera Name",
  "isOnline": true
}
```

#### Delete Camera
```
DELETE /api/cameras/:id
```

#### Get Cameras by Type
```
GET /api/cameras/type/:type
# type: indoor | outdoor
```

#### Update Camera Status
```
PATCH /api/cameras/:id/status
Content-Type: application/json

{
  "isOnline": true
}
```

### Recordings

#### Get All Recordings
```
GET /api/recordings
```

#### Get Recording by ID
```
GET /api/recordings/:id
```

#### Get Recordings by Camera
```
GET /api/recordings/camera/:cameraId?limit=10
```

#### Create New Recording
```
POST /api/recordings
Content-Type: application/json

{
  "cameraId": "1",
  "filename": "recording_20240611_120000.mp4",
  "duration": 300,
  "size": "45.2",
  "type": "motion"
}
```

#### Update Recording
```
PUT /api/recordings/:id
```

#### Delete Recording
```
DELETE /api/recordings/:id
```

### Alerts

#### Get All Alerts
```
GET /api/alerts
```

#### Get Alert by ID
```
GET /api/alerts/:id
```

#### Get Alerts by Camera
```
GET /api/alerts/camera/:cameraId
```

#### Create New Alert
```
POST /api/alerts
Content-Type: application/json

{
  "cameraId": "1",
  "type": "motion",
  "message": "Motion detected at main entrance",
  "severity": "medium"
}
```

#### Update Alert (Mark as Read)
```
PUT /api/alerts/:id
Content-Type: application/json

{
  "isRead": true
}
```

#### Delete Alert
```
DELETE /api/alerts/:id
```

### Dashboard

#### Get Dashboard Statistics
```
GET /api/dashboard/stats
```

## 🏗️ Project Structure

```
src/
├── index.ts                 # Main server entry point
├── config/
│   └── database.ts         # Database configuration and utilities
├── controllers/            # Request handlers
│   ├── CameraController.ts
│   ├── RecordingController.ts
│   ├── AlertController.ts
│   └── DashboardController.ts
├── middleware/             # Express middleware
│   ├── errorHandler.ts
│   ├── notFoundHandler.ts
│   └── security.ts
├── models/                 # Data access layer
│   ├── Camera.ts
│   ├── Recording.ts
│   └── Alert.ts
├── routes/                 # API route definitions
│   ├── cameras.ts
│   ├── recordings.ts
│   ├── alerts.ts
│   └── dashboard.ts
├── scripts/                # Database scripts
│   ├── init-database.ts
│   └── seed-database.ts
└── types/                  # TypeScript type definitions
    └── index.ts
```

## 🗄️ Database Schema

### Tables

- **cameras**: Store camera information and configuration
- **recordings**: Track video recordings with metadata
- **alerts**: System alerts and notifications

### Relationships

- `recordings.camera_id` → `cameras.id`
- `alerts.camera_id` → `cameras.id`

## 🔒 Security Features

- **Rate Limiting**: Protects against abuse
- **CORS**: Configurable cross-origin requests
- **Input Validation**: Joi schema validation
- **Error Handling**: Comprehensive error responses
- **Security Headers**: Helmet.js for security headers

## 📊 Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": [...],
  "message": "Optional success message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-06-11T09:30:36.592Z"
}
```

## 🚀 Deployment

### Using PM2 (Recommended)

```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name "cctv-api"
```

### Using Docker

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

## 🧪 Testing

Test API endpoints using curl:

```bash
# Health check
curl http://localhost:3001/health

# Get cameras
curl http://localhost:3001/api/cameras

# Create camera
curl -X POST http://localhost:3001/api/cameras \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Camera","location":"Test Location","streamUrl":"rtsp://test.url","resolution":"1080p","type":"indoor","recordingEnabled":true}'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:

- Check the [API Documentation](#-api-documentation)
- Review the [Project Structure](#-project-structure)
- Check server logs for debugging information

## 🔮 Future Enhancements

- [ ] JWT Authentication
- [ ] Real-time WebSocket notifications
- [ ] File upload for camera thumbnails
- [ ] Advanced search and filtering
- [ ] API versioning
- [ ] OpenAPI/Swagger documentation
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline
