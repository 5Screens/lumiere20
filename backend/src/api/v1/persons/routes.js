const express = require('express');
const router = express.Router();
const controller = require('./controller');
const validate = require('../../../middleware/validate');
const { getPersonsQuerySchema, getPersonsPaginatedQuerySchema, personUuidParamSchema, updatePersonSchema, createPersonSchema, addPersonGroupsSchema, personGroupUuidParamSchema, addApproverEntitiesSchema, personEntityUuidParamSchema, searchPersonsSchema, columnNameParamSchema, searchQuerySchema } = require('./validation');
const logger = require('../../../config/logger');

// Log middleware for this route
router.use((req, res, next) => {
    logger.info('Routes - Accessing persons routes');
    next();
});

// GET /api/v1/persons - Now always paginated
router.get('/', 
    validate({ query: getPersonsPaginatedQuerySchema }),
    controller.getPersonsPaginated
);

// GET /api/v1/persons/:uuid
router.get('/:uuid',
    validate({ params: personUuidParamSchema, query: getPersonsQuerySchema }),
    controller.getPersonByUuid
);

// PATCH /api/v1/persons/:uuid
router.patch('/:uuid',
    validate({ params: personUuidParamSchema, body: updatePersonSchema }),
    controller.updatePerson
);

// POST /api/v1/persons
router.post('/',
    validate({ body: createPersonSchema }),
    controller.createPerson
);

// GET /api/v1/persons/:uuid/groups
router.get('/:uuid/groups',
    validate({ params: personUuidParamSchema }),
    controller.getPersonGroups
);

// POST /api/v1/persons/:uuid/groups
router.post('/:uuid/groups',
    validate({ params: personUuidParamSchema, body: addPersonGroupsSchema }),
    controller.addPersonGroups
);

// DELETE /api/v1/persons/:uuid/groups/:group_uuid
router.delete('/:uuid/groups/:group_uuid',
    validate({ params: personGroupUuidParamSchema }),
    controller.removePersonGroup
);

// POST /api/v1/persons/:uuid/approver-entities
router.post('/:uuid/approver-entities',
    validate({ params: personUuidParamSchema, body: addApproverEntitiesSchema }),
    controller.addApproverEntities
);

// DELETE /api/v1/persons/:uuid/approver-entities/:entity_uuid
router.delete('/:uuid/approver-entities/:entity_uuid',
    validate({ params: personEntityUuidParamSchema }),
    controller.removeApproverEntity
);

// POST /api/v1/persons/search - Search persons with filters
router.post('/search',
    validate({ body: searchPersonsSchema }),
    controller.searchPersons
);

// GET /api/v1/persons/filters/:columnName - Get filter values for a specific column
router.get('/filters/:columnName',
    validate({ 
        params: columnNameParamSchema,
        query: searchQuerySchema 
    }),
    controller.getPersonsFilterValues
);

module.exports = router;
