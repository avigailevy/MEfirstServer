// const db = require("./db.js");

// async function getAllRecords(tableName) {
//     const [rows] = await db.query(`SELECT * FROM ??`, [tableName]);
//     return rows;
// }

// async function getRecordByColumn(tableName, columnName, value) {
//     const [rows] = await db.query(
//         `SELECT * FROM ?? WHERE ?? = ? LIMIT 1`,
//         [tableName, columnName, value]
//     );
//     return rows[0] || null;
// }

// async function getAllRecordsByColumn(tableName, columnName, value) {
//     const [rows] = await db.query(
//         `SELECT * FROM ?? WHERE ?? = ?`,
//         [tableName, columnName, value]
//     );
//     return rows;
// }

// async function getRecordByColumns(tableName, columnsObj) {
//     const columns = Object.keys(columnsObj);
//     const values = Object.values(columnsObj);
//     const whereClause = columns.map(col => `\`${col}\` = ?`).join(' AND ');
//     const [rows] = await db.query(
//         `SELECT * FROM \`${tableName}\` WHERE ${whereClause} LIMIT 1`,
//         values
//     );
//     return rows[0] || null;
// }

// async function createRecord(tableName, record) {
//     const [result] = await db.query(`INSERT INTO ?? SET ?`, [tableName, record]);
//     return { id: result, ...record };
// }

// async function deleteRecord(tableName, columnName, id) {
//     try {
//         const [result] = await db.query(`DELETE FROM ?? WHERE ?? = ?`, [tableName, columnName, id]);
//         return result;
//     } catch (err) {
//         console.error(`Error deleting from ${tableName}:`, err);
//         throw err;
//     }
// }

// async function updateRecord(tableName, columnName, id, record) {
//     await db.query(`UPDATE ?? SET ? WHERE ?? = ?`, [tableName, record, columnName, id]);
//     return { id, ...record };
// }

// async function getRecordsByColumns(tableName, columns, whereColumn, whereValue) {
//   // בדיקות בסיסיות לשמות
//   const isValidName = name => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
//   if (!isValidName(tableName) || !isValidName(whereColumn) || !columns.every(isValidName)) {
//     throw new Error('Invalid table or column name');
//   }
//   const columnList = columns.map(col => `\`${col}\``).join(', ');
//   const sql = `SELECT ${columnList} FROM \`${tableName}\` WHERE \`${whereColumn}\` = ?`;

//   const [rows] = await db.execute(sql, [whereValue]);
//   return rows;
// }

// async function getRecordsWhereInWithFilter(table, inColumn, inValues, filterColumn, filterValue) {
//   const placeholders = inValues.map(() => '?').join(',');
//   const sql = `SELECT * FROM \`${table}\` WHERE \`${inColumn}\` IN (${placeholders}) AND \`${filterColumn}\` = ?`;
//   const [rows] = await db.query(sql, [...inValues, filterValue]);
//   return rows;
// }

// async function getRecordsWhereIn(table, column, valuesArray) {
//   const placeholders = valuesArray.map(() => '?').join(',');
//   const sql = `SELECT * FROM \`${table}\` WHERE \`${column}\` IN (${placeholders})`;
//   const [rows] = await db.query(sql, valuesArray);
//   return rows;
// }

// async function getRecordsByMultipleConditions(tableName, columns, conditions) {
//   const isValidName = name => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);

//   if (!isValidName(tableName) || !columns.every(isValidName) || !Object.keys(conditions).every(isValidName)) {
//     throw new Error('Invalid table or column name');
//   }

//   const columnList = columns.map(col => `\`${col}\``).join(', ');
//   const whereClause = Object.keys(conditions).map(col => `\`${col}\` = ?`).join(' AND ');
//   const values = Object.values(conditions);

//   const sql = `SELECT ${columnList} FROM \`${tableName}\` WHERE ${whereClause}`;

//   const [rows] = await db.execute(sql, values);
//   return rows;
// }


// //for recent projects
// async function getAllRecordsByColumns({ tableName, columnsObj, orderBy, limit }) {
//     const columns = Object.keys(columnsObj);
//     const values = Object.values(columnsObj);
//     const whereClause = columns.map(col => `\`${col}\` = ?`).join(' AND ');
    
//     let query = `SELECT * FROM \`${tableName}\` WHERE ${whereClause}`;
    
//     if (orderBy) query += ` ORDER BY \`${orderBy}\` DESC`;
//     if (limit) query += ` LIMIT ${limit}`;

//     const [rows] = await db.query(query, values);
//     return rows;
// }


// module.exports = { 
//     getAllRecords, 
//     getRecordByColumn, 
//     getAllRecordsByColumn, 
//     createRecord, 
//     deleteRecord, 
//     updateRecord,
//     getRecordsWhereInWithFilter,
//     getRecordsWhereIn,
//     getRecordByColumns,
//     getRecordsByColumns, 
//     getRecordsByMultipleConditions,
//     getAllRecordsByColumns
// };
const db = require("./db.js");

const isValidName = name => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);

// ---------- GET RECORDS ----------

