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
            ci.nom as configuration_item_name,
            COALESCE(ttt.label, tt.code) as ticket_type_label,
            COALESCE(tst.label, ts.code) as ticket_status_label,
            tt.code as ticket_type_code,
            ts.code as ticket_status_code
        FROM core.tickets t
        JOIN configuration.persons p1 ON t.requested_by_uuid = p1.uuid
        JOIN configuration.persons p2 ON t.requested_for_uuid = p2.uuid
        JOIN configuration.persons p3 ON t.writer_uuid = p3.uuid
        JOIN data.configuration_items ci ON t.configuration_item_uuid = ci.uuid
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
    
    const query = `
        INSERT INTO core.tickets (
            title,
            description,
            configuration_item_uuid,
            requested_by_uuid,
            requested_for_uuid,
            writer_uuid,
            ticket_type_code,
            ticket_status_code,
            core_extended_attributes,
            user_extended_attributes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
    `;

    try {
        const result = await db.query(query, [
            ticketData.titre,
            ticketData.description,
            ticketData.configuration_item_uuid,
            ticketData.requested_by_uuid,
            ticketData.requested_for_uuid,
            ticketData.writer_uuid,
            ticketData.ticket_type_uuid,
            ticketData.ticket_status_uuid,
            ticketData.core_extended_attributes || null,
            ticketData.user_extended_attributes || null
        ]);

        return result.rows[0];
    } catch (error) {
        logger.error('[SERVICE] Error creating ticket:', error);
        throw error;
    }
};

module.exports = {
    getTickets,
    createTicket
};
