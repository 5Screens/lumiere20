const https = require('https');
const logger = require('../../../config/logger');

/**
 * Send a message to the AI agent (Infomaniak LLM)
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Optional conversation history
 * @returns {Promise<Object>} - AI response
 */
const sendMessageToAgent = async (userMessage, conversationHistory = []) => {
  logger.info('[AGENT SERVICE] Sending message to AI agent');
  
  return new Promise((resolve, reject) => {
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

      // Parse URL
      const url = new URL(apiUrl);
      
      // Prepare request body
      const postData = JSON.stringify({
        messages,
        model
      });

      // Configure request
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 30000 // 30 seconds timeout
      };

      // Make request
      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              logger.error('[AGENT SERVICE] API error response:');
              logger.error(`[AGENT SERVICE] Status: ${res.statusCode}`);
              logger.error(`[AGENT SERVICE] Response body: ${data}`);
              logger.error(`[AGENT SERVICE] Headers: ${JSON.stringify(res.headers)}`);
              return reject(new Error(`API returned status ${res.statusCode}: ${data}`));
            }

            const response = JSON.parse(data);
            logger.info('[AGENT SERVICE] Received response from AI agent');

            // Extract assistant's message
            const assistantMessage = response.choices[0]?.message?.content;
            
            if (!assistantMessage) {
              return reject(new Error('No response from AI agent'));
            }

            resolve({
              message: assistantMessage,
              model: response.model,
              usage: response.usage,
              id: response.id
            });
          } catch (parseError) {
            logger.error('[AGENT SERVICE] Error parsing response:');
            logger.error(`[AGENT SERVICE] Parse error: ${parseError.message}`);
            logger.error(`[AGENT SERVICE] Stack: ${parseError.stack}`);
            logger.error(`[AGENT SERVICE] Raw data: ${data}`);
            reject(parseError);
          }
        });
      });

      req.on('error', (error) => {
        logger.error('[AGENT SERVICE] Request error:');
        logger.error(`[AGENT SERVICE] Error message: ${error.message}`);
        logger.error(`[AGENT SERVICE] Error code: ${error.code}`);
        logger.error(`[AGENT SERVICE] Stack: ${error.stack}`);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        logger.error('[AGENT SERVICE] Request timeout');
        logger.error(`[AGENT SERVICE] Timeout after 30 seconds calling ${apiUrl}`);
        reject(new Error('Request timeout'));
      });

      // Send request
      req.write(postData);
      req.end();

    } catch (error) {
      logger.error('[AGENT SERVICE] Error calling AI agent:');
      logger.error(`[AGENT SERVICE] Error message: ${error.message}`);
      logger.error(`[AGENT SERVICE] Error stack: ${error.stack}`);
      reject(error);
    }
  });
};

module.exports = {
  sendMessageToAgent
};
