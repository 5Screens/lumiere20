const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class GroupService {
    async getAllGroups() {
        logger.info('[SERVICE] getAllGroups - Starting database query');
        try {
            const query = `
                SELECT 
                    g.uuid, 
                    g.groupe_name, 
                    g.support_level,
                    g.description,
                    g.rel_supervisor,
                    CASE 
                        WHEN g.rel_supervisor IS NULL THEN NULL 
                        ELSE CONCAT(supervisor.first_name, ' ', supervisor.last_name) 
                    END as supervisor_name,
                    g.rel_manager,
                    CASE 
                        WHEN g.rel_manager IS NULL THEN NULL 
                        ELSE CONCAT(manager.first_name, ' ', manager.last_name) 
                    END as manager_name,
                    g.rel_schedule,
                    g.email,
                    g.phone,
                    g.date_creation,
                    g.date_modification
                FROM configuration.groups g
                LEFT JOIN configuration.persons supervisor ON g.rel_supervisor = supervisor.uuid
                LEFT JOIN configuration.persons manager ON g.rel_manager = manager.uuid
                ORDER BY g.groupe_name ASC`;
            
            const result = await pool.query(query);
            logger.info(`[SERVICE] getAllGroups - Query executed successfully, found ${result.rows.length} records`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getAllGroups - Database error: ${error.message}`);
            throw error;
        }
    }

    async getGroupByUuid(uuid) {
        logger.info(`[SERVICE] getGroupByUuid - Starting database query for UUID: ${uuid}`);
        try {
            const query = `
                SELECT 
                    g.uuid, 
                    g.groupe_name, 
                    g.support_level,
                    g.description,
                    g.rel_supervisor,
                    CASE 
                        WHEN g.rel_supervisor IS NULL THEN NULL 
                        ELSE CONCAT(supervisor.first_name, ' ', supervisor.last_name) 
                    END as supervisor_name,
                    g.rel_manager,
                    CASE 
                        WHEN g.rel_manager IS NULL THEN NULL 
                        ELSE CONCAT(manager.first_name, ' ', manager.last_name) 
                    END as manager_name,
                    g.rel_schedule,
                    g.email,
                    g.phone,
                    g.date_creation,
                    g.date_modification
                FROM configuration.groups g
                LEFT JOIN configuration.persons supervisor ON g.rel_supervisor = supervisor.uuid
                LEFT JOIN configuration.persons manager ON g.rel_manager = manager.uuid
                WHERE g.uuid = $1`;
            
            const result = await pool.query(query, [uuid]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] getGroupByUuid - Error: ${error.message}`);
            throw error;
        }
    }

    async createGroup(groupData) {
        logger.info('[SERVICE] createGroup - Starting database operation');
        try {
            const {
                groupe_name,
                support_level,
                description,
                rel_supervisor,
                rel_manager,
                rel_schedule,
                email,
                phone
            } = groupData;

            const query = `
                INSERT INTO configuration.groups (
                    groupe_name,
                    support_level,
                    description,
                    rel_supervisor,
                    rel_manager,
                    rel_schedule,
                    email,
                    phone
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING 
                    uuid,
                    groupe_name,
                    support_level,
                    description,
                    rel_supervisor,
                    rel_manager,
                    rel_schedule,
                    email,
                    phone,
                    date_creation,
                    date_modification`;
            
            const values = [
                groupe_name,
                support_level,
                description,
                rel_supervisor,
                rel_manager,
                rel_schedule,
                email,
                phone
            ];
            
            const result = await pool.query(query, values);
            logger.info(`[SERVICE] createGroup - Group created successfully with UUID: ${result.rows[0].uuid}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] createGroup - Error: ${error.message}`);
            throw error;
        }
    }

    async updateGroup(uuid, groupData) {
        logger.info(`[SERVICE] updateGroup - Starting database operation for UUID: ${uuid}`);
        try {
            // Construire la requête dynamiquement en fonction des champs fournis
            const fields = Object.keys(groupData);
            const values = Object.values(groupData);
            
            // Ajouter l'UUID à la fin des valeurs
            values.push(uuid);
            
            // Construire la partie SET de la requête
            const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            
            const query = `
                UPDATE configuration.groups
                SET ${setClause}, date_modification = CURRENT_TIMESTAMP
                WHERE uuid = $${values.length}
                RETURNING 
                    uuid,
                    groupe_name,
                    support_level,
                    description,
                    rel_supervisor,
                    rel_manager,
                    rel_schedule,
                    email,
                    phone,
                    date_creation,
                    date_modification`;
            
            const result = await pool.query(query, values);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            logger.info(`[SERVICE] updateGroup - Group updated successfully: ${uuid}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] updateGroup - Error: ${error.message}`);
            throw error;
        }
    }

    async getGroupMembers(groupUuid) {
        logger.info(`[SERVICE] getGroupMembers - Starting database query for group UUID: ${groupUuid}`);
        try {
            const query = `
                SELECT 
                    p.uuid,
                    p.first_name,
                    p.last_name,
                    p.job_role,
                    p.email,
                    p.business_phone,
                    p.business_mobile_phone,
                    rpg.created_at as member_since
                FROM configuration.rel_persons_groups rpg
                JOIN configuration.persons p ON rpg.rel_member = p.uuid
                WHERE rpg.rel_group = $1
                ORDER BY p.last_name, p.first_name`;
            
            const result = await pool.query(query, [groupUuid]);
            logger.info(`[SERVICE] getGroupMembers - Query executed successfully, found ${result.rows.length} members`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getGroupMembers - Error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new GroupService();
