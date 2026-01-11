const logger = require('../../../../../config/logger');
const prisma = require('../../../../../config/prisma');
const { createToolResult } = require('../../schemas/common');

/**
 * Semantic Search KB Tool
 * Searches the knowledge base (tickets of type KNOWLEDGE) for solutions
 */

const TOOL_NAME = 'semantic_search_kb';

/**
 * Execute semantic search on knowledge base
 * @param {Object} params - Tool parameters
 * @param {Object} params.userContext - User context
 * @param {Object} params.intent - Intent analysis result
 * @param {Object} params.conversationContext - Conversation context
 * @returns {Object} Tool result with search results
 */
const execute = async (params) => {
  const startTime = Date.now();
  const { userContext, intent, conversationContext } = params;

  try {
    // Extract search query from intent entities or original message
    const searchQuery = intent?.entities?.problem || 
                       intent?.entities?.query ||
                       conversationContext?.messages?.slice(-1)[0]?.content ||
                       '';

    if (!searchQuery) {
      return createToolResult(TOOL_NAME, false, null, {
        error: 'No search query provided',
        executionTimeMs: Date.now() - startTime
      });
    }

    logger.info(`Searching KB for: "${searchQuery.substring(0, 50)}..."`);

    // Search in tickets of type KNOWLEDGE
    // For now, use simple text search. Can be enhanced with vector search later.
    const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    // Build search conditions
    const searchConditions = searchTerms.map(term => ({
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } }
      ]
    }));

    // Query knowledge articles
    const knowledgeArticles = await prisma.tickets.findMany({
      where: {
        AND: [
          {
            ticket_type: {
              code: 'KNOWLEDGE'
            }
          },
          ...searchConditions
        ]
      },
      select: {
        uuid: true,
        title: true,
        description: true,
        created_at: true,
        updated_at: true,
        ticket_type: {
          select: {
            code: true,
            label: true
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      },
      take: 10
    });

    // Calculate relevance score (simple term frequency)
    const scoredResults = knowledgeArticles.map(article => {
      let score = 0;
      const titleLower = (article.title || '').toLowerCase();
      const descLower = (article.description || '').toLowerCase();
      
      for (const term of searchTerms) {
        if (titleLower.includes(term)) score += 2; // Title matches worth more
        if (descLower.includes(term)) score += 1;
      }
      
      // Normalize score
      const normalizedScore = Math.min(1, score / (searchTerms.length * 3));
      
      return {
        uuid: article.uuid,
        title: article.title,
        description: article.description?.substring(0, 500),
        source: 'kb',
        sourceType: 'KNOWLEDGE',
        relevanceScore: normalizedScore,
        updatedAt: article.updated_at
      };
    });

    // Sort by relevance and filter low scores
    const filteredResults = scoredResults
      .filter(r => r.relevanceScore > 0.1)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    const executionTime = Date.now() - startTime;

    logger.info(`KB search found ${filteredResults.length} results in ${executionTime}ms`);

    // Determine if we should suggest web search fallback
    const hasGoodResults = filteredResults.length > 0 && filteredResults[0].relevanceScore > 0.3;
    const suggestedNextTools = hasGoodResults 
      ? ['generate_solution_steps'] 
      : ['web_search_solution'];

    return createToolResult(TOOL_NAME, true, {
      query: searchQuery,
      results: filteredResults,
      totalFound: filteredResults.length,
      hasRelevantResults: hasGoodResults,
      bestScore: filteredResults[0]?.relevanceScore || 0
    }, {
      executionTimeMs: executionTime,
      suggestedNextTools
    });

  } catch (error) {
    logger.error(`KB search failed: ${error.message}`, { stack: error.stack });
    
    return createToolResult(TOOL_NAME, false, null, {
      error: error.message,
      executionTimeMs: Date.now() - startTime,
      suggestedNextTools: ['web_search_solution'] // Fallback to web search on error
    });
  }
};

// Mark as implemented
execute._implemented = true;

module.exports = {
  execute,
  TOOL_NAME
};
