/**
 * Knowledge Base Tools
 * Tools for searching and retrieving knowledge articles
 */

const prisma = require('../../../../config/prisma');
const logger = require('../../../../config/logger');
const mistralClient = require('../mistral.client');

/**
 * Search the knowledge base for articles
 * Searches in title, description, and extended_core_fields (summary, keywords)
 * @param {Object} args - Tool arguments
 * @param {Object} context - Execution context
 * @returns {Object} Search results with raw article data for LLM processing
 */
const searchKnowledgeBase = async (args, context) => {
  const { query, limit = 5 } = args;
  const { locale = 'en' } = context;

  logger.info(`-- knowledge-tools -- searchKnowledgeBase: query="${query}", limit=${limit}`);

  // Get all KNOWLEDGE articles first, then filter in JS for extended_core_fields search
  const allArticles = await prisma.tickets.findMany({
    where: {
      ticket_type_code: 'KNOWLEDGE'
    },
    orderBy: { updated_at: 'desc' },
    select: {
      uuid: true,
      title: true,
      description: true,
      extended_core_fields: true,
      created_at: true,
      updated_at: true,
      status: {
        select: {
          name: true
        }
      },
      writer: {
        select: { first_name: true, last_name: true }
      }
    }
  });

  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter(k => k.length > 2);

  // Score and filter articles based on matches in title, description, and extended_core_fields
  const scoredArticles = allArticles.map(article => {
    let score = 0;
    const extFields = article.extended_core_fields || {};
    const titleLower = (article.title || '').toLowerCase();
    const descLower = (article.description || '').toLowerCase();
    const summaryLower = (extFields.summary || '').toLowerCase();
    const keywordsArray = extFields.keywords || [];
    const keywordsLower = keywordsArray.map(k => k.toLowerCase());

    // Full query match (higher score)
    if (titleLower.includes(queryLower)) score += 10;
    if (descLower.includes(queryLower)) score += 5;
    if (summaryLower.includes(queryLower)) score += 7;

    // Keyword matches
    for (const kw of keywords) {
      if (titleLower.includes(kw)) score += 3;
      if (descLower.includes(kw)) score += 1;
      if (summaryLower.includes(kw)) score += 2;
      if (keywordsLower.some(k => k.includes(kw))) score += 4;
    }

    return { ...article, score };
  });

  // Filter articles with score > 0 and sort by score descending
  const matchedArticles = scoredArticles
    .filter(a => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (matchedArticles.length === 0) {
    logger.info(`-- knowledge-tools -- No KB results for "${query}", will use LLM fallback`);
    return {
      found: false,
      count: 0,
      articles: [],
      message: 'No articles found in the knowledge base for this query.',
      useLlmFallback: true,
      originalQuery: query
    };
  }

  // Return raw article data for LLM to process
  const articles = matchedArticles.map(a => ({
    uuid: a.uuid,
    title: a.title,
    description: a.description,
    extended_core_fields: a.extended_core_fields,
    status: a.status?.name || 'Published',
    author: a.writer ? `${a.writer.first_name} ${a.writer.last_name}` : null,
    updated_at: a.updated_at.toISOString().split('T')[0]
  }));

  logger.info(`-- knowledge-tools -- Found ${articles.length} article(s) for "${query}"`);

  return {
    found: true,
    count: articles.length,
    articles,
    message: `Found ${articles.length} article(s) matching your query.`
  };
};


/**
 * Get the full content of a knowledge article
 * Returns raw article data for LLM to process
 * @param {Object} args - Tool arguments
 * @param {Object} context - Execution context
 * @returns {Object} Raw article content
 */
const getArticleContent = async (args, context) => {
  const { article_uuid } = args;

  logger.info(`-- knowledge-tools -- getArticleContent: uuid=${article_uuid}`);

  const article = await prisma.tickets.findUnique({
    where: { uuid: article_uuid },
    select: {
      uuid: true,
      title: true,
      description: true,
      extended_core_fields: true,
      ticket_type_code: true,
      created_at: true,
      updated_at: true,
      writer: {
        select: { first_name: true, last_name: true }
      },
      status: {
        select: { name: true }
      }
    }
  });

  if (!article || article.ticket_type_code !== 'KNOWLEDGE') {
    return {
      found: false,
      message: 'Article not found.'
    };
  }

  // Return raw article data - LLM will format the response
  return {
    found: true,
    article: {
      uuid: article.uuid,
      title: article.title,
      description: article.description,
      extended_core_fields: article.extended_core_fields,
      status: article.status?.name || 'Published',
      author: article.writer 
        ? `${article.writer.first_name} ${article.writer.last_name}`
        : null,
      created_at: article.created_at.toISOString().split('T')[0],
      updated_at: article.updated_at.toISOString().split('T')[0]
    }
  };
};

/**
 * Direct LLM query when KB has no results
 * @param {string} query - User's original question
 * @param {Object} context - Execution context
 * @returns {Object} LLM response
 */
const directLlmQuery = async (query, context) => {
  const { locale = 'en' } = context;

  logger.info(`-- knowledge-tools -- directLlmQuery: "${query.substring(0, 50)}..."`);

  const languageInstructions = {
    fr: 'Réponds en français.',
    en: 'Respond in English.',
    es: 'Responde en español.',
    pt: 'Responda em português.',
    de: 'Antworte auf Deutsch.'
  };

  const systemPrompt = `You are a helpful IT support assistant. Answer the user's question based on your general knowledge about IT and technology.
${languageInstructions[locale] || languageInstructions.en}
Be concise and practical. If you're not sure about something, say so.
Format your response with markdown for readability.`;

  try {
    const response = await mistralClient.chatCompletion({
      systemPrompt,
      messages: [{ role: 'user', content: query }],
      options: { temperature: 0.7, maxTokens: 1024 }
    });

    return {
      success: true,
      response: response.content,
      source: 'llm_general_knowledge'
    };
  } catch (error) {
    logger.error(`-- knowledge-tools -- directLlmQuery failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  searchKnowledgeBase,
  getArticleContent,
  directLlmQuery
};
