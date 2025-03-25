const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Get all persons from the database
 * @param {string} [lang] - Optional language parameter for localization
 * @returns {Promise<Array>} Array of persons
 */
const getAllPersons = async (lang) => {
    try {
        logger.info('Service - Getting all persons');
        const query = `
            SELECT *
            FROM configuration.persons
            ORDER BY last_name, first_name
        `;
        const { rows } = await db.query(query);
        logger.info(`Service - Retrieved ${rows.length} persons`);
        return rows;
    } catch (error) {
        logger.error('Service - Error getting persons:', error);
        throw error;
    }
};

module.exports = {
    getAllPersons
};
