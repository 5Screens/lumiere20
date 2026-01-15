/**
 * Mistral Client for Mistral AI API
 * Supports native function calling
 */

const https = require('https');
const logger = require('../../../config/logger');

const LLM_CONFIG = {
  apiUrl: process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions',
  apiKey: process.env.MISTRAL_API_KEY,
  model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
  maxTokens: parseInt(process.env.MISTRAL_MAX_TOKENS) || 4096,
  temperature: parseFloat(process.env.MISTRAL_TEMPERATURE) || 0.7,
  timeout: parseInt(process.env.MISTRAL_TIMEOUT) || 60000
};

/**
 * Send a chat completion request with optional tools (function calling)
 * @param {Object} params - Request parameters
 * @param {string} params.systemPrompt - System prompt
 * @param {Array} params.messages - Message history
 * @param {Array} params.tools - Available tools for function calling
 * @param {Object} params.options - Additional options
 * @returns {Promise<Object>} LLM response
 */
const chatCompletion = async ({ systemPrompt, messages, tools = null, options = {} }) => {
  const startTime = Date.now();

  const apiUrl = LLM_CONFIG.apiUrl;
  const apiKey = LLM_CONFIG.apiKey;

  if (!apiKey) {
    throw new Error('Mistral API key missing. Check MISTRAL_API_KEY in .env');
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

      // Add conversation messages
      if (messages && messages.length > 0) {
        for (const m of messages) {
          // Handle tool messages
          if (m.role === 'tool') {
            requestMessages.push({
              role: 'tool',
              tool_call_id: m.tool_call_id,
              content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
            });
          }
          // Handle assistant messages with tool_calls
          else if (m.role === 'assistant' && m.tool_calls) {
            requestMessages.push({
              role: 'assistant',
              content: m.content || null,
              tool_calls: m.tool_calls
            });
          }
          // Handle regular messages
          else {
            requestMessages.push({
              role: m.role,
              content: m.content
            });
          }
        }
      }

      const requestBody = {
        model: options.model || LLM_CONFIG.model,
        messages: requestMessages,
        max_tokens: options.maxTokens || LLM_CONFIG.maxTokens,
        temperature: options.temperature ?? LLM_CONFIG.temperature
      };

      // Add tools if provided (function calling)
      if (tools && tools.length > 0) {
        requestBody.tools = tools;
        requestBody.tool_choice = options.toolChoice || 'auto';
      }

      // Parse URL
      const url = new URL(apiUrl);
      const postData = JSON.stringify(requestBody);

      // Log request
      logger.info(`-- mistral-client -- REQUEST to ${apiUrl}`);
      logger.info(`  model: ${requestBody.model}, tools: ${tools ? tools.length : 0}`);
      logger.info(`  tool_choice: ${requestBody.tool_choice || 'none'}`);
      logger.debug(`  request body: ${JSON.stringify(requestBody).substring(0, 500)}...`);

      // Configure request
      const reqOptions = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: options.timeout || LLM_CONFIG.timeout
      };

      // Make request
      const req = https.request(reqOptions, (res) => {
        res.setEncoding('utf8');
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const executionTime = Date.now() - startTime;
          
          try {
            if (res.statusCode !== 200) {
              logger.error(`-- mistral-client -- API error: ${res.statusCode}`, { response: data });
              return reject(new Error(`LLM API error: ${res.statusCode} - ${data}`));
            }

            const response = JSON.parse(data);
            const choice = response.choices?.[0];
            const message = choice?.message;

            if (!message) {
              return reject(new Error('Invalid LLM response format'));
            }

            const usage = response.usage || {};

            // Log response
            logger.info(`-- mistral-client -- RESPONSE in ${executionTime}ms`);
            logger.info(`  tokens: ${usage.total_tokens || 0}, tool_calls: ${message.tool_calls ? message.tool_calls.length : 0}`);
            logger.info(`  finish_reason: ${choice.finish_reason}`);
            
            if (message.content) {
              logger.info(`  content: ${message.content.substring(0, 300)}${message.content.length > 300 ? '...' : ''}`);
            }
            if (message.tool_calls) {
              logger.info(`  tool_calls: ${JSON.stringify(message.tool_calls)}`);
            }

            resolve({
              content: message.content,
              toolCalls: message.tool_calls || null,
              finishReason: choice.finish_reason,
              usage: {
                promptTokens: usage.prompt_tokens || 0,
                completionTokens: usage.completion_tokens || 0,
                totalTokens: usage.total_tokens || 0
              },
              executionTimeMs: executionTime
            });
          } catch (parseError) {
            logger.error(`-- mistral-client -- Response parse error: ${parseError.message}`);
            reject(parseError);
          }
        });
      });

      req.on('error', (error) => {
        logger.error(`-- mistral-client -- Request error: ${error.message}`);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        logger.error(`-- mistral-client -- Request timeout after ${options.timeout || LLM_CONFIG.timeout}ms`);
        reject(new Error('LLM request timeout'));
      });

      // Send request
      req.write(postData);
      req.end();

    } catch (error) {
      logger.error(`-- mistral-client -- Request failed: ${error.message}`);
      reject(error);
    }
  });
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
    return response.content?.toLowerCase().includes('ok');
  } catch (error) {
    logger.warn(`-- mistral-client -- Health check failed: ${error.message}`);
    return false;
  }
};

module.exports = {
  chatCompletion,
  healthCheck,
  LLM_CONFIG
};
