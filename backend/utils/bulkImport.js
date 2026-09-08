const db = require('../config/db');

/**
 * Executes a bulk insert inside an atomic MySQL transaction.
 * Automatically aligns row objects to allowed database columns, defaults missing fields to NULL,
 * excludes extra unrecognized columns, and executes a batch INSERT.
 *
 * @param {Object} options
 * @param {string} options.tableName - Target table name (e.g. 'player', 'team', 'match')
 * @param {string[]} options.columns - Allowed database column names
 * @param {Array<Object>} options.rows - Array of plain objects representing rows
 * @param {Function} [options.transformRow] - Optional hook (row) => transformedRow
 * @returns {Promise<{ count: number, affectedRows: number }>}
 */
async function bulkImport({ tableName, columns, rows, transformRow }) {
    if (!Array.isArray(rows) || rows.length === 0) {
        const err = new Error('No rows provided for import.');
        err.status = 400;
        throw err;
    }

    if (!Array.isArray(columns) || columns.length === 0) {
        const err = new Error('No columns defined for bulk import.');
        err.status = 500;
        throw err;
    }

    // Process and sanitize rows according to allowed columns
    const matrix = [];
    for (const rawRow of rows) {
        if (!rawRow || typeof rawRow !== 'object') continue;

        let row = rawRow;
        if (typeof transformRow === 'function') {
            row = transformRow(rawRow);
            if (!row) continue;
        }

        // Check if row has at least one non-empty value
        const hasValues = Object.values(row).some(
            v => v !== null && v !== undefined && String(v).trim() !== ''
        );
        if (!hasValues) continue;

        const rowValues = columns.map(col => {
            let val = row[col];
            if (val === undefined || val === null || val === '') {
                return null;
            }
            if (typeof val === 'string') {
                val = val.trim();
                return val === '' ? null : val;
            }
            return val;
        });

        matrix.push(rowValues);
    }

    if (matrix.length === 0) {
        const err = new Error('No valid records could be extracted from the import payload.');
        err.status = 400;
        throw err;
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const safeTable = `\`${tableName.replace(/`/g, '')}\``;
        const safeColumns = columns.map(col => `\`${col.replace(/`/g, '')}\``).join(', ');

        const sql = `INSERT INTO ${safeTable} (${safeColumns}) VALUES ?`;
        const [result] = await conn.query(sql, [matrix]);

        await conn.commit();

        return {
            count: matrix.length,
            affectedRows: result.affectedRows,
        };
    } catch (err) {
        await conn.rollback();

        // Check for specific duplicate key or foreign key constraint error
        if (err.code === 'ER_DUP_ENTRY') {
            const customErr = new Error(`Import failed due to duplicate entry: ${err.sqlMessage || err.message}`);
            customErr.status = 400;
            customErr.code = err.code;
            throw customErr;
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
            const customErr = new Error(`Import failed: referenced record (foreign key) does not exist: ${err.sqlMessage || err.message}`);
            customErr.status = 400;
            customErr.code = err.code;
            throw customErr;
        }

        throw err;
    } finally {
        conn.release();
    }
}

module.exports = { bulkImport };
