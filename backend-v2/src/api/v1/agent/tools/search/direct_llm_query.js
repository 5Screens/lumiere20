const logger = require('../../../../../config/logger');
const llmClient = require('../../utils/llm-client');
const { createToolResult } = require('../../schemas/common');

/**
 * Direct LLM Query Tool
 * Sends the user message directly to the LLM API without any system prompt
 * Used as fallback when semantic_search_kb finds no results
 */

const TOOL_NAME = 'direct_llm_query';

/**
 * Execute direct LLM query without system prompt
 * @param {Object} params - Tool parameters
 * @param {Object} params.userContext - User context
 * @param {Object} params.intent - Intent analysis result
 * @param {Object} params.conversationContext - Conversation context
 * @returns {Object} Tool result with LLM response
 */
const execute = async (params) => {
  const startTime = Date.now();
  const { conversationContext } = params;

  logger.info(`-- ${TOOL_NAME} -- execute`);
  logger.info(`  INPUT: messagesCount=${conversationContext?.messages?.length || 0}`);

  try {
    // Build messages from conversation history (no system prompt)
    const messages = [];

    // Add conversation history
    if (conversationContext?.messages && conversationContext.messages.length > 0) {
      for (const m of conversationContext.messages) {
        messages.push({
          role: m.role,
          content: m.content
        });
      }
    }

    if (messages.length === 0) {
      logger.warn(`  OUTPUT: error=No messages to send`);
      return createToolResult(TOOL_NAME, false, null, {
        error: 'No messages to send',
        executionTimeMs: Date.now() - startTime
      });
    }

    logger.info(`  Sending ${messages.length} messages directly to LLM (no system prompt)`);

    // Call LLM without system prompt
    const response = await llmClient.chatCompletion({
      systemPrompt: null, // No system prompt - raw query
      messages,
      options: {
        temperature: 0.7,
        maxTokens: 2048
      }
    });

    const executionTime = Date.now() - startTime;

    logger.info(`  OUTPUT: responseLength=${response.content?.length || 0}, executionTimeMs=${executionTime}`);

    return createToolResult(TOOL_NAME, true, {
      response: response.content,
      usage: response.usage
    }, {
      executionTimeMs: executionTime,
      stopExecution: true // Stop tool chain - we have the final response
    });

  } catch (error) {
    logger.error(`-- ${TOOL_NAME} -- Failed: ${error.message}`, { stack: error.stack });
    
    return createToolResult(TOOL_NAME, false, null, {
      error: error.message,
      executionTimeMs: Date.now() - startTime
    });
  }
};

// Mark as implemented
execute._implemented = true;

module.exports = {
  execute,
  TOOL_NAME
};
