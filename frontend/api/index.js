import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import spacesRoutes from './routes/spaces.js';
import seatsRoutes from './routes/seats.js';
import reservationsRoutes from './routes/reservations.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[Vercel Serverless] ${req.method} ${req.url}`);
  next();
});

// Mount routes for both with-prefix and without-prefix paths
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/spaces/:spaceId/seats', seatsRoutes);
app.use('/spaces/:spaceId/seats', seatsRoutes);

app.use('/api/spaces', spacesRoutes);
app.use('/spaces', spacesRoutes);

app.use('/api/seats', seatsRoutes);
app.use('/seats', seatsRoutes);

app.use('/api/reservations', reservationsRoutes);
app.use('/reservations', reservationsRoutes);

// Health check and root endpoints
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'StudySpace Serverless API',
    timestamp: new Date().toISOString()
  });
});

app.get(['/api', '/'], (req, res) => {
  res.json({
    message: 'StudySpace Serverless API is running!',
    endpoints: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/spaces',
      '/api/reservations',
      '/api/health'
    ]
  });
});

export default app;
