const db = require("./db.js");

async function getAllRecords(tableName) {
    const [rows] = await db.query(`SELECT * FROM ??`, [tableName]);
    return rows;
}

async function getRecordByColumn(tableName, columnName, column) {
    const [rows] = await db.query(
        `SELECT * FROM ?? WHERE ?? = ?`,
        [tableName, columnName, column]
    );
    return rows[0];
}

function createRecord(tableName, record) {
    const result = db.query(`INSERT INTO ?? SET ?`, [tableName, record]);
    return { id: result.insertId, ...record };
}

async function deleteRecord(tableName, columnName, id) {
    await db.query(`DELETE FROM ?? WHERE ?? = ?`, [tableName, columnName, id]);
}

async function updateRecord(tableName, columnName, id, record) {
    await db.query(`UPDATE ?? SET ? WHERE ?? = ?`, [tableName, record, columnName, id]);
    return { id, ...record };
}

module.exports = { getAllRecords, getRecordByColumn, createRecord, deleteRecord, updateRecord };