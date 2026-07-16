require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Load ENV variables (Server restart triggered to sync new Cloudinary keys)
const dotenv = require('dotenv');
const http = require('http');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

// Connect to database
connectDB();

// Init Socket.io
initSocket(server);

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static directory for uploads (if local uploads fallback)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/listings', require('./routes/listingRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/match', require('./routes/matchRoutes'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
