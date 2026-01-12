const logger = require('../../../../config/logger');
const llmClient = require('../utils/llm-client');
const { INTENTS, INTENT_TOOL_MAPPING } = require('../schemas/common');

/**
 * Intent Analyzer - Analyzes user messages to detect intent
 * Uses LLM to understand user intention and extract entities
 */

const SYSTEM_PROMPT = `You are an intent analyzer for an IT Service Management (ITSM) portal assistant.
Your task is to analyze user messages and determine their intent.

IMPORTANT: Consider the conversation history when analyzing intent. If the user refers to something mentioned earlier (like "this ticket", "my request", "the issue I mentioned"), use the context to understand what they mean.

Available intents:
- search_solution: User wants to find a solution to a problem (e.g., "My screen is black", "Outlook doesn't work")
- search_article: User wants to find a specific KB article (e.g., "Where is the VPN doc?")
- password_reset: User wants to reset a password (e.g., "I forgot my password")
- account_unlock: User wants to unlock an account (e.g., "My account is locked")
- request_access: User wants to request access to an application (e.g., "I need access to Salesforce")
- check_access: User wants to check their current access rights
- report_incident: User wants to report an incident (e.g., "Something is broken", "Error 500")
- check_known_incident: User wants to check if there's a known incident (e.g., "Is Teams down?")
- request_service: User wants to request a service (e.g., "I need a new laptop")
- browse_catalog: User wants to browse available services
- track_ticket: User wants to track a specific ticket (e.g., "Status of ticket 12345")
- list_tickets: User wants to see their tickets (e.g., "My open requests")
- update_ticket: User wants to add info to a ticket
- get_announcements: User wants to see announcements
- get_active_incidents: User wants to see current incidents
- view_profile: User wants to see their profile
- update_preferences: User wants to change preferences
- view_team: Manager wants to see their team
- view_team_rights: Manager wants to see team member's rights
- pending_approvals: Manager wants to see pending approvals
- approve_request: Manager wants to approve a request
- reject_request: Manager wants to reject a request
- greeting: User is greeting (e.g., "Hello", "Hi")
- thanks: User is thanking (e.g., "Thank you")
- clarify: User is responding to a clarification question
- confirm: User is confirming an action (e.g., "Yes", "OK")
- cancel: User is canceling (e.g., "No", "Cancel")
- unknown: Intent cannot be determined
- out_of_scope: Request is outside ITSM scope (e.g., "What's the weather?")

IMPORTANT: 
- Detect the language of the user's message
- If clarification is needed, generate the clarification question IN THE SAME LANGUAGE as the user's message
- The clarification question must be contextual and helpful

Respond ONLY with a JSON object in this exact format:
{
  "intent": "intent_code",
  "confidence": 0.0 to 1.0,
  "entities": {
    "application": "extracted app name if any",
    "ticketId": "extracted ticket ID if any",
    "problem": "brief description of the problem if any"
  },
  "needsClarification": true/false,
  "clarificationQuestion": "contextual question to ask if clarification needed (MUST be in the user's language)"
}`;

/**
 * Analyze user message to detect intent
 * @param {string} message - User message
 * @param {Object} conversationContext - Conversation context
 * @returns {Object} Intent analysis result
 */
const analyze = async (message, conversationContext) => {
  const startTime = Date.now();

  try {
    // Build messages for LLM
    const messages = [];

    // Add recent conversation history for context (more messages for better context)
    if (conversationContext.messages && conversationContext.messages.length > 0) {
      const recentMessages = conversationContext.messages.slice(-8);
      for (const m of recentMessages) {
        messages.push({
          role: m.role,
          content: m.content
        });
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: `Analyze this message and determine the user's intent:\n\n"${message}"`
    });

    // Call LLM
    const response = await llmClient.chatCompletion({
      systemPrompt: SYSTEM_PROMPT,
      messages,
      options: {
        temperature: 0.3, // Lower temperature for more consistent intent detection
        maxTokens: 500
      }
    });

    // Parse response
    const result = llmClient.parseJsonResponse(response.content);

    // Validate and normalize result
    const normalizedResult = normalizeIntentResult(result, message);

    const executionTime = Date.now() - startTime;
    logger.info(`-- intent-analyzer -- Completed in ${executionTime}ms: ${normalizedResult.intent} (confidence: ${normalizedResult.confidence})`);

    return {
      ...normalizedResult,
      executionTimeMs: executionTime
    };

  } catch (error) {
    logger.error(`-- intent-analyzer -- Failed: ${error.message}`, { stack: error.stack });
    
    // Return unknown intent on error - minimal response, no hardcoded message
    return {
      intent: INTENTS.UNKNOWN,
      confidence: 0,
      entities: {},
      suggestedTools: [],
      needsClarification: false,
      clarificationQuestion: null,
      error: error.message,
      executionTimeMs: Date.now() - startTime
    };
  }
};

/**
 * Normalize and validate intent result
 * @param {Object} result - Raw LLM result
 * @param {string} originalMessage - Original user message
 * @returns {Object} Normalized result
 */
const normalizeIntentResult = (result, originalMessage) => {
  // Validate intent
  const intent = Object.values(INTENTS).includes(result.intent) 
    ? result.intent 
    : INTENTS.UNKNOWN;

  // Validate confidence
  let confidence = parseFloat(result.confidence) || 0;
  confidence = Math.max(0, Math.min(1, confidence));

  // Get suggested tools for this intent
  const suggestedTools = INTENT_TOOL_MAPPING[intent] || [];

  // Handle low confidence - LLM generates clarification question directly
  const needsClarification = confidence < 0.6 || result.needsClarification === true;

  return {
    intent,
    confidence,
    entities: result.entities || {},
    suggestedTools,
    needsClarification,
    clarificationQuestion: needsClarification ? (result.clarificationQuestion || null) : null
  };
};

module.exports = {
  analyze,
  SYSTEM_PROMPT
};
