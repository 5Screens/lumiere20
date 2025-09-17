const db = require('../../../config/database');
const logger = require('../../../config/logger');

/**
 * Get all persons from the database with additional statistics
 * @param {string} [lang] - Optional language parameter for localization
 * @returns {Promise<Array>} Array of persons with person_name field and statistics
 */
const getAllPersons = async (lang) => {
    try {
        logger.info('[SERVICE] - Getting all persons with statistics');
        const query = `
            SELECT p.*, 
                   p.first_name || ' ' || p.last_name AS person_name,
                   
                   -- Nombre de tickets enregistrés (requested_for_uuid)
                   (SELECT COUNT(*) 
                    FROM core.tickets t 
                    WHERE t.requested_for_uuid = p.uuid) AS raised_tickets_count,
                   
                   -- Nombre de groupes dont la personne est membre
                   (SELECT COUNT(*) 
                    FROM configuration.rel_persons_groups rpg 
                    WHERE rpg.rel_member = p.uuid) AS member_of_group_count,
                   
                   -- Nombre de tickets assignés à la personne
                   (SELECT COUNT(*) 
                    FROM core.rel_tickets_groups_persons rtgp 
                    WHERE rtgp.rel_assigned_to_person = p.uuid 
                      AND rtgp.type = 'ASSIGNED'
                      AND rtgp.ended_at IS NULL) AS assigned_tickets_count,
                   
                   -- Nombre de tickets observés par la personne
                   (SELECT COUNT(*) 
                    FROM core.rel_tickets_groups_persons rtgp 
                    WHERE rtgp.rel_assigned_to_person = p.uuid 
                      AND rtgp.type = 'WATCHER'
                      AND rtgp.ended_at IS NULL) AS watched_tickets_count,
                   
                   -- Nombre d'entités pour lesquelles la personne est approbateur budgétaire
                   (SELECT COUNT(*) 
                    FROM configuration.entities e 
                    WHERE e.budget_approver_uuid = p.uuid) AS budget_approver_count
                   
            FROM configuration.persons p
            ORDER BY p.last_name, p.first_name
            LIMIT 100
        `;
        const { rows } = await db.query(query);
        logger.info(`[SERVICE] - Retrieved ${rows.length} persons with statistics`);
        return rows;
    } catch (error) {
        logger.error('[SERVICE] - Error getting persons with statistics:', error);
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
            ORDER BY g.group_name
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
