require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  // Give time to log before exit
  setTimeout(() => process.exit(1), 1000);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

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
const ciCategoriesRoutes = require('./api/v1/ci_categories/routes');
const languagesRoutes = require('./api/v1/languages/routes');
const auditRoutes = require('./api/v1/audit/routes');
const workflowStatusCategoriesRoutes = require('./api/v1/workflow_status_categories/routes');
const workflowsRoutes = require('./api/v1/workflows/routes');
const workflowEntityConfigRoutes = require('./api/v1/workflow_entity_config/routes');
const tasksRoutes = require('./api/v1/tasks/routes');
const ticketsRoutes = require('./api/v1/tickets/routes');
const ticketTypesRoutes = require('./api/v1/ticket_types/routes');
const ticketTypeFieldsRoutes = require('./api/v1/ticket_type_fields/routes');
const attachmentsRoutes = require('./api/v1/attachments/routes');
const objectSetupRoutes = require('./api/v1/object_setup/routes');
const objectTypesRoutes = require('./api/v1/object_types/routes');
const symptomsRoutes = require('./api/v1/symptoms/routes');
const agentRoutes = require('./api/v1/agent/routes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/configuration_items', configurationItemsRoutes);
app.use('/api/v1/entities', entitiesRoutes);
app.use('/api/v1/locations', locationsRoutes);
app.use('/api/v1/groups', groupsRoutes);
app.use('/api/v1/persons', personsRoutes);
app.use('/api/v1/metadata', metadataRoutes);
app.use('/api/v1/ci_types', ciTypesRoutes);
app.use('/api/v1/ci_type_fields', ciTypeFieldsRoutes);
app.use('/api/v1/ci_categories', ciCategoriesRoutes);
app.use('/api/v1/languages', languagesRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/workflow-status-categories', workflowStatusCategoriesRoutes);
app.use('/api/v1/workflows', workflowsRoutes);
app.use('/api/v1/workflow-entity-config', workflowEntityConfigRoutes);
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/tickets', ticketsRoutes);
app.use('/api/v1/ticket-types', ticketTypesRoutes);
app.use('/api/v1/ticket_type_fields', ticketTypeFieldsRoutes);
app.use('/api/v1/attachments', attachmentsRoutes);
app.use('/api/v1/object-setup', objectSetupRoutes);
app.use('/api/v1/object-types', objectTypesRoutes);
app.use('/api/v1/symptoms', symptomsRoutes);
app.use('/api/v1/agent', agentRoutes);

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
