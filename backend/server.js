import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import spacesRoutes from './routes/spaces.js';
import seatsRoutes from './routes/seats.js';
import reservationsRoutes from './routes/reservations.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for simplicity in local & deployment
  credentials: true
}));
app.use(express.json());

// Request logger for development
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/spaces', spacesRoutes);
app.use('/api/spaces/:spaceId/seats', seatsRoutes);
app.use('/api', seatsRoutes); // for /api/seats/:id
app.use('/api/reservations', reservationsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'StudySpace Backend API',
    message: 'Server is healthy and ready to accept requests.',
    timestamp: new Date().toISOString()
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to StudySpace API!',
    docs: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/register, POST /api/auth/login, GET /api/auth/me',
      spaces: 'GET /api/spaces, POST /api/spaces, PUT /api/spaces/:id, DELETE /api/spaces/:id',
      seats: 'GET /api/spaces/:spaceId/seats, POST /api/spaces/:spaceId/seats, DELETE /api/seats/:id',
      reservations: 'POST /api/reservations, GET /api/reservations/my, GET /api/reservations, PUT /api/reservations/:id/cancel'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 StudySpace Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});
