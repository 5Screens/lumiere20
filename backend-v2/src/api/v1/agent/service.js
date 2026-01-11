const crypto = require('crypto');
const logger = require('../../../config/logger');
const intentAnalyzer = require('./orchestrator/intent-analyzer');
const toolExecutor = require('./orchestrator/tool-executor');
const responseBuilder = require('./orchestrator/response-builder');
const contextManager = require('./orchestrator/context-manager');
const { initializeTools } = require('./tools');

/**
 * Main agent service - orchestrates the agentic AI flow
 */

// Initialize tools on module load
initializeTools();

/**
 * Process a user message through the agentic pipeline
 * @param {string} message - User message
 * @param {Object} userContext - User context (userId, email, locale, etc.)
 * @returns {Object} Agent response
 */
const processMessage = async (message, userContext) => {
  const startTime = Date.now();
  const conversationId = userContext.conversationId || crypto.randomUUID();
  
  logger.info(`Processing message for conversation ${conversationId}`);

  try {
    // Step 1: Get or create conversation context
    const conversationContext = await contextManager.getContext(conversationId, userContext);
    
    // Add current message to context
    contextManager.addMessage(conversationContext, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Step 2: Analyze user intent (LLM call)
    logger.info(`Analyzing intent for message: "${message.substring(0, 50)}..."`);
    const intentResult = await intentAnalyzer.analyze(message, conversationContext);
    
    logger.info(`Intent detected: ${intentResult.intent} (confidence: ${intentResult.confidence})`);

    // Step 3: Execute tools based on intent
    const toolResults = [];
    let currentContext = { ...conversationContext, intent: intentResult };
    
    if (intentResult.suggestedTools && intentResult.suggestedTools.length > 0) {
      for (const toolName of intentResult.suggestedTools) {
        logger.info(`Executing tool: ${toolName}`);
        
        const toolResult = await toolExecutor.execute(toolName, {
          userContext,
          conversationContext: currentContext,
          intent: intentResult,
          previousResults: toolResults
        });
        
        toolResults.push({
          tool: toolName,
          success: toolResult.success,
          data: toolResult.data,
          error: toolResult.error
        });

        // Update context with tool result
        currentContext = {
          ...currentContext,
          lastToolResult: toolResult
        };

        // Stop if tool indicates we should stop
        if (toolResult.stopExecution) {
          logger.info(`Tool ${toolName} requested execution stop`);
          break;
        }
      }
    }

    // Step 4: Build response (LLM call)
    logger.info(`Building response with ${toolResults.length} tool results`);
    const response = await responseBuilder.build({
      userMessage: message,
      intent: intentResult,
      toolResults,
      conversationContext: currentContext,
      userContext
    });

    // Add assistant response to context
    contextManager.addMessage(conversationContext, {
      role: 'assistant',
      content: response.message,
      timestamp: new Date().toISOString(),
      metadata: {
        intent: intentResult.intent,
        toolsExecuted: toolResults.map(t => t.tool)
      }
    });

    // Save updated context
    await contextManager.saveContext(conversationId, conversationContext);

    const processingTime = Date.now() - startTime;
    logger.info(`Message processed in ${processingTime}ms`);

    return {
      conversationId,
      message: response.message,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      toolsExecuted: toolResults.map(t => ({ tool: t.tool, success: t.success })),
      suggestedActions: response.suggestedActions || [],
      clarificationNeeded: response.clarificationNeeded || false,
      clarificationQuestion: response.clarificationQuestion || null,
      metadata: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    logger.error(`Error processing message: ${error.message}`, { stack: error.stack });
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
    const llmClient = require('./utils/llm-client');
    const llmStatus = await llmClient.healthCheck();
    checks.llm = llmStatus ? 'ok' : 'error';
  } catch (error) {
    checks.llm = 'error';
    logger.warn(`LLM health check failed: ${error.message}`);
  }

  // Check database connectivity
  try {
    const prisma = require('../../../config/prisma');
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
    logger.warn(`Database health check failed: ${error.message}`);
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
