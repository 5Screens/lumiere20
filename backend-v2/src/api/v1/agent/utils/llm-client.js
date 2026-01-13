const https = require('https');
const logger = require('../../../../config/logger');

/**
 * LLM Client for Infomaniak AI
 * Uses native Node.js https module (same as backend v1)
 */

const LLM_CONFIG = {
  apiUrl: process.env.INFOMANIAK_AI_API_URL,
  token: process.env.INFOMANIAK_AI_TOKEN,
  model: process.env.INFOMANIAK_AI_MODEL || 'mixtral',
  maxTokens: parseInt(process.env.INFOMANIAK_AI_MAX_TOKENS) || 2048,
  temperature: parseFloat(process.env.INFOMANIAK_AI_TEMPERATURE) || 0.7,
  timeout: parseInt(process.env.INFOMANIAK_AI_TIMEOUT) || 30000
};

/**
 * Send a chat completion request to the LLM
 * @param {Object} params - Request parameters
 * @param {string} params.systemPrompt - System prompt
 * @param {Array} params.messages - Message history
 * @param {Object} params.options - Additional options (temperature, maxTokens, etc.)
 * @returns {Promise<Object>} LLM response
 */
const chatCompletion = async ({ systemPrompt, messages, options = {} }) => {
  const startTime = Date.now();

  const apiUrl = LLM_CONFIG.apiUrl;
  const apiToken = LLM_CONFIG.token;

  if (!apiUrl || !apiToken) {
    throw new Error('LLM configuration missing. Check INFOMANIAK_AI_API_URL and INFOMANIAK_AI_TOKEN in .env');
  }

  return new Promise((resolve, reject) => {
    try {
      const requestMessages = [];
      
      // Add system prompt
      if (systemPrompt) {
        requestMessages.push({
          role: 'system',
          content: systemPrompt
        });
      }

      // Add conversation messages (ensure alternating roles)
      if (messages && messages.length > 0) {
        let lastRole = 'system'; // After system prompt
        for (const m of messages) {
          const role = m.role === 'assistant' ? 'assistant' : 'user';
          
          // If same role as last, merge content
          if (role === lastRole && requestMessages.length > 0) {
            const lastMsg = requestMessages[requestMessages.length - 1];
            if (lastMsg.role !== 'system') {
              lastMsg.content += '\n\n' + m.content;
              continue;
            }
          }
          
          requestMessages.push({ role, content: m.content });
          lastRole = role;
        }
      }

      const requestBody = {
        model: options.model || LLM_CONFIG.model,
        messages: requestMessages,
        max_tokens: options.maxTokens || LLM_CONFIG.maxTokens,
        temperature: options.temperature ?? LLM_CONFIG.temperature
      };

      // Parse URL
      const url = new URL(apiUrl);
      const postData = JSON.stringify(requestBody);

      // Log full request details
      logger.info(`-- llm-client -- REQUEST to ${apiUrl}`);
      logger.info(`  model: ${requestBody.model}, temperature: ${requestBody.temperature}, max_tokens: ${requestBody.max_tokens}`);
      logger.info(`  messages count: ${requestMessages.length}`);
      for (let i = 0; i < requestMessages.length; i++) {
        const msg = requestMessages[i];
        logger.info(`  [${i}] role=${msg.role}, content (${msg.content.length} chars): ${msg.content.substring(0, 500)}${msg.content.length > 500 ? '...' : ''}`);
      }

      // Configure request
      const reqOptions = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: options.timeout || LLM_CONFIG.timeout
      };

      // Make request
      const req = https.request(reqOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const executionTime = Date.now() - startTime;
          
          try {
            if (res.statusCode !== 200) {
              logger.error(`-- llm-client -- API error: ${res.statusCode}`, { response: data });
              return reject(new Error(`LLM API error: ${res.statusCode} - ${data}`));
            }

            const response = JSON.parse(data);
            const content = response.choices?.[0]?.message?.content;

            if (!content) {
              return reject(new Error('Invalid LLM response format'));
            }

            const usage = response.usage || {};

            // Log full response details
            logger.info(`-- llm-client -- RESPONSE received in ${executionTime}ms`);
            logger.info(`  tokens: prompt=${usage.prompt_tokens || 0}, completion=${usage.completion_tokens || 0}, total=${usage.total_tokens || 0}`);
            logger.info(`  content (${content.length} chars): ${content.substring(0, 1000)}${content.length > 1000 ? '...' : ''}`);

            resolve({
              content,
              usage: {
                promptTokens: usage.prompt_tokens || 0,
                completionTokens: usage.completion_tokens || 0,
                totalTokens: usage.total_tokens || 0
              },
              executionTimeMs: executionTime
            });
          } catch (parseError) {
            logger.error(`-- llm-client -- Response parse error: ${parseError.message}`);
            reject(parseError);
          }
        });
      });

      req.on('error', (error) => {
        logger.error(`-- llm-client -- Request error: ${error.message}`);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        logger.error(`-- llm-client -- Request timeout after ${options.timeout || LLM_CONFIG.timeout}ms`);
        reject(new Error('LLM request timeout'));
      });

      // Send request
      req.write(postData);
      req.end();

    } catch (error) {
      logger.error(`-- llm-client -- Request failed: ${error.message}`);
      reject(error);
    }
  });
};

/**
 * Parse JSON from LLM response, handling markdown code blocks
 * @param {string} content - LLM response content
 * @returns {Object} Parsed JSON
 */
const parseJsonResponse = (content) => {
  try {
    // Try direct parse first
    return JSON.parse(content);
  } catch (e) {
    // Try to extract JSON from markdown code block
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    
    // Try to find JSON object in content
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    
    throw new Error(`Failed to parse JSON from LLM response: ${content.substring(0, 200)}`);
  }
};

/**
 * Health check for LLM service
 * @returns {boolean} True if healthy
 */
const healthCheck = async () => {
  try {
    const response = await chatCompletion({
      systemPrompt: 'You are a health check assistant.',
      messages: [{ role: 'user', content: 'Reply with OK' }],
      options: { maxTokens: 10, timeout: 5000 }
    });
    return response.content.toLowerCase().includes('ok');
  } catch (error) {
    logger.warn(`-- llm-client -- Health check failed: ${error.message}`);
    return false;
  }
};

module.exports = {
  chatCompletion,
  parseJsonResponse,
  healthCheck,
  LLM_CONFIG
};
