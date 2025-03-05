require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');

const app = express();
const port = process.env.PORT || 3000;

// Routes
const symptomsRoutes = require('./api/v1/symptoms/routes');
const entitiesRoutes = require('./api/v1/entities/routes');
const languagesRoutes = require('./api/v1/languages/routes');
const symptomsTranslationsRoutes = require('./api/v1/symptoms_translations/routes');
const entitiesTypesRoutes = require('./api/v1/entities_types/routes');

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api/v1/symptoms', symptomsRoutes);
app.use('/api/v1/entities', entitiesRoutes);
app.use('/api/v1/languages', languagesRoutes);
app.use('/api/v1/symptoms_translations', symptomsTranslationsRoutes);
app.use('/api/v1/entities_types', entitiesTypesRoutes);

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
