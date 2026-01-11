const logger = require('../../../../../config/logger');
const llmClient = require('../../utils/llm-client');
const { createToolResult } = require('../../schemas/common');

/**
 * Qualify Incident Tool
 * Uses LLM to qualify and categorize an incident based on user description
 */

const TOOL_NAME = 'qualify_incident';

const SYSTEM_PROMPT = `You are an IT incident qualification assistant.
Your task is to analyze incident descriptions and categorize them properly.

Categories available:
- HARDWARE: Physical equipment issues (computer, monitor, keyboard, mouse, printer)
- SOFTWARE: Application issues (crashes, errors, bugs)
- NETWORK: Connectivity issues (internet, VPN, WiFi)
- ACCESS: Login/authentication issues (password, account locked)
- EMAIL: Email-related issues (Outlook, sending/receiving)
- PERFORMANCE: Slowness issues (slow computer, slow application)
- OTHER: Anything that doesn't fit above

Priority levels:
- CRITICAL: Complete work stoppage for multiple users
- HIGH: Complete work stoppage for one user
- MEDIUM: Partial work impact, workaround exists
- LOW: Minor inconvenience, no work impact

Respond with JSON:
{
  "category": "CATEGORY_CODE",
  "priority": "PRIORITY_LEVEL",
  "summary": "Brief summary of the incident",
  "affectedSystem": "System or application affected",
  "symptoms": ["List of symptoms"],
  "suggestedTitle": "Suggested ticket title",
  "confidence": 0.0 to 1.0,
  "needsMoreInfo": false,
  "clarificationQuestion": null
}`;

/**
 * Execute incident qualification
 * @param {Object} params - Tool parameters
 * @param {Object} params.userContext - User context
 * @param {Object} params.intent - Intent analysis result
 * @param {Object} params.conversationContext - Conversation context
 * @returns {Object} Tool result with qualification
 */
const execute = async (params) => {
  const startTime = Date.now();
  const { userContext, intent, conversationContext } = params;

  try {
    // Get incident description from intent or conversation
    const description = intent?.entities?.problem ||
                       conversationContext?.messages?.slice(-1)[0]?.content ||
                       '';

    if (!description) {
      return createToolResult(TOOL_NAME, false, null, {
        error: 'No incident description provided',
        executionTimeMs: Date.now() - startTime
      });
    }

    const locale = userContext?.locale || 'fr';

    logger.info(`Qualifying incident: "${description.substring(0, 50)}..."`);

    const messages = [
      {
        role: 'user',
        content: `Qualify this incident reported by a user:

"${description}"

Respond in ${locale === 'fr' ? 'French' : 'English'} for the summary and suggested title.`
      }
    ];

    // Call LLM
    const response = await llmClient.chatCompletion({
      systemPrompt: SYSTEM_PROMPT,
      messages,
      options: {
        temperature: 0.3,
        maxTokens: 800
      }
    });

    // Parse response
    const qualification = llmClient.parseJsonResponse(response.content);

    // Validate and normalize
    const normalizedQualification = normalizeQualification(qualification);

    const executionTime = Date.now() - startTime;

    logger.info(`Incident qualified in ${executionTime}ms: ${normalizedQualification.category} / ${normalizedQualification.priority}`);

    // Determine next tools
    const suggestedNextTools = normalizedQualification.needsMoreInfo 
      ? ['ask_clarifying_question']
      : ['create_incident'];

    return createToolResult(TOOL_NAME, true, normalizedQualification, {
      executionTimeMs: executionTime,
      suggestedNextTools
    });

  } catch (error) {
    logger.error(`Incident qualification failed: ${error.message}`, { stack: error.stack });
    
    return createToolResult(TOOL_NAME, false, null, {
      error: error.message,
      executionTimeMs: Date.now() - startTime
    });
  }
};

/**
 * Normalize and validate qualification result
 * @param {Object} qualification - Raw qualification from LLM
 * @returns {Object} Normalized qualification
 */
const normalizeQualification = (qualification) => {
  const validCategories = ['HARDWARE', 'SOFTWARE', 'NETWORK', 'ACCESS', 'EMAIL', 'PERFORMANCE', 'OTHER'];
  const validPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  return {
    category: validCategories.includes(qualification.category) ? qualification.category : 'OTHER',
    priority: validPriorities.includes(qualification.priority) ? qualification.priority : 'MEDIUM',
    summary: qualification.summary || '',
    affectedSystem: qualification.affectedSystem || 'Unknown',
    symptoms: Array.isArray(qualification.symptoms) ? qualification.symptoms : [],
    suggestedTitle: qualification.suggestedTitle || 'New incident',
    confidence: Math.max(0, Math.min(1, parseFloat(qualification.confidence) || 0.5)),
    needsMoreInfo: qualification.needsMoreInfo === true,
    clarificationQuestion: qualification.clarificationQuestion || null
  };
};

// Mark as implemented
execute._implemented = true;

module.exports = {
  execute,
  TOOL_NAME
};
