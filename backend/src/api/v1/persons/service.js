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
            LIMIT 100
        `;
        const { rows } = await db.query(query);
        logger.info(`Service - Retrieved ${rows.length} persons`);
        return rows;
    } catch (error) {
        logger.error('Service - Error getting persons:', error);
        throw error;
    }
};

/**
 * Get all groups for a specific person
 * @param {string} personUuid - UUID of the person
 * @returns {Promise<Array>} Array of groups the person belongs to
 */
const getPersonGroups = async (personUuid) => {
    try {
        logger.info(`Service - Getting groups for person with UUID: ${personUuid}`);
        const query = `
            SELECT g.*
            FROM configuration.groups g
            JOIN configuration.rel_persons_groups rpg ON g.uuid = rpg.rel_group
            WHERE rpg.rel_member = $1
            ORDER BY g.groupe_name
        `;
        const { rows } = await db.query(query, [personUuid]);
        logger.info(`Service - Retrieved ${rows.length} groups for person with UUID: ${personUuid}`);
        return rows;
    } catch (error) {
        logger.error(`Service - Error getting groups for person with UUID: ${personUuid}:`, error);
        throw error;
    }
};

module.exports = {
    getAllPersons,
    getPersonGroups
};
