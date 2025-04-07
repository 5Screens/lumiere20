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
const locationsRoutes = require('./api/v1/locations/routes');
const serviceOfferingsRoutes = require('./api/v1/service_offerings/routes');
const servicesRoutes = require('./api/v1/services/routes');
const auditChangesRoutes = require('./api/v1/audit_changes/routes');
const ticketTypesRoutes = require('./api/v1/ticket_types/routes');
const ticketStatusRoutes = require('./api/v1/ticket_status/routes');
const configurationItemsRoutes = require('./api/v1/configuration_items/routes');
const personsRoutes = require('./api/v1/persons/routes');
const ticketsRoutes = require('./api/v1/tickets/routes');
const groupsRoutes = require('./api/v1/groups/routes');
const contactTypesRoutes = require('./api/v1/contact_types/routes');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Augmentation de la taille des requêtes à 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
app.use('/api/v1/locations', locationsRoutes);
app.use('/api/v1/service_offerings', serviceOfferingsRoutes);
app.use('/api/v1/services', servicesRoutes);
app.use('/api/v1/audit_changes', auditChangesRoutes);
app.use('/api/v1/ticket_types', ticketTypesRoutes);
app.use('/api/v1/ticket_status', ticketStatusRoutes);
app.use('/api/v1/configuration_items', configurationItemsRoutes);
app.use('/api/v1/persons', personsRoutes);
app.use('/api/v1/tickets', ticketsRoutes);
app.use('/api/v1/groups', groupsRoutes);
app.use('/api/v1/contact_types', contactTypesRoutes);

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
