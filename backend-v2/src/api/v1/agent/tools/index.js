/**
 * Tools Registry
 * Defines all available tools for the agent with their schemas
 */

const ticketsTools = require('./tickets.tools');
const knowledgeTools = require('./knowledge.tools');

/**
 * Get all tool definitions for Mistral function calling
 * @returns {Array} Tool definitions in OpenAI format
 */
const getToolDefinitions = () => {
  return [
    // UC1: Tickets tools
    {
      type: 'function',
      function: {
        name: 'list_my_tickets',
        description: 'List the tickets of the current user. Returns ticket ID, title, status, type, and creation date.',
        parameters: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['open', 'closed', 'all'],
              description: 'Filter by ticket status. Default is "open".'
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of tickets to return. Default is 10.',
              minimum: 1,
              maximum: 50
            }
          },
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_ticket_details',
        description: 'Get detailed information about a specific ticket by its ID or UUID.',
        parameters: {
          type: 'object',
          properties: {
            ticket_id: {
              type: 'string',
              description: 'The ticket ID (e.g., "TKT-001") or UUID'
            }
          },
          required: ['ticket_id']
        }
      }
    },

    // UC2: Knowledge base tools
    {
      type: 'function',
      function: {
        name: 'search_knowledge_base',
        description: 'Search the knowledge base for articles matching a problem description or query. Use this when the user describes a problem they want to solve.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query or problem description'
            },
            limit: {
              type: 'integer',
              description: 'Maximum number of articles to return. Default is 5.',
              minimum: 1,
              maximum: 10
            }
          },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_article_content',
        description: 'Get the full content of a knowledge base article by its UUID.',
        parameters: {
          type: 'object',
          properties: {
            article_uuid: {
              type: 'string',
              description: 'The UUID of the knowledge article'
            }
          },
          required: ['article_uuid']
        }
      }
    },

    // UC3: Ticket creation tools
    {
      type: 'function',
      function: {
        name: 'get_ticket_types',
        description: 'Get the list of available ticket types (incident, service request, etc.).',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'create_ticket',
        description: 'Create a new ticket (incident or service request). Only call this after confirming with the user and collecting all required information (title, description, and optionally attachments).',
        parameters: {
          type: 'object',
          properties: {
            ticket_type: {
              type: 'string',
              description: 'The type of ticket (e.g., "INCIDENT", "SERVICE_REQUEST")'
            },
            title: {
              type: 'string',
              description: 'Short title describing the issue or request (max 255 characters)'
            },
            description: {
              type: 'string',
              description: 'Detailed description of the issue or request'
            },
            attachment_uuids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional array of attachment UUIDs to link to the ticket. These are files previously uploaded by the user.'
            }
          },
          required: ['ticket_type', 'title', 'description']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_pending_attachments',
        description: 'Get the list of attachments uploaded by the user in the current conversation that are not yet linked to a ticket. Use this before creating a ticket to check if the user has uploaded files.',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    }
  ];
};

/**
 * Execute a tool by name
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} args - Tool arguments
 * @param {Object} context - Execution context (userUuid, locale, etc.)
 * @returns {Object} Tool result
 */
const executeTool = async (toolName, args, context) => {
  const toolHandlers = {
    // UC1: Tickets
    list_my_tickets: ticketsTools.listMyTickets,
    get_ticket_details: ticketsTools.getTicketDetails,
    
    // UC2: Knowledge
    search_knowledge_base: knowledgeTools.searchKnowledgeBase,
    get_article_content: knowledgeTools.getArticleContent,
    
    // UC3: Ticket creation
    get_ticket_types: ticketsTools.getTicketTypes,
    create_ticket: ticketsTools.createTicket,
    get_pending_attachments: ticketsTools.getPendingAttachments
  };

  const handler = toolHandlers[toolName];
  
  if (!handler) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}`
    };
  }

  try {
    const result = await handler(args, context);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  getToolDefinitions,
  executeTool
};
