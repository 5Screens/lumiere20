/**
 * Tag styles configuration
 * Provides consistent styling for tags across the application
 * 50 color variations organized by hue
 */

// Available tag styles with pastel backgrounds and colored borders/text
export const tagStyles = {
  // Reds (5)
  red: { backgroundColor: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5', label: 'Red' },
  redLight: { backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fecaca', label: 'Red Light' },
  redDark: { backgroundColor: '#fecaca', color: '#991b1b', borderColor: '#f87171', label: 'Red Dark' },
  rose: { backgroundColor: '#ffe4e6', color: '#be123c', borderColor: '#fda4af', label: 'Rose' },
  roseDark: { backgroundColor: '#fecdd3', color: '#9f1239', borderColor: '#fb7185', label: 'Rose Dark' },

  // Oranges (5)
  orange: { backgroundColor: '#ffedd5', color: '#c2410c', borderColor: '#fdba74', label: 'Orange' },
  orangeLight: { backgroundColor: '#fff7ed', color: '#ea580c', borderColor: '#fed7aa', label: 'Orange Light' },
  orangeDark: { backgroundColor: '#fed7aa', color: '#9a3412', borderColor: '#fb923c', label: 'Orange Dark' },
  amber: { backgroundColor: '#fef3c7', color: '#b45309', borderColor: '#fcd34d', label: 'Amber' },
  amberDark: { backgroundColor: '#fde68a', color: '#92400e', borderColor: '#fbbf24', label: 'Amber Dark' },

  // Yellows (5)
  yellow: { backgroundColor: '#fef9c3', color: '#a16207', borderColor: '#fde047', label: 'Yellow' },
  yellowLight: { backgroundColor: '#fefce8', color: '#ca8a04', borderColor: '#fef08a', label: 'Yellow Light' },
  yellowDark: { backgroundColor: '#fef08a', color: '#854d0e', borderColor: '#facc15', label: 'Yellow Dark' },
  lime: { backgroundColor: '#ecfccb', color: '#4d7c0f', borderColor: '#bef264', label: 'Lime' },
  limeDark: { backgroundColor: '#d9f99d', color: '#3f6212', borderColor: '#a3e635', label: 'Lime Dark' },

  // Greens (5)
  green: { backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#86efac', label: 'Green' },
  greenLight: { backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0', label: 'Green Light' },
  greenDark: { backgroundColor: '#bbf7d0', color: '#166534', borderColor: '#4ade80', label: 'Green Dark' },
  emerald: { backgroundColor: '#d1fae5', color: '#047857', borderColor: '#6ee7b7', label: 'Emerald' },
  emeraldDark: { backgroundColor: '#a7f3d0', color: '#065f46', borderColor: '#34d399', label: 'Emerald Dark' },

  // Teals (5)
  teal: { backgroundColor: '#ccfbf1', color: '#0f766e', borderColor: '#5eead4', label: 'Teal' },
  tealLight: { backgroundColor: '#f0fdfa', color: '#0d9488', borderColor: '#99f6e4', label: 'Teal Light' },
  tealDark: { backgroundColor: '#99f6e4', color: '#115e59', borderColor: '#2dd4bf', label: 'Teal Dark' },
  cyan: { backgroundColor: '#cffafe', color: '#0e7490', borderColor: '#67e8f9', label: 'Cyan' },
  cyanDark: { backgroundColor: '#a5f3fc', color: '#155e75', borderColor: '#22d3ee', label: 'Cyan Dark' },

  // Blues (5)
  blue: { backgroundColor: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd', label: 'Blue' },
  blueLight: { backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe', label: 'Blue Light' },
  blueDark: { backgroundColor: '#bfdbfe', color: '#1e40af', borderColor: '#60a5fa', label: 'Blue Dark' },
  sky: { backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#7dd3fc', label: 'Sky' },
  skyDark: { backgroundColor: '#bae6fd', color: '#075985', borderColor: '#38bdf8', label: 'Sky Dark' },

  // Indigos (5)
  indigo: { backgroundColor: '#e0e7ff', color: '#4338ca', borderColor: '#a5b4fc', label: 'Indigo' },
  indigoLight: { backgroundColor: '#eef2ff', color: '#4f46e5', borderColor: '#c7d2fe', label: 'Indigo Light' },
  indigoDark: { backgroundColor: '#c7d2fe', color: '#3730a3', borderColor: '#818cf8', label: 'Indigo Dark' },
  violet: { backgroundColor: '#ede9fe', color: '#6d28d9', borderColor: '#c4b5fd', label: 'Violet' },
  violetDark: { backgroundColor: '#ddd6fe', color: '#5b21b6', borderColor: '#a78bfa', label: 'Violet Dark' },

  // Purples (5)
  purple: { backgroundColor: '#f3e8ff', color: '#7e22ce', borderColor: '#d8b4fe', label: 'Purple' },
  purpleLight: { backgroundColor: '#faf5ff', color: '#9333ea', borderColor: '#e9d5ff', label: 'Purple Light' },
  purpleDark: { backgroundColor: '#e9d5ff', color: '#6b21a8', borderColor: '#c084fc', label: 'Purple Dark' },
  fuchsia: { backgroundColor: '#fae8ff', color: '#a21caf', borderColor: '#f0abfc', label: 'Fuchsia' },
  fuchsiaDark: { backgroundColor: '#f5d0fe', color: '#86198f', borderColor: '#e879f9', label: 'Fuchsia Dark' },

  // Pinks (5)
  pink: { backgroundColor: '#fce7f3', color: '#be185d', borderColor: '#f9a8d4', label: 'Pink' },
  pinkLight: { backgroundColor: '#fdf2f8', color: '#db2777', borderColor: '#fbcfe8', label: 'Pink Light' },
  pinkDark: { backgroundColor: '#fbcfe8', color: '#9d174d', borderColor: '#f472b6', label: 'Pink Dark' },
  hotPink: { backgroundColor: '#ffe4ec', color: '#c026d3', borderColor: '#f9a8d4', label: 'Hot Pink' },
  magenta: { backgroundColor: '#fce7f3', color: '#c026d3', borderColor: '#f0abfc', label: 'Magenta' },

  // Grays & Neutrals (5)
  gray: { backgroundColor: '#f3f4f6', color: '#4b5563', borderColor: '#d1d5db', label: 'Gray' },
  grayLight: { backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb', label: 'Gray Light' },
  grayDark: { backgroundColor: '#e5e7eb', color: '#374151', borderColor: '#9ca3af', label: 'Gray Dark' },
  slate: { backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1', label: 'Slate' },
  slateDark: { backgroundColor: '#e2e8f0', color: '#334155', borderColor: '#94a3b8', label: 'Slate Dark' }
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
