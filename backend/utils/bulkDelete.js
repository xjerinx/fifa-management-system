const db = require('../config/db');

/**
 * Executes a bulk deletion inside an atomic MySQL transaction.
 * Handles validation, pre-delete hooks, dynamic SQL escaping, commit, rollback, and connection cleanup.
 *
 * @param {Object} options
 * @param {string} options.tableName - e.g. 'team', 'player', 'coach', 'match'
 * @param {string} options.pkColumn - e.g. 'team_id', 'player_id', 'coach_id', 'match_id'
 * @param {Array<number|string>} options.ids - Primary key IDs to delete
 * @param {Function} [options.beforeDelete] - Optional async hook (conn, ids) to run inside the transaction
 * @param {string} [options.entityLabel] - Optional human-readable entity label for errors (e.g. 'team')
 * @returns {Promise<{ affectedRows: number, count: number }>}
 */
async function bulkDelete({ tableName, pkColumn, ids, beforeDelete, entityLabel }) {
    if (!Array.isArray(ids) || ids.length === 0) {
        const err = new Error('No records selected for deletion.');
        err.status = 400;
        throw err;
    }

    // Filter and sanitize IDs
    const cleanIds = ids
        .map(id => (typeof id === 'string' ? id.trim() : id))
        .filter(id => id !== null && id !== undefined && id !== '');

    if (cleanIds.length === 0) {
        const err = new Error('No valid IDs provided for deletion.');
        err.status = 400;
        throw err;
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Optional pre-delete hook (e.g. unassign coaches before deleting teams)
        if (typeof beforeDelete === 'function') {
            await beforeDelete(conn, cleanIds);
        }

        // Table names (e.g. `match` is a reserved MySQL keyword) and columns must be escaped
        const safeTable = `\`${tableName.replace(/`/g, '')}\``;
        const safeColumn = `\`${pkColumn.replace(/`/g, '')}\``;

        const [result] = await conn.query(
            `DELETE FROM ${safeTable} WHERE ${safeColumn} IN (?)`,
            [cleanIds]
        );

        await conn.commit();
        return {
            affectedRows: result.affectedRows,
            count: cleanIds.length,
        };
    } catch (err) {
        await conn.rollback();

        // Enhance error messages for foreign key restriction violations
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
            const label = entityLabel || tableName;
            const customErr = new Error(
                `Cannot delete selected ${label}(s) because dependent records (e.g. players, matches, or teams) are still linked to them. Please reassign or remove the linked records first.`
            );
            customErr.status = 400;
            customErr.code = err.code;
            customErr.errno = err.errno;
            throw customErr;
        }

        throw err;
    } finally {
        conn.release();
    }
}

module.exports = { bulkDelete };
