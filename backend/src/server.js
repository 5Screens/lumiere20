require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');
const { initializeWebSocket } = require('./api/v1/speech/websocket');

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

// Serve static files for portal images
const path = require('path');
app.use('/uploads/portals', express.static(path.join(__dirname, '../uploads/portals')));

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
const portalsRoutes = require('./api/v1/portals/routes');
const globalSearchRoutes = require('./api/v1/global-search/routes');
const ocrDocumentsRoutes = require('./api/v1/ocr_documents/routes');
const servicesRoutes = require('./api/v1/services/routes');
const serviceOfferingsRoutes = require('./api/v1/service_offerings/routes');
const causesRoutes = require('./api/v1/causes/routes');
const requestCatalogItemsRoutes = require('./api/v1/request_catalog_items/routes');
const slasRoutes = require('./api/v1/slas/routes');
const commitmentsRoutes = require('./api/v1/commitments/routes');
const calendarsRoutes = require('./api/v1/calendars/routes');
const timezonesRoutes = require('./api/v1/timezones/routes');
const holidaysRoutes = require('./api/v1/holidays/routes');

// Public routes (no authentication required)
app.use('/api/v1/auth', authRoutes);

// Protected routes (authentication required)
app.use('/api/v1/configuration_items', authenticate, configurationItemsRoutes);
app.use('/api/v1/entities', authenticate, entitiesRoutes);
app.use('/api/v1/locations', authenticate, locationsRoutes);
app.use('/api/v1/groups', authenticate, groupsRoutes);
app.use('/api/v1/persons', authenticate, personsRoutes);
app.use('/api/v1/metadata', authenticate, metadataRoutes);
app.use('/api/v1/ci_types', authenticate, ciTypesRoutes);
app.use('/api/v1/ci_type_fields', authenticate, ciTypeFieldsRoutes);
app.use('/api/v1/ci_categories', authenticate, ciCategoriesRoutes);
app.use('/api/v1/languages', authenticate, languagesRoutes);
app.use('/api/v1/audit', authenticate, auditRoutes);
app.use('/api/v1/workflow-status-categories', authenticate, workflowStatusCategoriesRoutes);
app.use('/api/v1/workflows', authenticate, workflowsRoutes);
app.use('/api/v1/workflow-entity-config', authenticate, workflowEntityConfigRoutes);
app.use('/api/v1/tasks', authenticate, tasksRoutes);
app.use('/api/v1/tickets', authenticate, ticketsRoutes);
app.use('/api/v1/ticket-types', authenticate, ticketTypesRoutes);
app.use('/api/v1/ticket_type_fields', authenticate, ticketTypeFieldsRoutes);
app.use('/api/v1/attachments', authenticate, attachmentsRoutes);
app.use('/api/v1/object-setup', authenticate, objectSetupRoutes);
app.use('/api/v1/object-types', authenticate, objectTypesRoutes);
app.use('/api/v1/symptoms', authenticate, symptomsRoutes);
app.use('/api/v1/agent', authenticate, agentRoutes);
app.use('/api/v1/portals', authenticate, portalsRoutes);
app.use('/api/v1/global-search', authenticate, globalSearchRoutes);
app.use('/api/v1/ocr-documents', authenticate, ocrDocumentsRoutes);
app.use('/api/v1/services', authenticate, servicesRoutes);
app.use('/api/v1/service-offerings', authenticate, serviceOfferingsRoutes);
app.use('/api/v1/causes', authenticate, causesRoutes);
app.use('/api/v1/request-catalog-items', authenticate, requestCatalogItemsRoutes);
app.use('/api/v1/slas', authenticate, slasRoutes);
app.use('/api/v1/commitments', authenticate, commitmentsRoutes);
app.use('/api/v1/calendars', authenticate, calendarsRoutes);
app.use('/api/v1/timezones', authenticate, timezonesRoutes);
app.use('/api/v1/holidays', authenticate, holidaysRoutes);

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

// Create HTTP server and attach WebSocket
const server = http.createServer(app);

// Initialize WebSocket for speech services (STT)
initializeWebSocket(server);

// Start server
server.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`WebSocket STT available at ws://localhost:${port}/api/v1/speech/stt`);
});
