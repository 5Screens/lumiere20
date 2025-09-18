const express = require('express');
const router = express.Router();
const controller = require('./controller');
const validate = require('../../../middleware/validate');
const { getPersonsQuerySchema, personUuidParamSchema, updatePersonSchema, createPersonSchema, addPersonGroupsSchema, personGroupUuidParamSchema } = require('./validation');
const logger = require('../../../config/logger');

// Log middleware for this route
router.use((req, res, next) => {
    logger.info('Routes - Accessing persons routes');
    next();
});

// GET /api/v1/persons
router.get('/', 
    validate({ query: getPersonsQuerySchema }),
    controller.getPersons
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

module.exports = router;
