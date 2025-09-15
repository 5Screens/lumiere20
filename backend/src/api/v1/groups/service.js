const { pool } = require('../../../config/database');
const logger = require('../../../config/logger');

class GroupService {
    async getAllGroups() {
        logger.info('[SERVICE] getAllGroups - Starting database query');
        try {
            const query = `
                SELECT 
                    g.uuid, 
                    g.group_name, 
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
                    g.created_at,
                    g.updated_at,
                    COALESCE(
                        (SELECT COUNT(*) 
                         FROM configuration.rel_persons_groups rpg 
                         WHERE rpg.rel_group = g.uuid), 
                        0
                    ) as persons_count
                FROM configuration.groups g
                LEFT JOIN configuration.persons supervisor ON g.rel_supervisor = supervisor.uuid
                LEFT JOIN configuration.persons manager ON g.rel_manager = manager.uuid
                ORDER BY g.group_name ASC`;
            
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
                    g.group_name, 
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
                    g.created_at,
                    g.updated_at,
                    -- Informations sur les membres du groupe
                    (
                        SELECT json_agg(json_build_object(
                            'uuid', rpg.uuid,
                            'person_uuid', p.uuid,
                            'person_name', p.first_name || ' ' || p.last_name,
                            'created_at', rpg.created_at
                        ))
                        FROM configuration.rel_persons_groups rpg
                        JOIN configuration.persons p ON rpg.rel_member = p.uuid
                        WHERE rpg.rel_group = g.uuid
                    ) as persons_list
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
                group_name,
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
                    group_name,
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
                    group_name,
                    support_level,
                    description,
                    rel_supervisor,
                    rel_manager,
                    rel_schedule,
                    email,
                    phone,
                    created_at,
                    updated_at`;
            
            const values = [
                group_name,
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
                SET ${setClause}, updated_at = CURRENT_TIMESTAMP
                WHERE uuid = $${values.length}
                RETURNING 
                    uuid,
                    group_name,
                    support_level,
                    description,
                    rel_supervisor,
                    rel_manager,
                    rel_schedule,
                    email,
                    phone,
                    created_at,
                    updated_at`;
            
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
                    CONCAT(p.first_name, ' ', p.last_name) as person_name,
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

    async getAllGroupMembers() {
        logger.info('[SERVICE] getAllGroupMembers - Starting database query');
        try {
            const query = `
                WITH unique_members AS (
                    SELECT DISTINCT rel_member
                    FROM configuration.rel_persons_groups
                )
                SELECT 
                    p.uuid,
                    p.first_name,
                    p.last_name,
                    CONCAT(p.first_name, ' ', p.last_name) as person_name,
                    p.job_role,
                    p.email,
                    p.business_phone,
                    p.business_mobile_phone,
                    (
                        SELECT array_agg(json_build_object(
                            'group_uuid', g.uuid,
                            'group_name', g.group_name,
                            'member_since', rpg.created_at
                        ))
                        FROM configuration.rel_persons_groups rpg
                        JOIN configuration.groups g ON rpg.rel_group = g.uuid
                        WHERE rpg.rel_member = p.uuid
                    ) as groups
                FROM unique_members um
                JOIN configuration.persons p ON um.rel_member = p.uuid
                ORDER BY p.last_name, p.first_name`;
            
            const result = await pool.query(query);
            logger.info(`[SERVICE] getAllGroupMembers - Query executed successfully, found ${result.rows.length} members`);
            return result.rows;
        } catch (error) {
            logger.error(`[SERVICE] getAllGroupMembers - Error: ${error.message}`);
            throw error;
        }
    }

    async addGroupMember(groupUuid, userUuid) {
        logger.info(`[SERVICE] addGroupMember - Starting database operation for group: ${groupUuid}, user: ${userUuid}`);
        try {
            // Vérifier d'abord que l'utilisateur existe
            const userCheckQuery = `
                SELECT uuid, first_name, last_name 
                FROM configuration.persons 
                WHERE uuid = $1`;
            
            const userResult = await pool.query(userCheckQuery, [userUuid]);
            if (userResult.rows.length === 0) {
                const error = new Error('User not found');
                error.code = '23503'; // Simulate foreign key constraint violation
                throw error;
            }

            // Insérer la relation groupe-membre
            const insertQuery = `
                INSERT INTO configuration.rel_persons_groups (rel_group, rel_member)
                VALUES ($1, $2)
                RETURNING 
                    uuid,
                    rel_group,
                    rel_member,
                    created_at`;
            
            const result = await pool.query(insertQuery, [groupUuid, userUuid]);
            
            // Enrichir le résultat avec les informations de l'utilisateur
            const enrichedResult = {
                ...result.rows[0],
                user_name: `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`,
                user_first_name: userResult.rows[0].first_name,
                user_last_name: userResult.rows[0].last_name
            };
            
            logger.info(`[SERVICE] addGroupMember - Member added successfully: ${userUuid} to group ${groupUuid}`);
            return enrichedResult;
        } catch (error) {
            logger.error(`[SERVICE] addGroupMember - Error: ${error.message}`);
            throw error;
        }
    }

    async removeGroupMember(groupUuid, userUuid) {
        logger.info(`[SERVICE] removeGroupMember - Starting database operation for group: ${groupUuid}, user: ${userUuid}`);
        try {
            const deleteQuery = `
                DELETE FROM configuration.rel_persons_groups
                WHERE rel_group = $1 AND rel_member = $2
                RETURNING 
                    uuid,
                    rel_group,
                    rel_member,
                    created_at`;
            
            const result = await pool.query(deleteQuery, [groupUuid, userUuid]);
            
            if (result.rows.length === 0) {
                logger.warn(`[SERVICE] removeGroupMember - No relation found between group ${groupUuid} and user ${userUuid}`);
                return null;
            }
            
            logger.info(`[SERVICE] removeGroupMember - Member removed successfully: ${userUuid} from group ${groupUuid}`);
            return result.rows[0];
        } catch (error) {
            logger.error(`[SERVICE] removeGroupMember - Error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new GroupService();
