const logger = require('../../../../config/logger');
const llmClient = require('../utils/llm-client');
const { INTENTS, INTENT_TOOL_MAPPING } = require('../schemas/common');

/**
 * Intent Analyzer - Analyzes user messages to detect intent
 * Uses LLM to understand user intention and extract entities
 */

const SYSTEM_PROMPT = `You are an intent analyzer for an IT Service Management (ITSM) portal assistant.
Your task is to analyze user messages and determine their intent.

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
  "clarificationQuestion": "question to ask if clarification needed"
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

    // Add recent conversation history for context
    if (conversationContext.messages && conversationContext.messages.length > 0) {
      const recentMessages = conversationContext.messages.slice(-4);
      messages.push(...recentMessages.map(m => ({
        role: m.role,
        content: m.content
      })));
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
    logger.info(`Intent analysis completed in ${executionTime}ms`, {
      intent: normalizedResult.intent,
      confidence: normalizedResult.confidence
    });

    return {
      ...normalizedResult,
      executionTimeMs: executionTime
    };

  } catch (error) {
    logger.error(`Intent analysis failed: ${error.message}`, { stack: error.stack });
    
    // Return unknown intent on error
    return {
      intent: INTENTS.UNKNOWN,
      confidence: 0,
      entities: {},
      suggestedTools: [],
      needsClarification: true,
      clarificationQuestion: "I'm sorry, I couldn't understand your request. Could you please rephrase it?",
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

  // Handle low confidence
  const needsClarification = confidence < 0.6 || result.needsClarification === true;

  return {
    intent,
    confidence,
    entities: result.entities || {},
    suggestedTools,
    needsClarification,
    clarificationQuestion: needsClarification 
      ? (result.clarificationQuestion || generateClarificationQuestion(intent, originalMessage))
      : null
  };
};

/**
 * Generate a clarification question based on intent
 * @param {string} intent - Detected intent
 * @param {string} message - Original message
 * @returns {string} Clarification question
 */
const generateClarificationQuestion = (intent, message) => {
  const questions = {
    [INTENTS.SEARCH_SOLUTION]: "Could you describe the problem you're experiencing in more detail?",
    [INTENTS.PASSWORD_RESET]: "Which application or system do you need to reset your password for?",
    [INTENTS.ACCOUNT_UNLOCK]: "Which account is locked? (e.g., Windows, email, specific application)",
    [INTENTS.REQUEST_ACCESS]: "Which application or system do you need access to?",
    [INTENTS.REPORT_INCIDENT]: "Could you describe the issue you're experiencing? What error messages do you see?",
    [INTENTS.REQUEST_SERVICE]: "What type of service or equipment do you need?",
    [INTENTS.TRACK_TICKET]: "Do you have a ticket number you'd like to track?",
    [INTENTS.UNKNOWN]: "I'm not sure I understood your request. Could you please provide more details?",
    [INTENTS.OUT_OF_SCOPE]: "I'm an IT support assistant. How can I help you with IT-related questions?"
  };

  return questions[intent] || questions[INTENTS.UNKNOWN];
};

module.exports = {
  analyze,
  SYSTEM_PROMPT
};
