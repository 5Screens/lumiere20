const logger = require('../../../../config/logger');
const llmClient = require('../utils/llm-client');

const AGENT_TOOL_DATA_MAX_LENGTH = parseInt(process.env.AGENT_TOOL_DATA_MAX_LENGTH, 10) || 1500;

/**
 * Response Builder - Builds natural language responses for the user
 * Uses LLM to generate ALL responses dynamically - no hardcoded messages
 */

const AVAILABLE_ACTIONS = [
  { action: 'report_incident', description: 'Report a new IT incident or problem' },
  { action: 'list_tickets', description: 'View user\'s open tickets' },
  { action: 'request_access', description: 'Request access to an application or system' },
  { action: 'create_ticket', description: 'Create a new support ticket' },
  { action: 'search', description: 'Search for solutions or articles' },
  { action: 'submit_ticket', description: 'Submit the current ticket draft' },
  { action: 'add_details', description: 'Add more details to the current request' },
  { action: 'track_ticket', description: 'Track a specific ticket by number' },
  { action: 'browse_catalog', description: 'Browse available IT services' }
];

const SYSTEM_PROMPT = `You are a helpful IT support assistant for an enterprise service desk.
Your role is to help users with IT-related requests in a friendly, professional manner.

CRITICAL GUIDELINES:
- ALWAYS respond in the SAME LANGUAGE as the user's message. If they write in Italian, respond in Italian. If they write in Portuguese, respond in Portuguese. Etc.
- ALWAYS use the CONVERSATION HISTORY to understand context. If the user refers to "my ticket", "this issue", or "the problem I mentioned", look at the history to understand what they mean.
- Use ONLY the data from tool results. NEVER invent ticket numbers, dates, or details.
- If a tool failed or returned no data, say so honestly - do not make up information.
- Be concise but helpful
- If tools were executed successfully, summarize the ACTUAL results clearly
- If clarification is needed, ask specific questions IN THE USER'S LANGUAGE
- Suggest relevant actions the user can take (labels must be in the user's language)
- Format responses for readability (use bullet points for lists)
- DO NOT start every response with a greeting like "Bonjour" or "Hello". Only greet the user if they greeted you first (intent is "greeting"). For all other messages, respond directly to their request without a greeting.
- For thanks, acknowledge politely but briefly
- For out-of-scope requests, politely explain you are an IT assistant

AVAILABLE ACTIONS you can suggest (use these action codes, but translate the labels to the user's language):
${AVAILABLE_ACTIONS.map(a => `- ${a.action}: ${a.description}`).join('\n')}`;

/**
 * Build a response based on intent and tool results
 * @param {Object} params - Response parameters
 * @param {string} params.userMessage - Original user message
 * @param {Object} params.intent - Intent analysis result
 * @param {Object[]} params.toolResults - Results from executed tools
 * @param {Object} params.conversationContext - Conversation context
 * @param {Object} params.userContext - User context
 * @returns {Object} Response object
 */
