/**
 * Tag styles configuration
 * Provides consistent styling for tags across the application
 */

// Available tag styles with pastel backgrounds and colored borders/text
export const tagStyles = {
  yellow: { 
    backgroundColor: '#fef9c3', 
    color: '#a16207', 
    borderColor: '#fde047',
    label: 'Yellow'
  },
  blue: { 
    backgroundColor: '#dbeafe', 
    color: '#1d4ed8', 
    borderColor: '#93c5fd',
    label: 'Blue'
  },
  green: { 
    backgroundColor: '#dcfce7', 
    color: '#15803d', 
    borderColor: '#86efac',
    label: 'Green'
  },
  purple: { 
    backgroundColor: '#f3e8ff', 
    color: '#7e22ce', 
    borderColor: '#d8b4fe',
    label: 'Purple'
  },
  orange: { 
    backgroundColor: '#ffedd5', 
    color: '#c2410c', 
    borderColor: '#fdba74',
    label: 'Orange'
  },
  cyan: { 
    backgroundColor: '#cffafe', 
    color: '#0e7490', 
    borderColor: '#67e8f9',
    label: 'Cyan'
  },
  gray: { 
    backgroundColor: '#f3f4f6', 
    color: '#4b5563', 
    borderColor: '#d1d5db',
    label: 'Gray'
  },
  teal: { 
    backgroundColor: '#ccfbf1', 
    color: '#0f766e', 
    borderColor: '#5eead4',
    label: 'Teal'
  },
  indigo: { 
    backgroundColor: '#e0e7ff', 
    color: '#4338ca', 
    borderColor: '#a5b4fc',
    label: 'Indigo'
  },
  red: { 
    backgroundColor: '#fee2e2', 
    color: '#b91c1c', 
    borderColor: '#fca5a5',
    label: 'Red'
  },
  pink: { 
    backgroundColor: '#fce7f3', 
    color: '#be185d', 
    borderColor: '#f9a8d4',
    label: 'Pink'
  }
}

/**
 * Get tag style object for CSS binding
 * @param {string} colorName - The color name (key from tagStyles)
 * @returns {Object} CSS style object
 */
export const getTagStyle = (colorName) => {
  if (!colorName) return {}
  
  const style = tagStyles[colorName]
  if (!style) return {}
  
  return {
    backgroundColor: style.backgroundColor,
    color: style.color,
    border: `1px solid ${style.borderColor}`,
    fontWeight: '500'
  }
}

/**
 * Get list of available tag styles for selectors
 * @returns {Array} Array of { value, label, style } objects
 */
export const getTagStyleOptions = () => {
  return Object.entries(tagStyles).map(([key, style]) => ({
    value: key,
    label: style.label,
    style: getTagStyle(key)
  }))
}

/**
 * Convert color name to CSS color value (for icons, etc.)
 * @param {string} colorName - The color name
 * @returns {string} CSS color value
 */
export const getColorValue = (colorName) => {
  const colorMap = {
    yellow: '#eab308',
    blue: '#3b82f6',
    green: '#22c55e',
    purple: '#a855f7',
    orange: '#f97316',
    cyan: '#06b6d4',
    gray: '#6b7280',
    teal: '#14b8a6',
    indigo: '#6366f1',
    red: '#ef4444',
    pink: '#ec4899'
  }
  return colorMap[colorName] || colorName
}
