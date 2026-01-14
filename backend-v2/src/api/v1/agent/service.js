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
  
  logger.info(`-- agent-service -- processMessage`);
  logger.info(`  INPUT: conversationId=${conversationId}, message="${message.substring(0, 80)}...", locale=${userContext.locale}`);

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
    logger.info(`-- agent-service -- Step 2: Analyzing intent...`);
    const intentResult = await intentAnalyzer.analyze(message, conversationContext);
    
    logger.info(`-- agent-service -- Intent result: ${intentResult.intent} (confidence: ${intentResult.confidence})`);
    logger.info(`  entities: ${JSON.stringify(intentResult.entities)}`);
    logger.info(`  suggestedTools: ${JSON.stringify(intentResult.suggestedTools)}`);

    // Step 3: Execute tools based on intent
    const toolResults = [];
    let currentContext = { ...conversationContext, intent: intentResult };
    let directLlmResponse = null; // Store direct LLM response if used
    
    if (intentResult.suggestedTools && intentResult.suggestedTools.length > 0) {
      for (const toolName of intentResult.suggestedTools) {
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

        // Check if semantic_search_kb found no results -> call direct_llm_query
        if (toolName === 'semantic_search_kb' && toolResult.success) {
          const hasRelevantResults = toolResult.data?.hasRelevantResults;
          if (!hasRelevantResults) {
            logger.info(`-- agent-service -- semantic_search_kb found no results, calling direct_llm_query`);
            
            const directResult = await toolExecutor.execute('direct_llm_query', {
              userContext,
              conversationContext: currentContext,
              intent: intentResult,
              previousResults: toolResults
            });
            
            toolResults.push({
              tool: 'direct_llm_query',
              success: directResult.success,
              data: directResult.data,
              error: directResult.error
            });

            if (directResult.success && directResult.data?.response) {
              directLlmResponse = directResult.data.response;
              logger.info(`-- agent-service -- direct_llm_query returned response (${directLlmResponse.length} chars)`);
              break; // Stop tool chain - we have the final response
            }
          }
        }

        // Stop if tool indicates we should stop
        if (toolResult.stopExecution) {
          logger.info(`-- agent-service -- Tool ${toolName} requested execution stop`);
          break;
        }
      }
    }

    // Step 4: Build response
    let response;
    
    if (directLlmResponse) {
      // Use direct LLM response (no response-builder processing)
      logger.info(`-- agent-service -- Step 4: Using direct LLM response (skipping response-builder)`);
      response = {
        message: directLlmResponse,
        suggestedActions: [],
        clarificationNeeded: false,
        clarificationQuestion: null
      };
    } else {
      // Use response-builder for other cases
      logger.info(`-- agent-service -- Step 4: Building response with ${toolResults.length} tool results`);
      response = await responseBuilder.build({
        userMessage: message,
        intent: intentResult,
        toolResults,
        conversationContext: currentContext,
        userContext
      });
    }

    // Add assistant response to context
    contextManager.addMessage(conversationContext, {
      role: 'assistant',
      content: response.message,
      timestamp: new Date().toISOString(),
      metadata: {
        intent: intentResult.intent,
        toolsExecuted: toolResults.map(t => t.tool),
        usedDirectLlm: !!directLlmResponse
      }
    });

    // Save updated context
    await contextManager.saveContext(conversationId, conversationContext);

    const processingTime = Date.now() - startTime;
    logger.info(`  OUTPUT: intent=${intentResult.intent}, toolsExecuted=${toolResults.length}, usedDirectLlm=${!!directLlmResponse}, processingTimeMs=${processingTime}`);

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
        timestamp: new Date().toISOString(),
        usedDirectLlm: !!directLlmResponse
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
    const llmClient = require('./utils/llm-client');
    const llmStatus = await llmClient.healthCheck();
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
