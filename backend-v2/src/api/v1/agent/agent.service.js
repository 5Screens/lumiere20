/**
 * Agent Service
 * Main orchestrator for the AI agent with function calling
 */

const logger = require('../../../config/logger');
const mistralClient = require('./mistral.client');
const conversationService = require('./conversation.service');
const { getToolDefinitions, executeTool } = require('./tools');
const { getSystemPrompt } = require('./prompts/system.prompt');
const knowledgeTools = require('./tools/knowledge.tools');

const MAX_TOOL_ITERATIONS = 5;

/**
 * Process a user message through the agentic pipeline
 * @param {string} message - User message
 * @param {Object} userContext - User context (userUuid, locale, userName, conversationId)
 * @returns {Object} Agent response
 */
const processMessage = async (message, userContext) => {
  const startTime = Date.now();
  const { userUuid, locale, userName, conversationId } = userContext;

  logger.info(`-- agent-service -- processMessage`);
  logger.info(`  INPUT: user=${userUuid}, locale=${locale}, message="${message.substring(0, 80)}..."`);

  try {
    // Step 1: Get or create conversation
    const conversation = await conversationService.getOrCreateConversation(conversationId, userUuid);
    const isNewConversation = !conversationId;

    // Step 2: Add user message to conversation
    await conversationService.addMessage(conversation.uuid, {
      role: 'user',
      content: message
    });

    // Update title if new conversation
    if (isNewConversation) {
      await conversationService.updateTitle(conversation.uuid, message);
    }

    // Step 3: Get conversation history for LLM
    const history = await conversationService.getMessagesForLLM(conversation.uuid);

    // Step 4: Prepare tools and system prompt
    const tools = getToolDefinitions();
    const systemPrompt = getSystemPrompt({ locale, userName });

    // Step 5: Call Mistral with function calling
    let response = await mistralClient.chatCompletion({
      systemPrompt,
      messages: history,
      tools,
      options: { temperature: 0.7 }
    });

    // Step 6: Handle tool calls (agentic loop)
    let iterations = 0;
    const toolMessages = [];

    while (response.toolCalls && response.toolCalls.length > 0 && iterations < MAX_TOOL_ITERATIONS) {
      iterations++;
      logger.info(`-- agent-service -- Tool iteration ${iterations}: ${response.toolCalls.length} tool(s)`);

      // Save assistant message with tool_calls
      await conversationService.addMessage(conversation.uuid, {
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls
      });

      // Execute each tool call
      for (const toolCall of response.toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || '{}');

        logger.info(`  Executing tool: ${toolName}(${JSON.stringify(toolArgs)})`);

        // Execute the tool
        const toolResult = await executeTool(toolName, toolArgs, {
          userUuid,
          locale,
          conversationId: conversation.uuid
        });

        // Check if KB search returned no results and needs LLM fallback
        if (toolName === 'search_knowledge_base' && toolResult.success && toolResult.data?.useLlmFallback) {
          logger.info(`  KB returned no results, using LLM fallback`);
          const llmResponse = await knowledgeTools.directLlmQuery(toolResult.data.originalQuery, { locale });
          if (llmResponse.success) {
            toolResult.data = {
              found: true,
              source: 'general_knowledge',
              response: llmResponse.response
            };
          }
        }

        // Save tool result message
        await conversationService.addMessage(conversation.uuid, {
          role: 'tool',
          content: JSON.stringify(toolResult),
          toolCallId: toolCall.id,
          toolName
        });

        // Add to messages for next LLM call
        toolMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }

      // Get updated history and call LLM again
      const updatedHistory = await conversationService.getMessagesForLLM(conversation.uuid);
      
      response = await mistralClient.chatCompletion({
        systemPrompt,
        messages: updatedHistory,
        tools,
        options: { temperature: 0.7 }
      });
    }

    // Step 7: Save final assistant response
    const finalContent = response.content || 'I apologize, but I was unable to process your request.';
    
    const savedMessage = await conversationService.addMessage(conversation.uuid, {
      role: 'assistant',
      content: finalContent
    });

    const processingTime = Date.now() - startTime;
    logger.info(`  OUTPUT: iterations=${iterations}, processingTimeMs=${processingTime}`);

    return {
      conversationId: conversation.uuid,
      messageUuid: savedMessage.uuid,
      response: finalContent,
      metadata: {
        processingTimeMs: processingTime,
        toolIterations: iterations,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    logger.error(`-- agent-service -- Error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Health check for the agent service
 * @returns {Object} Health status
 */
const healthCheck = async () => {
  const checks = {
    service: 'ok',
    llm: 'unknown',
    database: 'unknown'
  };

  // Check LLM connectivity
  try {
    const llmStatus = await mistralClient.healthCheck();
    checks.llm = llmStatus ? 'ok' : 'error';
  } catch (error) {
    checks.llm = 'error';
    logger.warn(`-- agent-service -- LLM health check failed: ${error.message}`);
  }

  // Check database connectivity
  try {
    const prisma = require('../../../config/prisma');
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
    logger.warn(`-- agent-service -- Database health check failed: ${error.message}`);
  }

  const allHealthy = Object.values(checks).every(v => v === 'ok');

  return {
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  processMessage,
  healthCheck
};
