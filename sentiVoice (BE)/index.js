require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const config = require('./config');
const routes = require('./routes');
const mainController = require('./controllers/mainController');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require("./routes/paymentRoutes");

// Environment validation
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS || !process.env.FRONTEND_URL) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// JWT secret validation
if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET not set. Using default secret. Change this in production!');
}

// Set default environment
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// ✅ Import HTTP and Socket.IO
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app); // 👈 wrap express with HTTP server
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://your-app-name.netlify.app",
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true
  }
});

const port = config.port;

// Database connection
mongoose.connect(config.dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection error:', err));

// Security middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Skip successful requests to reduce noise
  skipFailedRequests: false
});

// Apply rate limiting only to specific endpoints that need protection
app.use('/api/admin/', limiter);
app.use('/api/payments/', limiter);
app.use('/api/auth/', limiter);

// CORS configuration - More permissive for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL,
      'https://sentivoice.netlify.app',
      'https://sentivoice.netlify.app/'
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use("/uploads", express.static("uploads"));

// Handle preflight requests
app.options('*', cors());

// Production logging (only log errors)
app.use((req, res, next) => {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.url}`);
  }
  next();
});

// Routes
app.get('/', mainController.home);
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});
app.use('/api', routes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// ✅ Socket.IO setup
io.on('connection', (socket) => {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🟢 User connected:', socket.id);
  }

  // Join a room for a specific appointment
  socket.on('join_appointment', (appointmentId) => {
    socket.join(appointmentId);
    if (process.env.NODE_ENV === 'development') {
      console.log(`User ${socket.id} joined appointment room: ${appointmentId}`);
    }
  });

  // Leave a room
  socket.on('leave_appointment', (appointmentId) => {
    socket.leave(appointmentId);
    if (process.env.NODE_ENV === 'development') {
      console.log(`User ${socket.id} left appointment room: ${appointmentId}`);
    }
  });

  socket.on('send_message', (message) => {
    try {
      // Validate message structure
      if (!message.appointmentId || !message.content || !message.senderUsername) {
        console.error('Invalid message structure:', message);
        return;
      }

      // Log the message being sent
      console.log('📤 Message received from socket:', {
        appointmentId: message.appointmentId,
        sender: message.senderUsername,
        content: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
        timestamp: message.timestamp,
        messageType: message.messageType,
        hasAttachment: !!message.attachment,
        attachmentDetails: message.attachment
      });

      // Get the room size to see how many users are in the appointment
      const room = io.sockets.adapter.rooms.get(message.appointmentId);
      const roomSize = room ? room.size : 0;
      console.log(`👥 Users in room ${message.appointmentId}: ${roomSize}`);

      // Emit to all users in the appointment room (including sender for confirmation)
      io.to(message.appointmentId).emit('receive_message', {
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      });

      console.log(`✅ Message emitted to room ${message.appointmentId}`);
    } catch (error) {
      console.error('Error handling send_message:', error);
    }
  });

  socket.on('typing', (data) => {
    if (data.appointmentId) {
      socket.to(data.appointmentId).emit('typing', data);
    }
  });

  socket.on('stop_typing', (data) => {
    if (data.appointmentId) {
      socket.to(data.appointmentId).emit('stop_typing', data);
    }
  });

  socket.on('disconnect', () => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔴 User disconnected:', socket.id);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log error in development only
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  }
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Only one file allowed.' });
    }
    return res.status(400).json({ error: 'File upload error.' });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.message });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  // Handle specific error messages
  if (err.message === 'Only audio files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  
  // Default error response
  res.status(500).json({ error: 'Internal server error' });
});

// Add this at the very end of the file, after all routes and middleware
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Replace app.listen with server.listen
server.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});