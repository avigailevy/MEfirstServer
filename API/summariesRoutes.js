//עובד גם עם דרייב וגם עם DB
// const express = require('express');
// const router = express.Router();
// const { google } = require('googleapis');
// const auth = require('../Services/googleServices/googleAuth');
// const genericServices = require('../Services/genericServices');
// const { authenticateToken } = require('./middlewares/authMiddleware');

// // ✔️ מחזיר את כל הסיכומים עבור פרויקט מסוים (מסודרים לפי מזהה יורד)
// router.get('/:projectId/summaries', authenticateToken, async (req, res) => {
//     try {
//         const { projectId } = req.params;
//         const summaries = await genericServices.getAllRecordsByColumns({
//             tableName: 'summaries',
//             columnsObj: { project_id: projectId }
//         });
//         summaries.sort((a, b) => b.summary_id - a.summary_id);
//         res.json(summaries);
//     } catch (err) {
//         res.status(500).json({ error: 'Failed to fetch summaries for the project' });
//     }
// });
// // ✔️ עדכון טקסט של סיכום קיים לפי מזהה
// router.put('/:summary_id', authenticateToken, async (req, res) => {
//     try {
//         const { summary_id } = req.params;
//         const { summery_text } = req.body;

//         if (!summery_text) {
//             return res.status(400).json({ error: 'summery_text is required' });
//         }

//         const updatedSummary = await genericServices.updateRecord(
//             'summaries',
//             'summary_id',
//             summary_id,
//             { summery_text }
//         );

//         res.json(updatedSummary);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// });
// // ✔️ מוסיף שורת סיכום גם ל־Google Docs וגם למסד הנתונים
// router.post('/:projectId/addSummaryRow', authenticateToken, async (req, res) => {
//     try {
//         const { projectId } = req.params;
//         const { docId, summery_text } = req.body;
//         const user_id = req.user.userId;

//         if (!docId || !user_id || !summery_text) {
//             return res.status(400).json({ error: 'Missing docId, from_user_id or summery_text' });
//         }

//         const now = new Date();
//         const dateText = now.toLocaleString('he-IL', {
//             day: '2-digit',
//             month: '2-digit',
//             year: '2-digit',
//             hour: '2-digit',
//             minute: '2-digit'
//         });

//         // התחברות ל־Google Docs API
//         const authClient = await auth.getClient();
//         const docs = google.docs({ version: 'v1', auth: authClient });

//         // שלב 1: קבלת תוכן המסמך
//         const doc = await docs.documents.get({ documentId: docId });
//         const body = doc.data.body.content;

//         // שלב 2: בדיקה אם קיימת טבלה
//         let tableElement = body.find(e => e.table);

//         if (!tableElement) {
//             // יצירת טבלה חדשה עם כותרות: תאריך | סיכום
//             await docs.documents.batchUpdate({
//                 documentId: docId,
//                 requestBody: {
//                     requests: [
//                         {
//                             insertTable: {
//                                 rows: 1,
//                                 columns: 2,
//                                 location: { index: 1 }
//                             }
//                         },
//                         {
//                             insertText: {
//                                 location: { index: 2 },
//                                 text: 'תאריך'
//                             }
//                         },
//                         {
//                             insertText: {
//                                 location: { index: 3 },
//                                 text: 'סיכום'
//                             }
//                         }
//                     ]
//                 }
//             });

//             // שלב 3: קריאה מחדש למסמך לאחר יצירת הטבלה
//             const updatedDoc = await docs.documents.get({ documentId: docId });
//             const updatedBody = updatedDoc.data.body.content;
//             tableElement = updatedBody.find(e => e.table);
//             if (!tableElement) {
//                 return res.status(500).json({ error: 'Failed to create table in document' });
//             }
//         }

//         // שלב 4: הוספת שורת סיכום חדשה לטבלה
//         const tableStart = tableElement.startIndex;
//         const rowCount = tableElement.table.rows.length;

//         const requests = [
//             {
//                 insertTableRow: {
//                     tableCellLocation: {
//                         tableStartLocation: { index: tableStart },
//                         rowIndex: rowCount - 1
//                     },
//                     insertBelow: true
//                 }
//             },
//             {
//                 insertText: {
//                     location: {
//                         index: tableStart + 5 + (rowCount * 4),
//                     },
//                     text: dateText
//                 }
//             },
//             {
//                 insertText: {
//                     location: {
//                         index: tableStart + 7 + (rowCount * 4),
//                     },
//                     text: summery_text
//                 }
//             }
//         ];

//         await docs.documents.batchUpdate({
//             documentId: docId,
//             requestBody: { requests }
//         });

//         // שלב 5: הכנסת הסיכום למסד הנתונים
//         const summaryRecord = await genericServices.createRecord('summaries', {
//             project_id: projectId,
//             from_user_id: user_id,
//             summery_time: now,
//             summery_text
//         });

//         res.status(201).json({
//             success: true,
//             message: 'Row added to Google Doc and summary saved to DB',
//             summary: summaryRecord
//         });

//     } catch (error) {
//         console.error('Error adding summary row:', error.message);
//         res.status(500).json({ error: 'Failed to add summary row', message: error.message });
//     }
// });


// module.exports = router;


//עובד רק עם DB
const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const { authenticateToken } = require('./middlewares/authMiddleware');

// ✔️ מחזיר את כל הסיכומים עבור פרויקט מסוים (מסודרים לפי מזהה יורד)
router.get('/:projectId/summaries', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const summaries = await genericServices.getAllRecordsByColumns({
            tableName: 'summaries',
            columnsObj: { project_id: projectId }
        });
        summaries.sort((a, b) => b.summary_id - a.summary_id);
        res.json(summaries);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch summaries for the project' });
    }
});
// ✔️ עדכון טקסט של סיכום קיים לפי מזהה
router.put('/:summary_id', authenticateToken, async (req, res) => {
    try {
        const { summary_id } = req.params;
        const { summery_text } = req.body;

        if (!summery_text) {
            return res.status(400).json({ error: 'summery_text is required' });
        }

        const updatedSummary = await genericServices.updateRecord(
            'summaries',
            'summary_id',
            summary_id,
            { summery_text }
        );

        res.json(updatedSummary);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// ✔️ מוסיף שורת סיכום חדשה למסד הנתונים בלבד
router.post('/:projectId/addSummaryRow', authenticateToken, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { summery_text } = req.body;
        const user_id = req.user.userId;

        if (!user_id || !summery_text) {
            return res.status(400).json({ error: 'Missing from_user_id or summery_text' });
        }

        const now = new Date();

        const summaryRecord = await genericServices.createRecord('summaries', {
            project_id: projectId,
            from_user_id: user_id,
            summary_time: now,
            summary_text: summery_text
        });


        res.status(201).json({
            success: true,
            message: 'Summary saved to DB',
            summary: summaryRecord
        });

    } catch (error) {
        console.error('Error adding summary row:', error.message);
        res.status(500).json({ error: 'Failed to add summary row', message: error.message });
    }
});

module.exports = router;
