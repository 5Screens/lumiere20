const logger = require('../../../../../config/logger');
const llmClient = require('../../utils/llm-client');
const { createToolResult } = require('../../schemas/common');

/**
 * Generate Solution Steps Tool
 * Uses LLM to generate step-by-step solution from search results
 */

const TOOL_NAME = 'generate_solution_steps';

const SYSTEM_PROMPT = `You are an IT support assistant that generates clear, step-by-step solutions.

Based on the search results provided, create a helpful solution guide for the user.

Guidelines:
- Write clear, numbered steps
- Use simple language
- Include any warnings or prerequisites
- If the source is from the web (not internal KB), mention this
- If you're not confident about the solution, say so
- Use the user's language (French or English based on context)

Respond with JSON:
{
  "title": "Solution title",
  "steps": [
    {"step": 1, "instruction": "First step...", "note": "optional note"},
    {"step": 2, "instruction": "Second step..."}
  ],
  "prerequisites": ["Any prerequisites"],
  "warnings": ["Any warnings"],
  "confidence": 0.0 to 1.0,
  "sourceDisclaimer": "Disclaimer if using external sources"
}`;

/**
 * Execute solution generation
 * @param {Object} params - Tool parameters
 * @param {Object} params.previousResults - Results from previous tools (search results)
 * @param {Object} params.userContext - User context
 * @param {Object} params.intent - Intent analysis result
 * @returns {Object} Tool result with generated solution
 */
const execute = async (params) => {
  const startTime = Date.now();
  const { previousResults, userContext, intent } = params;

  try {
    // Get search results from previous tools
    const searchResults = extractSearchResults(previousResults);
    
    if (!searchResults || searchResults.length === 0) {
      return createToolResult(TOOL_NAME, false, null, {
        error: 'No search results available to generate solution',
        executionTimeMs: Date.now() - startTime
      });
    }

    const locale = userContext?.locale || 'fr';
    const query = intent?.entities?.problem || 'the user problem';

    // Build context for LLM
    const searchContext = searchResults.map((r, i) => 
      `Source ${i + 1} (${r.sourceType || 'unknown'}): ${r.title}\n${r.snippet || r.description || ''}`
    ).join('\n\n');

    const messages = [
      {
        role: 'user',
        content: `User problem: "${query}"

Search results:
${searchContext}

Generate a step-by-step solution in ${locale === 'fr' ? 'French' : 'English'}.`
      }
    ];

    // Call LLM
    const response = await llmClient.chatCompletion({
      systemPrompt: SYSTEM_PROMPT,
      messages,
      options: {
        temperature: 0.5,
        maxTokens: 1500
      }
    });

    // Parse response
    const solution = llmClient.parseJsonResponse(response.content);

    // Validate and normalize
    const normalizedSolution = normalizeSolution(solution, searchResults);

    const executionTime = Date.now() - startTime;

    logger.info(`Solution generated in ${executionTime}ms with ${normalizedSolution.steps.length} steps`);

    return createToolResult(TOOL_NAME, true, normalizedSolution, {
      executionTimeMs: executionTime,
      suggestedNextTools: normalizedSolution.confidence < 0.5 ? ['ask_clarifying_question'] : []
    });

  } catch (error) {
    logger.error(`Solution generation failed: ${error.message}`, { stack: error.stack });
    
    return createToolResult(TOOL_NAME, false, null, {
      error: error.message,
      executionTimeMs: Date.now() - startTime
    });
  }
};

/**
 * Extract search results from previous tool results
 * @param {Object[]} previousResults - Previous tool results
 * @returns {Object[]} Search results
 */
const extractSearchResults = (previousResults) => {
  if (!previousResults || !Array.isArray(previousResults)) {
    return [];
  }

  const results = [];

  for (const toolResult of previousResults) {
    if (toolResult.success && toolResult.data?.results) {
      results.push(...toolResult.data.results);
    }
  }

  return results;
};

/**
 * Normalize and validate solution
 * @param {Object} solution - Raw solution from LLM
 * @param {Object[]} searchResults - Original search results
 * @returns {Object} Normalized solution
 */
const normalizeSolution = (solution, searchResults) => {
  // Check if any source is from web (not internal KB)
  const hasWebSources = searchResults.some(r => r.sourceType === 'web' || r.source === 'web');

  return {
    title: solution.title || 'Solution',
    steps: (solution.steps || []).map((s, i) => ({
      step: s.step || i + 1,
      instruction: s.instruction || s.text || '',
      note: s.note || null
    })),
    prerequisites: solution.prerequisites || [],
    warnings: solution.warnings || [],
    confidence: Math.max(0, Math.min(1, parseFloat(solution.confidence) || 0.5)),
    sourceDisclaimer: hasWebSources 
      ? (solution.sourceDisclaimer || 'This solution is based on external sources and has not been validated by IT support.')
      : null,
    sources: searchResults.map(r => ({
      title: r.title,
      url: r.url,
      type: r.sourceType || 'kb'
    }))
  };
};

// Mark as implemented
execute._implemented = true;

module.exports = {
  execute,
  TOOL_NAME
};
