const express = require('express');
const router = express.Router();
const symptomsController = require('./controller');
const validate = require('../../../middleware/validate');
const symptomsValidation = require('./validation');

// Route pour obtenir tous les symptômes
//http://localhost:3000/api/v1/symptoms/
router.get(
    '/',
    symptomsController.getAllSymptoms
);

// Route pour obtenir les symptômes filtrés par langue
//http://localhost:3000/api/v1/symptoms/by-language?langue=fr
router.get(
    '/by-language',
    validate(symptomsValidation.getSymptoms),
    symptomsController.getSymptoms
);

router.put(
    '/',
    validate(symptomsValidation.createSymptom),
    symptomsController.createSymptom
);

module.exports = router;
