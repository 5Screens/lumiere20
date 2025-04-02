const db = require('../../../config/database');
const logger = require('../../../config/logger');

const getTickets = async (lang) => {
    logger.info(`[SERVICE] Fetching all tickets${lang ? ` with language ${lang}` : ''}`);
    
    const query = `
        SELECT 
            t.*,
            p1.first_name || ' ' || p1.last_name as requested_by_name,
            p2.first_name || ' ' || p2.last_name as requested_for_name,
            p3.first_name || ' ' || p3.last_name as writer_name,
            COALESCE(ttt.label, tt.code) as ticket_type_label,
            COALESCE(tst.label, ts.code) as ticket_status_label,
            tt.code as ticket_type_code,
            ts.code as ticket_status_code
        FROM core.tickets t
        JOIN configuration.persons p1 ON t.requested_by_uuid = p1.uuid
        JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
        JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
        JOIN configuration.ticket_types tt ON t.ticket_type_code = tt.code
        JOIN configuration.ticket_status ts ON t.ticket_status_code = ts.code
        LEFT JOIN translations.ticket_types_translation ttt ON tt.uuid = ttt.ticket_type_uuid 
            AND ttt.lang = $1
        LEFT JOIN translations.ticket_status_translation tst ON ts.uuid = tst.ticket_status_uuid 
            AND tst.lang = $1
        ORDER BY t.created_at DESC
    `;
    
    try {
        const result = await db.query(query, [lang || 'en']);
        return result.rows;
    } catch (error) {
        logger.error('[SERVICE] Error fetching tickets:', error);
        throw error;
    }
};

const createTicket = async (ticketData) => {
    logger.info('[SERVICE] Creating new ticket');
    
    // Start a transaction
    const client = await db.getClient();
    
    try {
        await client.query('BEGIN');
        
        // 1. Create the ticket
        const ticketQuery = `
            INSERT INTO core.tickets (
                title,
                description,
                requested_by_uuid,
                requested_for_uuid,
                writer_uuid,
                ticket_type_code,
                ticket_status_code,
                core_extended_attributes,
                user_extended_attributes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

        const ticketResult = await client.query(ticketQuery, [
            ticketData.titre,
            ticketData.description,
            ticketData.requested_by_uuid,
            ticketData.requested_for_uuid,
            ticketData.writer_uuid,
            ticketData.ticket_type_code,
            ticketData.ticket_status_code,
            ticketData.core_extended_attributes || null,
            ticketData.user_extended_attributes || null
        ]);

        const createdTicket = ticketResult.rows[0];
        
        // 2. Handle assignment if provided
        if (ticketData.assigned_to_group) {
            logger.info('[SERVICE] Processing ticket assignment');
            
            const assignmentQuery = `
                INSERT INTO core.rel_tickets_groups_persons (
                    rel_ticket,
                    rel_assigned_to_group,
                    rel_assigned_to_person,
                    type
                ) VALUES ($1, $2, $3, 'ASSIGNED')
            `;
            
            await client.query(assignmentQuery, [
                createdTicket.uuid,
                ticketData.assigned_to_group,
                ticketData.assigned_to_person || null
            ]);
        }
        
        // 3. Handle watchers if provided
        if (ticketData.watch_list && Array.isArray(ticketData.watch_list) && ticketData.watch_list.length > 0) {
            logger.info(`[SERVICE] Processing ${ticketData.watch_list.length} ticket watchers`);
            
            // Prepare batch insert for watchers
            const watcherValues = ticketData.watch_list.map((personUuid, index) => {
                return `($1, NULL, $${index + 2}, 'WATCHER')`;
            }).join(', ');
            
            const watcherQuery = `
                INSERT INTO core.rel_tickets_groups_persons (
                    rel_ticket,
                    rel_assigned_to_group,
                    rel_assigned_to_person,
                    type
                ) VALUES ${watcherValues}
            `;
            
            const watcherParams = [createdTicket.uuid, ...ticketData.watch_list];
            await client.query(watcherQuery, watcherParams);
        }
        
        await client.query('COMMIT');
        return createdTicket;
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('[SERVICE] Error creating ticket:', error);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getTickets,
    createTicket
};
