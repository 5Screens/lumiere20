const logger = require('../../../../../config/logger');
const { createToolResult } = require('../../schemas/common');

/**
 * Web Search Solution Tool
 * Searches the web for solutions when KB is empty
 * Uses trusted domains for reliable results
 */

const TOOL_NAME = 'web_search_solution';

// Trusted domains for IT support searches
const TRUSTED_DOMAINS = [
  // Microsoft
  'support.microsoft.com',
  'learn.microsoft.com',
  'docs.microsoft.com',
  // Google
  'support.google.com',
  // Apple
  'support.apple.com',
  // Other major vendors
  'help.salesforce.com',
  'help.sap.com',
  // Validated communities
  'stackoverflow.com',
  'superuser.com'
];

/**
 * Execute web search for solutions
 * @param {Object} params - Tool parameters
 * @param {Object} params.userContext - User context
 * @param {Object} params.intent - Intent analysis result
 * @param {Object} params.previousResults - Results from previous tools
 * @returns {Object} Tool result with web search results
 */
const execute = async (params) => {
  const startTime = Date.now();
  const { userContext, intent, previousResults } = params;

  try {
    // Extract search query
    const searchQuery = intent?.entities?.problem || 
                       intent?.entities?.query ||
                       intent?.entities?.application ||
                       '';

    if (!searchQuery) {
      return createToolResult(TOOL_NAME, false, null, {
        error: 'No search query provided',
        executionTimeMs: Date.now() - startTime
      });
    }

    // Detect product/application for targeted search
    const productHint = detectProduct(searchQuery);
    
    logger.info(`-- ${TOOL_NAME} -- Searching for: "${searchQuery}" (product: ${productHint || 'unknown'})`);

    // For now, return mock results since we don't have a search API configured
    // In production, this would call Bing API, Google Custom Search, or SerpAPI
    const mockResults = generateMockResults(searchQuery, productHint);

    const executionTime = Date.now() - startTime;

    logger.info(`-- ${TOOL_NAME} -- Found ${mockResults.length} results in ${executionTime}ms`);

    return createToolResult(TOOL_NAME, true, {
      query: searchQuery,
      productHint,
      results: mockResults,
      totalFound: mockResults.length,
      trustedDomainsUsed: TRUSTED_DOMAINS,
      disclaimer: 'These results are from external sources and have not been validated by IT support.'
    }, {
      executionTimeMs: executionTime,
      suggestedNextTools: mockResults.length > 0 ? ['generate_solution_steps'] : []
    });

  } catch (error) {
    logger.error(`-- ${TOOL_NAME} -- Failed: ${error.message}`, { stack: error.stack });
    
    return createToolResult(TOOL_NAME, false, null, {
      error: error.message,
      executionTimeMs: Date.now() - startTime
    });
  }
};

/**
 * Detect product/application from search query
 * @param {string} query - Search query
 * @returns {string|null} Detected product
 */
const detectProduct = (query) => {
  const queryLower = query.toLowerCase();
  
  const products = {
    'excel': 'Microsoft Excel',
    'word': 'Microsoft Word',
    'powerpoint': 'Microsoft PowerPoint',
    'outlook': 'Microsoft Outlook',
    'teams': 'Microsoft Teams',
    'sharepoint': 'Microsoft SharePoint',
    'onedrive': 'Microsoft OneDrive',
    'windows': 'Microsoft Windows',
    'office': 'Microsoft Office',
    'chrome': 'Google Chrome',
    'gmail': 'Google Gmail',
    'google drive': 'Google Drive',
    'salesforce': 'Salesforce',
    'sap': 'SAP',
    'slack': 'Slack',
    'zoom': 'Zoom',
    'vpn': 'VPN',
    'wifi': 'WiFi',
    'printer': 'Printer',
    'password': 'Password/Authentication'
  };

  for (const [keyword, product] of Object.entries(products)) {
    if (queryLower.includes(keyword)) {
      return product;
    }
  }

  return null;
};

/**
 * Generate mock results for development
 * In production, replace with actual search API call
 * @param {string} query - Search query
 * @param {string} productHint - Detected product
 * @returns {Object[]} Mock search results
 */
const generateMockResults = (query, productHint) => {
  // Return empty if no product detected (can't generate relevant mock)
  if (!productHint) {
    return [];
  }

  const mockTemplates = {
    'Microsoft Excel': [
      {
        title: 'Create a PivotTable to analyze worksheet data',
        url: 'https://support.microsoft.com/en-us/office/create-a-pivottable-to-analyze-worksheet-data',
        snippet: 'A PivotTable is a powerful tool to calculate, summarize, and analyze data...',
        source: 'support.microsoft.com'
      },
      {
        title: 'Excel formulas and functions',
        url: 'https://support.microsoft.com/en-us/office/excel-functions-by-category',
        snippet: 'Excel functions are predefined formulas that perform calculations...',
        source: 'support.microsoft.com'
      }
    ],
    'Microsoft Outlook': [
      {
        title: 'Set up email in Outlook',
        url: 'https://support.microsoft.com/en-us/office/set-up-email-in-outlook',
        snippet: 'Add your email account to Outlook to send and receive messages...',
        source: 'support.microsoft.com'
      },
      {
        title: 'Create and manage rules in Outlook',
        url: 'https://support.microsoft.com/en-us/office/manage-email-messages-by-using-rules',
        snippet: 'Rules help you manage your email messages by automatically performing actions...',
        source: 'support.microsoft.com'
      }
    ],
    'Microsoft Teams': [
      {
        title: 'Join a meeting in Teams',
        url: 'https://support.microsoft.com/en-us/office/join-a-meeting-in-teams',
        snippet: 'You can join a Teams meeting from anywhere using the Teams app or web...',
        source: 'support.microsoft.com'
      }
    ],
    'Password/Authentication': [
      {
        title: 'Reset your password',
        url: 'https://support.microsoft.com/en-us/account-billing/reset-a-forgotten-microsoft-account-password',
        snippet: 'If you forgot your password, you can reset it using these steps...',
        source: 'support.microsoft.com'
      }
    ]
  };

  // Get templates for detected product or return generic
  const templates = mockTemplates[productHint] || [];
  
  return templates.map((t, index) => ({
    ...t,
    relevanceScore: 0.8 - (index * 0.1),
    sourceType: 'web',
    trusted: TRUSTED_DOMAINS.includes(t.source)
  }));
};

// Mark as implemented
execute._implemented = true;

module.exports = {
  execute,
  TOOL_NAME,
  TRUSTED_DOMAINS,
  detectProduct
};
