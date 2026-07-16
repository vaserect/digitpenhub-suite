/**
 * Secure Query Builder Utilities
 * 
 * Provides helper functions for building dynamic SQL queries safely
 * without SQL injection vulnerabilities.
 */

/**
 * Escapes special characters in LIKE patterns to prevent pattern injection
 * @param {string} str - The string to escape
 * @returns {string} - Escaped string safe for LIKE patterns
 */
function escapeLikePattern(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[%_\\]/g, '\\$&');
}

/**
 * Builds a safe UPDATE query with parameterized values
 * 
 * @param {string} table - Table name
 * @param {Object} updates - Object with column names as keys and values to update
 * @param {Object} where - Object with WHERE clause conditions
 * @param {number} startIndex - Starting parameter index (default: 1)
 * @returns {Object} - { query: string, values: array }
 * 
 * @example
 * const { query, values } = buildUpdateQuery(
 *   'users',
 *   { name: 'John', email: 'john@example.com' },
 *   { id: 123, org_id: 456 }
 * );
 * // query: "UPDATE users SET name = $1, email = $2 WHERE id = $3 AND org_id = $4"
 * // values: ['John', 'john@example.com', 123, 456]
 */
function buildUpdateQuery(table, updates, where, startIndex = 1) {
  const values = [];
  const setClauses = [];
  let paramIndex = startIndex;

  // Build SET clauses
  for (const [column, value] of Object.entries(updates)) {
    if (value !== undefined) {
      setClauses.push(`${column} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    throw new Error('No columns to update');
  }

  // Build WHERE clauses
  const whereClauses = [];
  for (const [column, value] of Object.entries(where)) {
    whereClauses.push(`${column} = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  }

  if (whereClauses.length === 0) {
    throw new Error('WHERE clause is required for UPDATE queries');
  }

  const query = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE ${whereClauses.join(' AND ')} RETURNING *`;

  return { query, values };
}

/**
 * Builds a safe SELECT query with dynamic WHERE conditions
 * 
 * @param {string} table - Table name
 * @param {string[]} columns - Columns to select (default: ['*'])
 * @param {Object} where - Object with WHERE clause conditions
 * @param {Object} options - Additional options (orderBy, limit, offset)
 * @returns {Object} - { query: string, values: array }
 * 
 * @example
 * const { query, values } = buildSelectQuery(
 *   'tasks',
 *   ['id', 'title', 'status'],
 *   { org_id: 123, status: 'active' },
 *   { orderBy: 'created_at DESC', limit: 10 }
 * );
 */
function buildSelectQuery(table, columns = ['*'], where = {}, options = {}) {
  const values = [];
  const whereClauses = [];
  let paramIndex = 1;

  // Build WHERE clauses
  for (const [column, value] of Object.entries(where)) {
    if (value !== undefined) {
      whereClauses.push(`${column} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  let query = `SELECT ${columns.join(', ')} FROM ${table}`;

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  if (options.orderBy) {
    query += ` ORDER BY ${options.orderBy}`;
  }

  if (options.limit) {
    query += ` LIMIT $${paramIndex}`;
    values.push(options.limit);
    paramIndex++;
  }

  if (options.offset) {
    query += ` OFFSET $${paramIndex}`;
    values.push(options.offset);
    paramIndex++;
  }

  return { query, values };
}

/**
 * Builds a safe INSERT query
 * 
 * @param {string} table - Table name
 * @param {Object} data - Object with column names as keys and values to insert
 * @returns {Object} - { query: string, values: array }
 * 
 * @example
 * const { query, values } = buildInsertQuery(
 *   'tasks',
 *   { title: 'New Task', status: 'todo', org_id: 123 }
 * );
 */
function buildInsertQuery(table, data) {
  const columns = [];
  const values = [];
  const placeholders = [];
  let paramIndex = 1;

  for (const [column, value] of Object.entries(data)) {
    if (value !== undefined) {
      columns.push(column);
      values.push(value);
      placeholders.push(`$${paramIndex}`);
      paramIndex++;
    }
  }

  if (columns.length === 0) {
    throw new Error('No columns to insert');
  }

  const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;

  return { query, values };
}

/**
 * Validates and sanitizes email addresses
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates URL and checks against allowed domains
 * @param {string} url - URL to validate
 * @param {string[]} allowedDomains - Optional list of allowed domains
 * @returns {boolean} - True if valid
 */
function isValidUrl(url, allowedDomains = null) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    
    // Block localhost and private IPs to prevent SSRF
    const hostname = urlObj.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.20.') ||
        hostname.startsWith('172.21.') ||
        hostname.startsWith('172.22.') ||
        hostname.startsWith('172.23.') ||
        hostname.startsWith('172.24.') ||
        hostname.startsWith('172.25.') ||
        hostname.startsWith('172.26.') ||
        hostname.startsWith('172.27.') ||
        hostname.startsWith('172.28.') ||
        hostname.startsWith('172.29.') ||
        hostname.startsWith('172.30.') ||
        hostname.startsWith('172.31.')) {
      return false;
    }
    
    // Check allowed domains if provided
    if (allowedDomains && Array.isArray(allowedDomains)) {
      return allowedDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain));
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates phone number format (basic validation)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  // Basic validation: 10-15 digits, optional + prefix, spaces/dashes allowed
  const phoneRegex = /^\+?[\d\s\-()]{10,15}$/;
  return phoneRegex.test(phone.trim());
}

module.exports = {
  escapeLikePattern,
  buildUpdateQuery,
  buildSelectQuery,
  buildInsertQuery,
  isValidEmail,
  isValidUrl,
  isValidPhone,
};
