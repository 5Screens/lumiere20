const express = require('express');
const router = express.Router();
const symptomsController = require('./controller');
const validate = require('../../../middleware/validate');
const symptomsValidation = require('./validation');

router.get(
    '/language/:langue',
    validate(symptomsValidation.getSymptoms),
    symptomsController.getSymptoms
);

router.get(
    '/',
    symptomsController.getAllSymptoms
);

router.put(
    '/',
    validate(symptomsValidation.createSymptom),
    symptomsController.createSymptom
);

module.exports = router;
