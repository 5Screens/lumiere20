const axios = require('axios');
const logger = require('../../../config/logger');

/**
 * Send a message to the AI agent (Infomaniak LLM)
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Optional conversation history
 * @returns {Promise<Object>} - AI response
 */
const sendMessageToAgent = async (userMessage, conversationHistory = []) => {
  logger.info('[AGENT SERVICE] Sending message to AI agent');
  
  try {
    // Build messages array
    const messages = [
      ...conversationHistory,
      {
        content: userMessage,
        role: 'user'
      }
    ];

    // Prepare API call
    const apiUrl = process.env.INFOMANIAK_AI_API_URL;
    const apiToken = process.env.INFOMANIAK_AI_TOKEN;
    const model = process.env.INFOMANIAK_AI_MODEL || 'mixtral';

    if (!apiUrl || !apiToken) {
      throw new Error('AI configuration missing: INFOMANIAK_AI_API_URL or INFOMANIAK_AI_TOKEN not set');
    }

    logger.info(`[AGENT SERVICE] Calling ${apiUrl} with model ${model}`);

    // Call Infomaniak AI API
    const response = await axios.post(
      apiUrl,
      {
        messages,
        model
      },
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    logger.info('[AGENT SERVICE] Received response from AI agent');

    // Extract assistant's message
    const assistantMessage = response.data.choices[0]?.message?.content;
    
    if (!assistantMessage) {
      throw new Error('No response from AI agent');
    }

    return {
      message: assistantMessage,
      model: response.data.model,
      usage: response.data.usage,
      id: response.data.id
    };

  } catch (error) {
    logger.error('[AGENT SERVICE] Error calling AI agent:', error.message);
    
    if (error.response) {
      logger.error('[AGENT SERVICE] API error response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    throw error;
  }
};

module.exports = {
  sendMessageToAgent
};
