const logger = require('../../../../config/logger');
const llmClient = require('../utils/llm-client');
const { INTENTS } = require('../schemas/common');

const AGENT_TOOL_DATA_MAX_LENGTH = parseInt(process.env.AGENT_TOOL_DATA_MAX_LENGTH, 10) || 1500;

/**
 * Response Builder - Builds natural language responses for the user
 * Uses LLM to generate contextual, helpful responses
 */

const SYSTEM_PROMPT = `You are a helpful IT support assistant for an enterprise service desk.
Your role is to help users with IT-related requests in a friendly, professional manner.

CRITICAL GUIDELINES:
- ALWAYS use the CONVERSATION HISTORY to understand context. If the user refers to "my ticket", "this issue", or "the problem I mentioned", look at the history to understand what they mean.
- Use ONLY the data from tool results. NEVER invent ticket numbers, dates, or details.
- If a tool failed or returned no data, say so honestly - do not make up information.
- Be concise but helpful
- Use the user's language (French or English based on their message)
- If tools were executed successfully, summarize the ACTUAL results clearly
- If clarification is needed, ask specific questions
- Suggest relevant actions the user can take
- Format responses for readability (use bullet points for lists)

When suggesting actions, format them as a JSON array in your response metadata.`;

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

  try {
    // Handle simple intents without LLM
    const simpleResponse = handleSimpleIntent(intent, userContext);
    if (simpleResponse) {
      return simpleResponse;
    }

    // Build context for LLM
    const contextSummary = buildContextSummary(intent, toolResults, conversationContext);

    // Build messages for LLM
    const messages = [
      {
        role: 'user',
        content: `User message: "${userMessage}"

Context:
${contextSummary}

Generate a helpful response for the user. Include any relevant actions they can take.
Respond in the same language as the user's message.

Format your response as JSON:
{
  "message": "Your response to the user",
  "suggestedActions": [
    {"label": "Action label", "action": "action_code", "params": {}}
  ],
  "clarificationNeeded": false,
  "clarificationQuestion": null
}`
      }
    ];

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
    logger.info(`-- response-builder -- Built in ${executionTime}ms`);

    return {
      message: result.message || "I'm sorry, I couldn't generate a proper response.",
      suggestedActions: result.suggestedActions || [],
      clarificationNeeded: result.clarificationNeeded || false,
      clarificationQuestion: result.clarificationQuestion || null,
      executionTimeMs: executionTime
    };

  } catch (error) {
    logger.error(`-- response-builder -- Failed: ${error.message}`, { stack: error.stack });
    
    // Return fallback response
    return buildFallbackResponse(intent, toolResults, userContext);
  }
};

/**
 * Handle simple intents that don't need LLM
 * @param {Object} intent - Intent result
 * @param {Object} userContext - User context
 * @returns {Object|null} Response or null if LLM needed
 */
const handleSimpleIntent = (intent, userContext) => {
  const locale = userContext.locale || 'fr';
  const firstName = userContext.firstName || '';

  const responses = {
    [INTENTS.GREETING]: {
      fr: `Bonjour${firstName ? ` ${firstName}` : ''} ! Comment puis-je vous aider aujourd'hui ?`,
      en: `Hello${firstName ? ` ${firstName}` : ''}! How can I help you today?`
    },
    [INTENTS.THANKS]: {
      fr: "Je vous en prie ! N'hésitez pas si vous avez d'autres questions.",
      en: "You're welcome! Feel free to ask if you have any other questions."
    },
    [INTENTS.OUT_OF_SCOPE]: {
      fr: "Je suis un assistant IT. Je peux vous aider avec des questions liées à l'informatique, comme les problèmes techniques, les demandes d'accès, ou le suivi de vos tickets.",
      en: "I'm an IT assistant. I can help you with IT-related questions, such as technical issues, access requests, or tracking your tickets."
    }
  };

  const intentResponses = responses[intent.intent];
  if (intentResponses) {
    const message = intentResponses[locale] || intentResponses.en;
    return {
      message,
      suggestedActions: getSuggestedActionsForIntent(intent.intent),
      clarificationNeeded: false,
      clarificationQuestion: null,
      executionTimeMs: 0
    };
  }

  return null;
};

/**
 * Build context summary for LLM
 * @param {Object} intent - Intent result
 * @param {Object[]} toolResults - Tool results
 * @param {Object} conversationContext - Conversation context
 * @returns {string} Context summary
 */
const buildContextSummary = (intent, toolResults, conversationContext) => {
  const parts = [];

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

/**
 * Build fallback response when LLM fails
 * @param {Object} intent - Intent result
 * @param {Object[]} toolResults - Tool results
 * @param {Object} userContext - User context
 * @returns {Object} Fallback response
 */
const buildFallbackResponse = (intent, toolResults, userContext) => {
  const locale = userContext.locale || 'fr';
  
  // Check if any tools succeeded
  const successfulTools = toolResults?.filter(r => r.success) || [];
  
  let message;
  if (successfulTools.length > 0) {
    message = locale === 'fr'
      ? "J'ai traité votre demande. Voici ce que j'ai trouvé."
      : "I've processed your request. Here's what I found.";
  } else if (intent.needsClarification) {
    message = intent.clarificationQuestion || (locale === 'fr'
      ? "Pourriez-vous préciser votre demande ?"
      : "Could you please clarify your request?");
  } else {
    message = locale === 'fr'
      ? "Je suis désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer ou contacter le support."
      : "I'm sorry, I couldn't process your request. Please try again or contact support.";
  }

  return {
    message,
    suggestedActions: getSuggestedActionsForIntent(intent.intent),
    clarificationNeeded: intent.needsClarification || false,
    clarificationQuestion: intent.clarificationQuestion || null,
    executionTimeMs: 0
  };
};

/**
 * Get suggested actions for an intent
 * @param {string} intent - Intent code
 * @returns {Object[]} Suggested actions
 */
const getSuggestedActionsForIntent = (intent) => {
  const actionMap = {
    [INTENTS.GREETING]: [
      { label: 'Report an issue', action: 'report_incident', params: {} },
      { label: 'Track my tickets', action: 'list_tickets', params: {} },
      { label: 'Request access', action: 'request_access', params: {} }
    ],
    [INTENTS.SEARCH_SOLUTION]: [
      { label: 'Create a ticket', action: 'create_ticket', params: {} },
      { label: 'Search again', action: 'search', params: {} }
    ],
    [INTENTS.REPORT_INCIDENT]: [
      { label: 'Submit ticket', action: 'submit_ticket', params: {} },
      { label: 'Add more details', action: 'add_details', params: {} }
    ],
    [INTENTS.LIST_TICKETS]: [
      { label: 'Create new ticket', action: 'create_ticket', params: {} }
    ]
  };

  return actionMap[intent] || [];
};

module.exports = {
  build,
  handleSimpleIntent,
  buildContextSummary,
  buildFallbackResponse
};
