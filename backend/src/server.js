require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import Supabase routes
const authRoutes = require('./routes/auth-supabase');
const roomRoutes = require('./routes/rooms-supabase');
const tenantRoutes = require('./routes/tenants-supabase');
const userRoutes = require('./routes/users-supabase');
const paymentRoutes = require('./routes/payments-supabase');
const clientRoutes = require('./routes/client-supabase');
const { supabase } = require('./supabase');

const app = express();

// Middlewarea
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174','https://quanlynhatrobatuat.netlify.app'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/client', clientRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('admins').select('id').limit(1);
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: error ? 'disconnected' : 'connected',
      type: 'supabase'
    });
  } catch (err) {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      type: 'supabase'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log('🗃️  Using Supabase as database');
});

module.exports = app;
