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
        description: `List the tickets of the current user. Returns ticket UUID, title, status, type, and dates.

TRIGGER PHRASES (use this tool when user says):
- "show me my tickets", "mes tickets", "my requests", "mes demandes"
- "what are my open tickets?", "do I have pending tickets?"
- "where are my requests?", "status of my tickets"
- "list my incidents", "show my service requests"`,
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
        description: `Get detailed information about a specific ticket by its UUID.

TRIGGER PHRASES (use this tool when user says):
- "show me ticket [uuid]", "details of ticket [uuid]"
- "what's the status of [uuid]?", "tell me about this ticket"
- When user provides a UUID and wants more info about it`,
        parameters: {
          type: 'object',
          properties: {
            ticket_id: {
              type: 'string',
              description: 'The ticket UUID'
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
        description: `Search the knowledge base for articles matching a problem description or query.

TRIGGER PHRASES (use this tool when user says):
- "how do I...", "comment faire pour...", "how to..."
- "I have a problem with...", "j'ai un problème avec..."
- "my [X] is not working", "mon [X] ne marche pas"
- "is there documentation about...", "do you have info on..."
- Any technical question or problem description BEFORE suggesting to create a ticket`,
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
        description: `Get the full content of a knowledge base article by its UUID.

Use this when:
- User wants more details about an article from search results
- User clicks on or references a specific article UUID`,
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
        description: 'Get the list of available ticket types. Internal use only - do not expose type choice to user.',
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
        description: `Create a new ticket. Only call this after:
1. Collecting title and description from user
2. Checking for pending attachments
3. Getting explicit user confirmation

IMPORTANT: Detect ticket_type automatically from context:
- INCIDENT: user reports something broken, not working, error, malfunction
- SERVICE_REQUEST: user asks for something new (access, equipment, account)
Never ask the user which type - detect it silently.`,
        parameters: {
          type: 'object',
          properties: {
            ticket_type: {
              type: 'string',
              description: 'INCIDENT or SERVICE_REQUEST - detected from user context, never asked'
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
              description: 'Array of attachment UUIDs from get_pending_attachments'
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
        description: `Get attachments uploaded by the user in this conversation that are not yet linked to a ticket.

WHEN TO USE:
- At step 4 of ticket creation: check if user already uploaded files
- Before showing ticket summary: get final attachment count and UUIDs
- When user mentions they uploaded a file`,
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
