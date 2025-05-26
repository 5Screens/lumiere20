const addWatchers = async (req, res) => {
    try {
        logger.info(`[CONTROLLER] Processing POST /tickets/${req.params.uuid}/watchers request`);
        const ticketUuid = req.params.uuid;
        const { watch_list } = req.body;
        
        const result = await ticketService.addWatchers(ticketUuid, watch_list);
        res.status(201).json(result);
    } catch (error) {
        logger.error('[CONTROLLER] Error in addWatchers:', error);
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: 'Ticket not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

const removeWatcher = async (req, res) => {
    try {
        logger.info(`[CONTROLLER] Processing DELETE /tickets/${req.params.uuid}/watchers/${req.params.user_uuid} request`);
        const ticketUuid = req.params.uuid;
        const userUuid = req.params.user_uuid;
        
        const result = await ticketService.removeWatcher(ticketUuid, userUuid);
        
        if (!result.success && result.message === 'Watcher not found or already removed') {
            return res.status(404).json({ error: result.message });
        }
        
        res.json(result);
    } catch (error) {
        logger.error('[CONTROLLER] Error in removeWatcher:', error);
        if (error.message === 'Ticket not found') {
            res.status(404).json({ error: 'Ticket not found' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
