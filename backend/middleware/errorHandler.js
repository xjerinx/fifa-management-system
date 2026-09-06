const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

    let statusCode = err.status || 500;
    let message = err.message || 'Internal Server Error';

    // Handle common MySQL / MariaDB error codes
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
        statusCode = 400;
        message = 'Cannot delete or update this record because it is referenced by other records (e.g., players, teams, or matches).';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
        statusCode = 400;
        message = 'Invalid reference: The selected parent record does not exist.';
    } else if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
        statusCode = 409;
        message = 'A record with this information already exists (duplicate entry).';
    } else if (err.code === 'ECONNREFUSED') {
        statusCode = 503;
        message = 'Database connection refused. Please ensure MySQL is running.';
    }

    res.status(statusCode).json({
        success: false,
        message,
    });
};

module.exports = errorHandler;