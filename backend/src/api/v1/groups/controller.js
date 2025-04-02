const groupService = require('./service');
const logger = require('../../../config/logger');
const { validateGroup, validateGroupPatch } = require('./validation');

class GroupController {
    async getAllGroups(req, res) {
        logger.info('[CONTROLLER] getAllGroups - Starting to process request');
        try {
            const lang = req.query.lang;
            if (lang) {
                logger.info(`[CONTROLLER] getAllGroups - Language parameter provided: ${lang}`);
            }
            
            const groups = await groupService.getAllGroups();
            logger.info(`[CONTROLLER] getAllGroups - Successfully retrieved ${groups.length} groups`);
            res.json(groups);
        } catch (error) {
            logger.error(`[CONTROLLER] getAllGroups - Error: ${error.message}`);
            res.status(500).json({ 
                error: 'An error occurred while retrieving groups' 
            });
        }
    }

    async getGroupByUuid(req, res) {
        const uuid = req.params.uuid;
        logger.info(`[CONTROLLER] getGroupByUuid - Processing request for UUID: ${uuid}`);
        try {
            const group = await groupService.getGroupByUuid(uuid);
            
            if (!group) {
                logger.warn(`[CONTROLLER] getGroupByUuid - Group not found with UUID: ${uuid}`);
                return res.status(404).json({
                    error: 'Group not found'
                });
            }
            
            logger.info(`[CONTROLLER] getGroupByUuid - Successfully retrieved group with UUID: ${uuid}`);
            return res.json(group);
        } catch (error) {
            logger.error(`[CONTROLLER] getGroupByUuid - Error: ${error.message}`);
            return res.status(500).json({
                error: 'Error while retrieving group'
            });
        }
    }

    async createGroup(req, res) {
        logger.info('[CONTROLLER] createGroup - Starting to process request');
        try {
            const groupData = req.body;
            logger.info('[CONTROLLER] createGroup - Validating group data');
            
            // Validate data
            const { error, value } = validateGroup(groupData);
            if (error) {
                logger.warn(`[CONTROLLER] createGroup - Validation failed: ${error.details.map(d => d.message).join(', ')}`);
                return res.status(400).json({
                    error: 'Invalid group data',
                    details: error.details.map(d => d.message)
                });
            }
            
            logger.info('[CONTROLLER] createGroup - Creating new group');
            const newGroup = await groupService.createGroup(value);
            
            logger.info(`[CONTROLLER] createGroup - Group created successfully with UUID: ${newGroup.uuid}`);
            return res.status(201).json(newGroup);
        } catch (error) {
            logger.error(`[CONTROLLER] createGroup - Error: ${error.message}`);
            
            if (error.code === '23505') { // PostgreSQL unique constraint violation code
                return res.status(409).json({
                    error: 'Group with this name already exists'
                });
            }
            
            return res.status(500).json({
                error: 'An error occurred while creating the group'
            });
        }
    }

    async updateGroupField(req, res) {
        const uuid = req.groupUuid;
        logger.info(`[CONTROLLER] updateGroupField - Processing request for UUID: ${uuid}`);

        try {
            // Validate the group exists
            const existingGroup = await groupService.getGroupByUuid(uuid);
            if (!existingGroup) {
                logger.warn(`[CONTROLLER] updateGroupField - Group not found with UUID: ${uuid}`);
                return res.status(404).json({
                    error: 'Group not found'
                });
            }

            // Validate update data
            const { error, value } = validateGroupPatch(req.body);
            if (error) {
                logger.warn(`[CONTROLLER] updateGroupField - Validation failed: ${error.details.map(d => d.message).join(', ')}`);
                return res.status(400).json({
                    error: 'Invalid update data',
                    details: error.details.map(d => d.message)
                });
            }

            // Update the group
            const updatedGroup = await groupService.updateGroup(uuid, value);
            logger.info(`[CONTROLLER] updateGroupField - Group updated successfully: ${uuid}`);
            
            return res.json(updatedGroup);
        } catch (error) {
            logger.error(`[CONTROLLER] updateGroupField - Error: ${error.message}`);
            return res.status(500).json({
                error: 'An error occurred while updating the group'
            });
        }
    }

    async getGroupMembers(req, res) {
        const uuid = req.params.uuid;
        logger.info(`[CONTROLLER] getGroupMembers - Processing request for group UUID: ${uuid}`);
        try {
            // Vérifier d'abord que le groupe existe
            const group = await groupService.getGroupByUuid(uuid);
            if (!group) {
                logger.warn(`[CONTROLLER] getGroupMembers - Group not found with UUID: ${uuid}`);
                return res.status(404).json({
                    error: 'Group not found'
                });
            }
            
            const members = await groupService.getGroupMembers(uuid);
            logger.info(`[CONTROLLER] getGroupMembers - Successfully retrieved ${members.length} members for group: ${uuid}`);
            return res.json(members);
        } catch (error) {
            logger.error(`[CONTROLLER] getGroupMembers - Error: ${error.message}`);
            return res.status(500).json({
                error: 'Error while retrieving group members'
            });
        }
    }

    async getAllGroupMembers(req, res) {
        logger.info('[CONTROLLER] getAllGroupMembers - Starting to process request');
        try {
            const members = await groupService.getAllGroupMembers();
            logger.info(`[CONTROLLER] getAllGroupMembers - Successfully retrieved ${members.length} members`);
            res.json(members);
        } catch (error) {
            logger.error(`[CONTROLLER] getAllGroupMembers - Error: ${error.message}`);
            res.status(500).json({ 
                error: 'An error occurred while retrieving group members' 
            });
        }
    }
}

module.exports = new GroupController();
