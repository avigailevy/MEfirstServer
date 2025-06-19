const db = require("./db.js");

async function getAllRecords(tableName) {
    const [rows] = await db.query(`SELECT * FROM ??`, [tableName]);
    return rows;
}

async function getRecordByColumn(tableName, columnName, value) {
    const [rows] = await db.query(
        `SELECT * FROM ?? WHERE ?? = ? LIMIT 1`,
        [tableName, columnName, value]
    );
    return rows[0] || null;
}

async function getAllRecordsByColumn(tableName, columnName, value) {
    const [rows] = await db.query(
        `SELECT * FROM ?? WHERE ?? = ?`,
        [tableName, columnName, value]
    );
    return [rows];
}

async function getRecordByColumns(tableName, columnsObj) {
    const columns = Object.keys(columnsObj);
    const values = Object.values(columnsObj);
    const whereClause = columns.map(col => `\`${col}\` = ?`).join(' AND ');
    const [rows] = await db.query(
        `SELECT * FROM \`${tableName}\` WHERE ${whereClause} LIMIT 1`,
        values
    );
    return rows[0] || null;
}

async function createRecord(tableName, record) {
    const [result] = await db.query(`INSERT INTO ?? SET ?`, [tableName, record]);
    return { id: result.insertId, ...record };
}

async function deleteRecord(tableName, columnName, id) {
    await db.query(`DELETE FROM ?? WHERE ?? = ?`, [tableName, columnName, id]);
}

async function updateRecord(tableName, columnName, id, record) {
    await db.query(`UPDATE ?? SET ? WHERE ?? = ?`, [tableName, record, columnName, id]);
    return { id, ...record };
}

async function getRecordByColumns(tableName, columnsObj) {
    const columns = Object.keys(columnsObj);
    const values = Object.values(columnsObj);
    const whereClause = columns.map(col => `\`${col}\` = ?`).join(' AND ');
    const [rows] = await db.query(
        `SELECT * FROM \`${tableName}\` WHERE ${whereClause} LIMIT 1`,
        values
    );
    return rows[0] || null;
}


async function getRecordsByColumns(tableName, columns, whereColumn, whereValue) {
  // בדיקות בסיסיות לשמות
  const isValidName = name => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
  if (!isValidName(tableName) || !isValidName(whereColumn) || !columns.every(isValidName)) {
    throw new Error('Invalid table or column name');
  }
  const columnList = columns.map(col => `\`${col}\``).join(', ');
  const sql = `SELECT ${columnList} FROM \`${tableName}\` WHERE \`${whereColumn}\` = ?`;

  const [rows] = await db.execute(sql, [whereValue]);
  return rows;
}

async function getRecordsByMultipleConditions(tableName, columns, conditions) {
  const isValidName = name => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);

  if (!isValidName(tableName) || !columns.every(isValidName) || !Object.keys(conditions).every(isValidName)) {
    throw new Error('Invalid table or column name');
  }

  const columnList = columns.map(col => `\`${col}\``).join(', ');
  const whereClause = Object.keys(conditions).map(col => `\`${col}\` = ?`).join(' AND ');
  const values = Object.values(conditions);

  const sql = `SELECT ${columnList} FROM \`${tableName}\` WHERE ${whereClause}`;

  const [rows] = await db.execute(sql, values);
  return rows;
}


module.exports = { 
    getAllRecords, 
    getRecordByColumn, 
    getAllRecordsByColumn, 
    createRecord, 
    deleteRecord, 
    updateRecord,
    getRecordByColumns,
    getRecordsByColumns, 
    getRecordsByMultipleConditions
};