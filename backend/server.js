import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import schemeRoutes from './routes/schemes.js';
import chatRoutes from './routes/chat.js';
import officeRoutes from './routes/offices.js';
import { db } from './services/db.js';

dotenv.config();

// Simple validation of environment variables
const PORT = process.env.PORT || 5000;
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is missing. Using default fallback.');
}

const app = express();

// Middleware
app.use(cors({ origin: '*' })); // Allow requests from all origins (suitable for local dev/hackathon)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mounting API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/offices', officeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Feedback Endpoint
app.post('/api/feedback', (req, res) => {
  try {
    const { name, email, rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ error: 'Rating and comment are required' });
    }
    
    const feedback = db.getFeedback();
    const newFeedback = {
      id: Date.now().toString(),
      name: name || 'Anonymous',
      email: email || 'Not provided',
      rating: parseInt(rating),
      comment,
      createdAt: new Date()
    };
    
    feedback.push(newFeedback);
    db.saveFeedback(feedback);
    
    res.status(201).json({ message: 'Feedback submitted successfully', feedback: newFeedback });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Admin Analytics Dashboard Endpoint
app.get('/api/admin/analytics', (req, res) => {
  try {
    const users = db.getUsers();
    const schemes = db.getSchemes();
    const feedback = db.getFeedback();
    const analytics = db.getAnalytics();
    
    // Count stats
    const totalUsers = users.length;
    const totalSchemes = schemes.length;
    const totalFeedback = feedback.length;
    
    // Calculate average rating
    const avgRating = totalFeedback > 0 
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(1)
      : 'N/A';

    // Scheme popularity map
    const popularity = schemes.map(s => ({
      id: s.id,
      name: s.name,
      views: s.popularity || 0
    })).sort((a, b) => b.views - a.views);

    res.json({
      totalUsers,
      totalSchemes,
      totalFeedback,
      avgRating,
      chatMessages: analytics.chatMessages || 0,
      searches: analytics.searches || 0,
      schemePopularity: popularity,
      recentFeedback: feedback.slice(-5).reverse()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get analytics data' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Scheme Sathi Server running on port ${PORT} `);
  console.log(` API base: http://localhost:${PORT}/api        `);
  console.log(`===============================================`);
});