async function getAllRecords(tableName) {
    if (!isValidName(tableName)) throw new Error("Invalid table name");
    const [rows] = await db.query(`SELECT * FROM ??`, [tableName]);
    return rows;
}
async function getRecordByColumns(tableName, columnsObj) {
    if (!isValidName(tableName) || !Object.keys(columnsObj).every(isValidName)) {
        throw new Error("Invalid table or column name");
    }

    const columns = Object.keys(columnsObj);
    const values = Object.values(columnsObj);
    const whereClause = columns.map(col => `\`${col}\` = ?`).join(' AND ');

    const [rows] = await db.query(
        `SELECT * FROM \`${tableName}\` WHERE ${whereClause} LIMIT 1`,
        values
    );
    return rows[0] || null;
}
async function getAllRecordsByColumns({ tableName, columnsObj, orderBy, limit }) {
    if (!isValidName(tableName) || !Object.keys(columnsObj).every(isValidName) || (orderBy && !isValidName(orderBy))) {
        throw new Error("Invalid table or column name");
    }

    const columns = Object.keys(columnsObj);
    const values = Object.values(columnsObj);
    const whereClause = columns.map(col => `\`${col}\` = ?`).join(' AND ');

    let query = `SELECT * FROM \`${tableName}\` WHERE ${whereClause}`;
    if (orderBy) query += ` ORDER BY \`${orderBy}\` DESC`;
    if (limit) query += ` LIMIT ${limit}`;

    const [rows] = await db.query(query, values);
    return rows;
}
async function getSpecificColumnsByFilter(tableName, columns, whereColumn, whereValue) {
    if (!isValidName(tableName) || !isValidName(whereColumn) || !columns.every(isValidName)) {
        throw new Error("Invalid table or column name");
    }

    const columnList = columns.map(col => `\`${col}\``).join(', ');
    const sql = `SELECT ${columnList} FROM \`${tableName}\` WHERE \`${whereColumn}\` = ?`;
    const [rows] = await db.execute(sql, [whereValue]);
    return rows;
}
async function getRecordsByMultipleConditions(tableName, columns, conditions) {
    if (!isValidName(tableName) || !columns.every(isValidName) || !Object.keys(conditions).every(isValidName)) {
        throw new Error("Invalid table or column name");
    }

    const columnList = columns.map(col => `\`${col}\``).join(', ');
    const whereClause = Object.keys(conditions).map(col => `\`${col}\` = ?`).join(' AND ');
    const values = Object.values(conditions);

    const sql = `SELECT ${columnList} FROM \`${tableName}\` WHERE ${whereClause}`;
    const [rows] = await db.execute(sql, values);
    return rows;
}
async function getRecordsWhereIn(table, column, valuesArray) {
    if (!isValidName(table) || !isValidName(column)) {
        throw new Error("Invalid table or column name");
    }

    const placeholders = valuesArray.map(() => '?').join(',');
    const sql = `SELECT * FROM \`${table}\` WHERE \`${column}\` IN (${placeholders})`;
    const [rows] = await db.query(sql, valuesArray);
    return rows;
}
async function getRecordsWhereInWithFilter(table, inColumn, inValues, filterColumn, filterValue) {
    if (!isValidName(table) || !isValidName(inColumn) || !isValidName(filterColumn)) {
        throw new Error("Invalid table or column name");
    }

    const placeholders = inValues.map(() => '?').join(',');
    const sql = `SELECT * FROM \`${table}\` WHERE \`${inColumn}\` IN (${placeholders}) AND \`${filterColumn}\` = ?`;
    const [rows] = await db.query(sql, [...inValues, filterValue]);
    return rows;
}
// ---------- CREATE RECORD ----------

async function createRecord(tableName, record) {
    if (!isValidName(tableName)) throw new Error("Invalid table name");
    const [result] = await db.query(`INSERT INTO ?? SET ?`, [tableName, record]);
    return { id: result.insertId, ...record };
}
// ---------- UPDATE RECORD ----------

async function updateRecord(tableName, columnName, id, record) {
    if (!isValidName(tableName) || !isValidName(columnName)) {
        throw new Error("Invalid table or column name");
    }
    await db.query(`UPDATE ?? SET ? WHERE ?? = ?`, [tableName, record, columnName, id]);
    return { id, ...record };
}
// ---------- DELETE RECORD ----------

async function deleteRecord(tableName, columnName, id) {
    if (!isValidName(tableName) || !isValidName(columnName)) {
        throw new Error("Invalid table or column name");
    }

    try {
        const [result] = await db.query(`DELETE FROM ?? WHERE ?? = ?`, [tableName, columnName, id]);
        return result;
    } catch (err) {
        console.error(`Error deleting from ${tableName}:`, err);
        throw err;
    }
}
// ---------- EXPORTS ----------

module.exports = {
    getAllRecords,
    getRecordByColumns,
    getAllRecordsByColumns,
    getSpecificColumnsByFilter,
    getRecordsByMultipleConditions,
    getRecordsWhereIn,
    getRecordsWhereInWithFilter,
    createRecord,
    updateRecord,
    deleteRecord
};
