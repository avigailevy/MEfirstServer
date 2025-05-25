const db = require("../dataBase/db.js");

async function getAllRecords(tableName) {
    const [rows] = await db.query(`SELECT * FROM ??`, [tableName]);
    return rows;
}

async function getRecordById(tableName, columnName, id) {
    const [rows] = await db.query(
        `SELECT * FROM ?? WHERE ?? = ?`,
        [tableName, columnName, id]
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

async function getRecordsByColumn(tableName, columnName, value) {
    const [rows] = await db.query(`SELECT * FROM ?? WHERE ?? = ?`, [tableName, columnName, value]);
    return rows;
}
module.exports = { getAllRecords, getRecordById, createRecord, deleteRecord, updateRecord, getRecordsByColumn };