require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// API Routes
const authRoutes = require('./api/v1/auth/routes');
const configurationItemsRoutes = require('./api/v1/configuration_items/routes');
const entitiesRoutes = require('./api/v1/entities/routes');
const locationsRoutes = require('./api/v1/locations/routes');
const groupsRoutes = require('./api/v1/groups/routes');
const personsRoutes = require('./api/v1/persons/routes');
const metadataRoutes = require('./api/v1/metadata/routes');
const ciTypesRoutes = require('./api/v1/ci_types/routes');
const ciTypeFieldsRoutes = require('./api/v1/ci_type_fields/routes');
const languagesRoutes = require('./api/v1/languages/routes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/configuration_items', configurationItemsRoutes);
app.use('/api/v1/entities', entitiesRoutes);
app.use('/api/v1/locations', locationsRoutes);
app.use('/api/v1/groups', groupsRoutes);
app.use('/api/v1/persons', personsRoutes);
app.use('/api/v1/metadata', metadataRoutes);
app.use('/api/v1/ci_types', ciTypesRoutes);
app.use('/api/v1/ci_type_fields', ciTypeFieldsRoutes);
app.use('/api/v1/languages', languagesRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lumiere API V2 is running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Health check under /api/v1 for frontend proxy
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
