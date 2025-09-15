const groupService = require('./service');
const logger = require('../../../config/logger');
const { validateGroup, validateGroupPatch, validateUuid, validateAddMultipleMembers } = require('./validation');

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

    async addMultipleMembersToGroup(req, res) {
        const groupUuid = req.params.group_uuid;
        logger.info(`[CONTROLLER] addMultipleMembersToGroup - Processing request for group: ${groupUuid}`);
        
        try {
            // Valider l'UUID du groupe
            const groupValidation = validateUuid(groupUuid, 'Group UUID');
            if (groupValidation.error) {
                logger.warn(`[CONTROLLER] addMultipleMembersToGroup - Invalid group UUID: ${groupUuid}`);
                return res.status(400).json({
                    error: 'Invalid group UUID format',
                    details: groupValidation.error.details.map(d => d.message)
                });
            }

            // Valider le body de la requête
            const bodyValidation = validateAddMultipleMembers(req.body);
            if (bodyValidation.error) {
                logger.warn(`[CONTROLLER] addMultipleMembersToGroup - Invalid request body`);
                return res.status(400).json({
                    error: 'Invalid request body',
                    details: bodyValidation.error.details.map(d => d.message)
                });
            }

            const { members } = bodyValidation.value;
            logger.info(`[CONTROLLER] addMultipleMembersToGroup - Adding ${members.length} members to group: ${groupUuid}`);

            // Vérifier que le groupe existe
            const group = await groupService.getGroupByUuid(groupUuid);
            if (!group) {
                logger.warn(`[CONTROLLER] addMultipleMembersToGroup - Group not found with UUID: ${groupUuid}`);
                return res.status(404).json({
                    error: 'Group not found'
                });
            }

            // Ajouter les membres au groupe
            const result = await groupService.addMultipleGroupMembers(groupUuid, members);
            logger.info(`[CONTROLLER] addMultipleMembersToGroup - ${result.added.length} members added successfully to group: ${groupUuid}`);
            
            return res.status(201).json({
                message: `${result.added.length} members added to group successfully`,
                data: {
                    added: result.added,
                    skipped: result.skipped,
                    errors: result.errors
                }
            });
        } catch (error) {
            logger.error(`[CONTROLLER] addMultipleMembersToGroup - Error: ${error.message}`);
            return res.status(500).json({
                error: 'An error occurred while adding members to group'
            });
        }
    }

    async addMemberToGroup(req, res) {
        const groupUuid = req.params.group_uuid;
        const userUuid = req.params.user_uuid;
        logger.info(`[CONTROLLER] addMemberToGroup - Processing request for group: ${groupUuid}, user: ${userUuid}`);
        
        try {
            // Valider les UUID des paramètres
            const groupValidation = validateUuid(groupUuid, 'Group UUID');
            if (groupValidation.error) {
                logger.warn(`[CONTROLLER] addMemberToGroup - Invalid group UUID: ${groupUuid}`);
                return res.status(400).json({
                    error: 'Invalid group UUID format',
                    details: groupValidation.error.details.map(d => d.message)
                });
            }

            const userValidation = validateUuid(userUuid, 'User UUID');
            if (userValidation.error) {
                logger.warn(`[CONTROLLER] addMemberToGroup - Invalid user UUID: ${userUuid}`);
                return res.status(400).json({
                    error: 'Invalid user UUID format',
                    details: userValidation.error.details.map(d => d.message)
                });
            }

            // Vérifier que le groupe existe
            const group = await groupService.getGroupByUuid(groupUuid);
            if (!group) {
                logger.warn(`[CONTROLLER] addMemberToGroup - Group not found with UUID: ${groupUuid}`);
                return res.status(404).json({
                    error: 'Group not found'
                });
            }

            // Ajouter le membre au groupe
            const result = await groupService.addGroupMember(groupUuid, userUuid);
            logger.info(`[CONTROLLER] addMemberToGroup - Member added successfully to group: ${groupUuid}`);
            
            return res.status(201).json({
                message: 'Member added to group successfully',
                data: result
            });
        } catch (error) {
            logger.error(`[CONTROLLER] addMemberToGroup - Error: ${error.message}`);
            
            if (error.code === '23505') { // PostgreSQL unique constraint violation
                return res.status(409).json({
                    error: 'User is already a member of this group'
                });
            }
            
            if (error.code === '23503') { // PostgreSQL foreign key constraint violation
                return res.status(404).json({
                    error: 'User not found'
                });
            }
            
            return res.status(500).json({
                error: 'An error occurred while adding member to group'
            });
        }
    }

    async removeMemberFromGroup(req, res) {
        const groupUuid = req.params.group_uuid;
        const userUuid = req.params.user_uuid;
        logger.info(`[CONTROLLER] removeMemberFromGroup - Processing request for group: ${groupUuid}, user: ${userUuid}`);
        
        try {
            // Valider les UUID des paramètres
            const groupValidation = validateUuid(groupUuid, 'Group UUID');
            if (groupValidation.error) {
                logger.warn(`[CONTROLLER] removeMemberFromGroup - Invalid group UUID: ${groupUuid}`);
                return res.status(400).json({
                    error: 'Invalid group UUID format',
                    details: groupValidation.error.details.map(d => d.message)
                });
            }

            const userValidation = validateUuid(userUuid, 'User UUID');
            if (userValidation.error) {
                logger.warn(`[CONTROLLER] removeMemberFromGroup - Invalid user UUID: ${userUuid}`);
                return res.status(400).json({
                    error: 'Invalid user UUID format',
                    details: userValidation.error.details.map(d => d.message)
                });
            }

            // Vérifier que le groupe existe
            const group = await groupService.getGroupByUuid(groupUuid);
            if (!group) {
                logger.warn(`[CONTROLLER] removeMemberFromGroup - Group not found with UUID: ${groupUuid}`);
                return res.status(404).json({
                    error: 'Group not found'
                });
            }

            // Supprimer le membre du groupe
            const result = await groupService.removeGroupMember(groupUuid, userUuid);
            
            if (!result) {
                logger.warn(`[CONTROLLER] removeMemberFromGroup - Member not found in group: ${groupUuid}`);
                return res.status(404).json({
                    error: 'Member not found in this group'
                });
            }
            
            logger.info(`[CONTROLLER] removeMemberFromGroup - Member removed successfully from group: ${groupUuid}`);
            
            return res.json({
                message: 'Member removed from group successfully'
            });
        } catch (error) {
            logger.error(`[CONTROLLER] removeMemberFromGroup - Error: ${error.message}`);
            return res.status(500).json({
                error: 'An error occurred while removing member from group'
            });
        }
    }
}

module.exports = new GroupController();
