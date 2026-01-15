/**
 * Knowledge Base Tools
 * Tools for searching and retrieving knowledge articles
 */

const prisma = require('../../../../config/prisma');
const logger = require('../../../../config/logger');
const mistralClient = require('../mistral.client');

/**
 * Search the knowledge base for articles
 * @param {Object} args - Tool arguments
 * @param {Object} context - Execution context
 * @returns {Object} Search results
 */
const searchKnowledgeBase = async (args, context) => {
  const { query, limit = 5 } = args;
  const { locale = 'en' } = context;

  logger.info(`-- knowledge-tools -- searchKnowledgeBase: query="${query}", limit=${limit}`);

  // Search in tickets with type KNOWLEDGE
  // Search in title, description, and extended_core_fields (summary, keywords)
  const articles = await prisma.tickets.findMany({
    where: {
      ticket_type_code: 'KNOWLEDGE',
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: limit,
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
          code: true,
          label: true
        }
      }
    }
  });

  // If no results found with simple search, try keyword-based search
  if (articles.length === 0) {
    // Split query into keywords and search
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
    
    if (keywords.length > 0) {
      const keywordArticles = await prisma.tickets.findMany({
        where: {
          ticket_type_code: 'KNOWLEDGE',
          OR: keywords.map(keyword => ({
            OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { description: { contains: keyword, mode: 'insensitive' } }
            ]
          }))
        },
        take: limit,
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
              code: true,
              label: true
            }
          }
        }
      });

      if (keywordArticles.length > 0) {
        return formatArticleResults(keywordArticles, query);
      }
    }

    // No results in KB - indicate that LLM should answer directly
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

  return formatArticleResults(articles, query);
};

/**
 * Format article results for display
 */
const formatArticleResults = (articles, query) => {
  const formattedArticles = articles.map(a => {
    const extFields = a.extended_core_fields || {};
    return {
      uuid: a.uuid,
      title: a.title,
      summary: extFields.summary || a.description?.substring(0, 200) || '',
      keywords: extFields.keywords || [],
      status: a.status?.label || 'Published',
      updated_at: a.updated_at.toISOString().split('T')[0]
    };
  });

  return {
    found: true,
    count: formattedArticles.length,
    articles: formattedArticles,
    message: `Found ${formattedArticles.length} article(s) matching your query.`
  };
};

/**
 * Get the full content of a knowledge article
 * @param {Object} args - Tool arguments
 * @param {Object} context - Execution context
 * @returns {Object} Article content
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
      created_at: true,
      updated_at: true,
      writer: {
        select: { first_name: true, last_name: true }
      }
    }
  });

  if (!article || article.ticket_type_code !== 'KNOWLEDGE') {
    return {
      found: false,
      message: 'Article not found.'
    };
  }

  const extFields = article.extended_core_fields || {};

  return {
    found: true,
    article: {
      uuid: article.uuid,
      title: article.title,
      summary: extFields.summary || '',
      content: article.description || '',
      prerequisites: extFields.prerequisites || null,
      limitations: extFields.limitations || null,
      security_notes: extFields.security_notes || null,
      keywords: extFields.keywords || [],
      version: extFields.version || '1.0',
      author: article.writer 
        ? `${article.writer.first_name} ${article.writer.last_name}`
        : 'Unknown',
      last_updated: article.updated_at.toISOString().split('T')[0]
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