const build = async (params) => {
  const { userMessage, intent, toolResults, conversationContext, userContext } = params;
  const startTime = Date.now();

  logger.info(`-- response-builder -- build`);
  logger.info(`  INPUT: intent=${intent?.intent}, toolResultsCount=${toolResults?.length || 0}`);

  try {
    // Build context for LLM
    const contextSummary = buildContextSummary(intent, toolResults, conversationContext, userContext);

    // Build messages for LLM
    const userContent = `User message: "${userMessage}"

Context:
${contextSummary}

Generate a helpful response for the user. Include any relevant actions they can take.
IMPORTANT: Respond in the SAME LANGUAGE as the user's message.

Format your response as JSON:
{
  "message": "Your response to the user (in the user's language)",
  "suggestedActions": [
    {"label": "Action label (translated to user's language)", "action": "action_code", "params": {}}
  ],
  "clarificationNeeded": false,
  "clarificationQuestion": null
}`;

    const messages = [
      {
        role: 'user',
        content: userContent
      }
    ];

    // Log the full message being sent to LLM
    logger.info(`-- response-builder -- LLM REQUEST:`);
    logger.info(`  SYSTEM_PROMPT (${SYSTEM_PROMPT.length} chars): ${SYSTEM_PROMPT.substring(0, 200)}...`);
    logger.info(`  USER_MESSAGE (${userContent.length} chars):\n${userContent}`);

    // Call LLM
    const response = await llmClient.chatCompletion({
      systemPrompt: SYSTEM_PROMPT,
      messages,
      options: {
        temperature: 0.7,
        maxTokens: 1000
      }
    });

    // Parse response
    const result = llmClient.parseJsonResponse(response.content);

    const executionTime = Date.now() - startTime;
    logger.info(`  OUTPUT: messageLength=${result.message?.length || 0}, suggestedActionsCount=${result.suggestedActions?.length || 0}, executionTimeMs=${executionTime}`);

    return {
      message: result.message || "I'm sorry, I couldn't generate a proper response.",
      suggestedActions: validateSuggestedActions(result.suggestedActions),
      clarificationNeeded: result.clarificationNeeded || false,
      clarificationQuestion: result.clarificationQuestion || null,
      executionTimeMs: executionTime
    };

  } catch (error) {
    logger.error(`-- response-builder -- Failed: ${error.message}`, { stack: error.stack });
    
    // Return minimal error response - no hardcoded messages
    return {
      message: error.message || 'An error occurred',
      suggestedActions: [],
      clarificationNeeded: false,
      clarificationQuestion: null,
      executionTimeMs: Date.now() - startTime,
      error: true
    };
  }
};

/**
 * Validate and filter suggested actions to only include known action codes
 * @param {Object[]} actions - Actions from LLM
 * @returns {Object[]} Validated actions
 */
const validateSuggestedActions = (actions) => {
  if (!Array.isArray(actions)) return [];
  
  const validActionCodes = AVAILABLE_ACTIONS.map(a => a.action);
  
  return actions.filter(action => {
    if (!action || typeof action !== 'object') return false;
    if (!action.action || !action.label) return false;
    return validActionCodes.includes(action.action);
  }).map(action => ({
    label: action.label,
    action: action.action,
    params: action.params || {}
  }));
};

/**
 * Build context summary for LLM
 * @param {Object} intent - Intent result
 * @param {Object[]} toolResults - Tool results
 * @param {Object} conversationContext - Conversation context
 * @param {Object} userContext - User context
 * @returns {string} Context summary
 */
const buildContextSummary = (intent, toolResults, conversationContext, userContext) => {
  const parts = [];

  // User info for personalization
  if (userContext?.firstName) {
    parts.push(`User name: ${userContext.firstName}`);
  }

  // Conversation history (critical for context)
  const messages = conversationContext?.messages || [];
  if (messages.length > 1) {
    parts.push('=== CONVERSATION HISTORY ===');
    // Get last 10 messages (excluding the current one which is last)
    const historyMessages = messages.slice(-11, -1);
    for (const msg of historyMessages) {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      const content = msg.content?.substring(0, 300) || '';
      parts.push(`${role}: ${content}${msg.content?.length > 300 ? '...' : ''}`);
    }
    parts.push('=== END HISTORY ===\n');
  }

  // Intent info
  parts.push(`Detected intent: ${intent.intent} (confidence: ${(intent.confidence * 100).toFixed(0)}%)`);

  if (intent.entities && Object.keys(intent.entities).length > 0) {
    parts.push(`Extracted entities: ${JSON.stringify(intent.entities)}`);
  }

  // Tool results
  if (toolResults && toolResults.length > 0) {
    parts.push('\nTool execution results:');
    for (const result of toolResults) {
      if (result.success) {
        parts.push(`- ${result.tool}: SUCCESS`);
        if (result.data) {
          // More generous data limit for better context
          parts.push(`  Data: ${JSON.stringify(result.data).substring(0, AGENT_TOOL_DATA_MAX_LENGTH)}`);
        }
      } else {
        parts.push(`- ${result.tool}: FAILED - ${result.error}`);
      }
    }
  } else {
    parts.push('\nNo tools were executed.');
  }

  // Conversation state
  if (conversationContext?.state?.pendingAction) {
    parts.push(`\nPending action: ${conversationContext.state.pendingAction}`);
  }

  return parts.join('\n');
};

module.exports = {
  build,
  buildContextSummary,
  AVAILABLE_ACTIONS
};
