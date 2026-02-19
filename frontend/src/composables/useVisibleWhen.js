/**
 * Composable to evaluate `visible_when` expressions on metadata fields.
 *
 * Supported syntax:
 *   - Simple boolean reference: "is_filter_by_role"
 *   - Comparison: "reopen_count > 1", "status == 'open'", "priority != 'low'"
 *   - Logical operators: "is_filter_by_role AND is_filter_by_entity"
 *   - Combined: "status == 'open' AND priority == 'high'"
 *   - Nested with OR: "is_active OR critical_user"
 *   - Mixed: "status == 'open' AND (priority == 'high' OR priority == 'critical')"
 *
 * Operator precedence: AND binds tighter than OR (standard).
 * Parentheses are supported for grouping.
 */

/**
 * Tokenize a visible_when expression string into an array of tokens.
 * Tokens: '(', ')', 'AND', 'OR', comparison operators, field names, literals.
 */
const tokenize = (expr) => {
  const tokens = []
  let i = 0
  const len = expr.length

  while (i < len) {
    // Skip whitespace
    if (/\s/.test(expr[i])) {
      i++
      continue
    }

    // Parentheses
    if (expr[i] === '(' || expr[i] === ')') {
      tokens.push({ type: 'paren', value: expr[i] })
      i++
      continue
    }

    // Comparison operators: ==, !=, >=, <=, >, <
    if (expr[i] === '=' && expr[i + 1] === '=') {
      tokens.push({ type: 'op', value: '==' })
      i += 2
      continue
    }
    if (expr[i] === '!' && expr[i + 1] === '=') {
      tokens.push({ type: 'op', value: '!=' })
      i += 2
      continue
    }
    if (expr[i] === '>' && expr[i + 1] === '=') {
      tokens.push({ type: 'op', value: '>=' })
      i += 2
      continue
    }
    if (expr[i] === '<' && expr[i + 1] === '=') {
      tokens.push({ type: 'op', value: '<=' })
      i += 2
      continue
    }
    if (expr[i] === '>') {
      tokens.push({ type: 'op', value: '>' })
      i++
      continue
    }
    if (expr[i] === '<') {
      tokens.push({ type: 'op', value: '<' })
      i++
      continue
    }

    // String literals: 'value' or "value"
    if (expr[i] === "'" || expr[i] === '"') {
      const quote = expr[i]
      i++
      let str = ''
      while (i < len && expr[i] !== quote) {
        str += expr[i]
        i++
      }
      i++ // skip closing quote
      tokens.push({ type: 'literal', value: str })
      continue
    }

    // Numbers
    if (/[0-9]/.test(expr[i]) || (expr[i] === '-' && /[0-9]/.test(expr[i + 1]))) {
      let num = ''
      if (expr[i] === '-') {
        num += '-'
        i++
      }
      while (i < len && /[0-9.]/.test(expr[i])) {
        num += expr[i]
        i++
      }
      tokens.push({ type: 'literal', value: parseFloat(num) })
      continue
    }

    // Keywords (AND, OR, true, false) and identifiers (field names)
    if (/[a-zA-Z_]/.test(expr[i])) {
      let word = ''
      while (i < len && /[a-zA-Z0-9_]/.test(expr[i])) {
        word += expr[i]
        i++
      }
      if (word === 'AND') {
        tokens.push({ type: 'logic', value: 'AND' })
      } else if (word === 'OR') {
        tokens.push({ type: 'logic', value: 'OR' })
      } else if (word === 'true') {
        tokens.push({ type: 'literal', value: true })
      } else if (word === 'false') {
        tokens.push({ type: 'literal', value: false })
      } else {
        tokens.push({ type: 'ident', value: word })
      }
      continue
    }

    // Unknown character, skip
    i++
  }

  return tokens
}

/**
 * Recursive descent parser for visible_when expressions.
 * Grammar:
 *   expr     → andExpr ( 'OR' andExpr )*
 *   andExpr  → primary ( 'AND' primary )*
 *   primary  → '(' expr ')' | comparison | boolRef
 *   comparison → ident op literal
 *   boolRef  → ident   (evaluates as truthy check)
 */
class Parser {
  constructor(tokens, context) {
    this.tokens = tokens
    this.pos = 0
    this.context = context
  }

  peek() {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null
  }

  consume() {
    return this.tokens[this.pos++]
  }

  parse() {
    if (this.tokens.length === 0) return true
    const result = this.parseOr()
    return result
  }

  parseOr() {
    let left = this.parseAnd()
    while (this.peek()?.type === 'logic' && this.peek()?.value === 'OR') {
      this.consume() // consume OR
      const right = this.parseAnd()
      left = left || right
    }
    return left
  }

  parseAnd() {
    let left = this.parsePrimary()
    while (this.peek()?.type === 'logic' && this.peek()?.value === 'AND') {
      this.consume() // consume AND
      const right = this.parsePrimary()
      left = left && right
    }
    return left
  }

  parsePrimary() {
    const token = this.peek()

    // Parenthesized expression
    if (token?.type === 'paren' && token.value === '(') {
      this.consume() // consume (
      const result = this.parseOr()
      if (this.peek()?.type === 'paren' && this.peek()?.value === ')') {
        this.consume() // consume )
      }
      return result
    }

    // Identifier: could be a comparison or a simple boolean reference
    if (token?.type === 'ident') {
      const ident = this.consume()
      const fieldName = ident.value
      const next = this.peek()

      // Comparison: ident op literal
      if (next?.type === 'op') {
        const op = this.consume()
        const literalToken = this.consume()
        const literalValue = literalToken?.value
        const contextValue = this.context[fieldName]
        return this.compare(contextValue, op.value, literalValue)
      }

      // Simple boolean reference: truthy check
      const val = this.context[fieldName]
      return !!val
    }

    // Literal (standalone true/false)
    if (token?.type === 'literal') {
      this.consume()
      return !!token.value
    }

    // Fallback: skip unknown token
    if (token) this.consume()
    return true
  }

  compare(left, op, right) {
    // Coerce types for comparison
    const l = left ?? null
    const r = right ?? null

    switch (op) {
      case '==': return l == r // eslint-disable-line eqeqeq
      case '!=': return l != r // eslint-disable-line eqeqeq
      case '>': return Number(l) > Number(r)
      case '<': return Number(l) < Number(r)
      case '>=': return Number(l) >= Number(r)
      case '<=': return Number(l) <= Number(r)
      default: return true
    }
  }
}

/**
 * Evaluate a visible_when expression against a context object (the form data).
 *
 * @param {string|null|undefined} expression - The visible_when expression
 * @param {Object} context - The current form data (modelValue)
 * @returns {boolean} - Whether the field should be visible
 */
export const evaluateVisibleWhen = (expression, context) => {
  // No expression means always visible
  if (!expression || typeof expression !== 'string') return true

  try {
    const tokens = tokenize(expression.trim())
    const parser = new Parser(tokens, context || {})
    return parser.parse()
  } catch (error) {
    console.warn(`[useVisibleWhen] Failed to evaluate expression: "${expression}"`, error)
    return true // Default to visible on error
  }
}

/**
 * Composable that provides the evaluateVisibleWhen function.
 * Can be used in components to filter fields based on visible_when expressions.
 */
export function useVisibleWhen() {
  return {
    evaluateVisibleWhen,
  }
}
