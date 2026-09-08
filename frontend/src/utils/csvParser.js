/**
 * Pure client-side RFC 4180 CSV parser.
 * Handles quoted fields, escaped quotes, multiline content, UTF-8 BOM, CRLF/LF line endings.
 *
 * @param {string} text - Raw CSV content
 * @returns {string[][]} Array of string rows
 */
export function parseCSV(text) {
  if (!text || typeof text !== 'string') return [];

  // Strip UTF-8 BOM if present
  let cleanText = text.replace(/^\uFEFF/, '');

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const len = cleanText.length;

  while (i < len) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // Skip \n in CRLF
        }
        currentRow.push(currentField.trim());
        currentField = '';
        // Only push row if it contains non-empty data
        if (currentRow.some(c => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(c => c !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push final field and row if any
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes a column name by removing special characters, spaces, and converting to lowercase.
 */
export function normalizeColumnKey(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[\s_\-–—()[\]{}.:;'"/\\]+/g, '')
    .trim();
}

/**
 * Maps parsed CSV rows to an entity schema.
 * - Matches column headers via aliases.
 * - Missing columns are populated as null.
 * - Extra columns not in schema are ignored.
 *
 * @param {string[][]} csvMatrix - Output of parseCSV (first row is headers)
 * @param {Object} entitySchema - Schema definition with fields: [{ key, label, aliases, type, default }]
 * @returns {Object} Mapped result
 */
export function mapCSVToSchema(csvMatrix, entitySchema) {
  if (!csvMatrix || csvMatrix.length === 0) {
    return {
      rows: [],
      matchedColumns: [],
      missingColumns: entitySchema.fields || [],
      ignoredColumns: [],
      totalRows: 0,
    };
  }

  const rawHeaders = csvMatrix[0] || [];
  const dataRows = csvMatrix.slice(1);
  const fields = entitySchema.fields || [];

  // Map each schema field to its CSV column index if found
  const fieldMapping = {}; // schemaKey -> csvColIndex
  const matchedCsvIndices = new Set();

  fields.forEach(field => {
    const candidateKeys = [
      normalizeColumnKey(field.key),
      normalizeColumnKey(field.label),
      ...(field.aliases || []).map(normalizeColumnKey),
    ];

    let foundIdx = -1;
    for (let c = 0; c < rawHeaders.length; c++) {
      const normHeader = normalizeColumnKey(rawHeaders[c]);
      if (candidateKeys.includes(normHeader)) {
        foundIdx = c;
        break;
      }
    }

    if (foundIdx !== -1) {
      fieldMapping[field.key] = foundIdx;
      matchedCsvIndices.add(foundIdx);
    }
  });

  const matchedColumns = fields.filter(f => fieldMapping[f.key] !== undefined);
  const missingColumns = fields.filter(f => fieldMapping[f.key] === undefined);
  const ignoredColumns = rawHeaders.filter((_, idx) => !matchedCsvIndices.has(idx));

  // Process data rows
  const mappedRows = [];
  for (const rowCells of dataRows) {
    // Skip empty lines
    if (!rowCells.some(cell => cell && cell.trim() !== '')) continue;

    const rowObj = {};
    for (const field of fields) {
      const colIdx = fieldMapping[field.key];
      if (colIdx !== undefined && colIdx < rowCells.length) {
        let val = rowCells[colIdx];
        if (val === undefined || val === null || val.trim() === '' || val.toUpperCase() === 'NULL') {
          rowObj[field.key] = field.default !== undefined ? field.default : null;
        } else {
          val = val.trim();
          if (field.type === 'number' || field.type === 'integer') {
            const num = parseInt(val.replace(/[^0-9.-]/g, ''), 10);
            rowObj[field.key] = isNaN(num) ? (field.default !== undefined ? field.default : null) : num;
          } else if (field.type === 'float') {
            const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
            rowObj[field.key] = isNaN(num) ? (field.default !== undefined ? field.default : null) : num;
          } else {
            rowObj[field.key] = val;
          }
        }
      } else {
        // Missing in CSV -> set to null
        rowObj[field.key] = field.default !== undefined ? field.default : null;
      }
    }
    mappedRows.push(rowObj);
  }

  return {
    rows: mappedRows,
    matchedColumns,
    missingColumns,
    ignoredColumns,
    totalRows: mappedRows.length,
  };
}
