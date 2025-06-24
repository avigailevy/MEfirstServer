const db = require("./db.js");

function validateProjectUpdate(project, updateData) {
    const allowedStatuses = ['on hold', 'live project', 'closed'];

    // Check required status field
    if (!updateData.status) {
        return { valid: false, message: 'Missing status field.' };
    }
    if (typeof updateData.status !== 'string') {
        return { valid: false, message: 'Status must be a string.' };
    }
    if (!allowedStatuses.includes(updateData.status)) {
        return { valid: false, message: 'Invalid status value.' };
    }

    // Check project_name if present
    if (updateData.project_name && updateData.project_name.length > 100) {
        return { valid: false, message: 'Project name is too long.' };
    }

    // Status transition rules
    const oldStatus = project.status;
    const newStatus = updateData.status;

    if (oldStatus === 'closed' && newStatus !== 'closed') {
        return { valid: false, message: 'Cannot reopen a closed project.' };
    }
    if (oldStatus === 'on hold' && newStatus !== 'live project' && newStatus !== 'on hold') {
        return { valid: false, message: 'Project on hold can only be changed to live project or remain on hold.' };
    }

    // Add more rules as needed

    return { valid: true };
}


async function countRecords( datePrefix) {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS count 
         FROM projects 
         WHERE LEFT(LPAD(project_id, 6, '0'), 4) = ?`,
        [datePrefix]
    );
    return rows[0].count;
}



module.exports = {
  validateProjectUpdate,
  countRecords
};