const express = require('express');
const router = express.Router();
const symptomsController = require('./controller');
const validate = require('../../../middleware/validate');
const symptomsValidation = require('./validation');

router.get(
    '/',
    validate(symptomsValidation.getSymptoms),
    symptomsController.getSymptoms
);

module.exports = router;
