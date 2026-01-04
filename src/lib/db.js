import pg from 'pg';

// Create pool - only connects when DATABASE_URL is set
const pool = process.env.DATABASE_URL
    ? new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    })
    : null;

// Log connection status
if (pool) {
    pool.on('connect', () => {
        console.log('📦 PostgreSQL client connected');
    });
    pool.on('error', (err) => {
        console.error('PostgreSQL pool error:', err);
    });
}

/**
 * Execute a query and return rows
 */
export async function query(text, params) {
    if (!pool) {
        throw new Error('DATABASE_URL not configured');
    }
    const result = await pool.query(text, params);
    return result.rows;
}

/**
 * Execute a query and return first row
 */
export async function queryOne(text, params) {
    const rows = await query(text, params);
    return rows[0] || null;
}

/**
 * Execute an insert and return the created row
 */
export async function insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');

    const text = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
    return queryOne(text, values);
}

/**
 * Execute an update and return the updated row
 */
export async function update(table, id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const text = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
    return queryOne(text, [...values, id]);
}

/**
 * Delete a row by id
 */
export async function remove(table, id) {
    const text = `DELETE FROM ${table} WHERE id = $1`;
    await query(text, [id]);
}

/**
 * Check if PostgreSQL is available
 */
export async function isConnected() {
    if (!pool) return false;
    try {
        await pool.query('SELECT 1');
        return true;
    } catch {
        return false;
    }
}

export default pool;
