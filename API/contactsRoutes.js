const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');

// החזרת כל אנשי הקשר לפי סוג(ספק/לקוח) של משתמש 
router.get('/all', async (req, res) => {
    try {
        const { username, customersOrSupliers } = req.params;
        const allContacts = await genericServices.getAllRecordsByColumn('contacts', 'contact_type', customersOrSupliers);
        res.json(allContacts);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
})
// הוספת איש קשר לפי שם משתמש, סוג (לקוח/ספק) ושם איש קשר.
router.post('/add/:contact_name', async (req, res) => {
    try {
        const { username, customersOrSupliers, contact_name } = req.params;

        //  מציאת ה-user_id לפי שם המשתמש
        const user = await genericServices.getRecordByColumn('users', 'username', username);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const user_id = user.user_id;

        // בדוק אם איש הקשר כבר קיים עם אותו user_id וcontact_name
        const existingContact = await genericServices.getRecordByColumns('contacts', { user_id, contact_name, contact_type: customersOrSupliers });

        if (existingContact) {
            // אם הסוג שונה מהסוג הקיים, שנה ל-OTHER
            if (existingContact.contact_type !== customersOrSupliers) {
                await genericServices.updateRecord(
                    'contacts',
                    'contact_id',
                    existingContact.contact_id,
                    { contact_type: 'other' }
                );
                return res.status(200).json({ message: 'Contact type updated to OTHER.' });
            } else {
                return res.status(400).json({ error: 'Contact already exists with the same type.' });
            }
        }

        // אם לא קיים, הוסף איש קשר חדש
        const newContact = await genericServices.createRecord('contacts', { user_id, contact_name, contact_type: customersOrSupliers });
        res.status(201).json(newContact);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// מחיקת איש קשר לפי שם משתמש, סוג (לקוח/ספק) ושם איש קשר.
router.delete('/:contact_name', async (req, res) => {
    try {
        const { username, customersOrSupliers, contact_name } = req.params;

        // מצא את איש הקשר
        const contact = await genericServices.getRecordByColumns('contacts', { user_id: username, contact_name });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found.' });
        }

        if (contact.contact_type === 'other') {
            // אם מוחקים מתוך "לקוח", שנה ל"ספק" וכן להיפך
            const newType = customersOrSupliers === 'customer' ? 'supplier' : 'customer';
            await genericServices.updateRecord(
                'contacts',
                'contact_id',
                contact.contact_id,
                { contact_type: newType }
            );
            return res.status(200).json({ message: `Contact type updated to ${newType}.` });
        } else if (contact.contact_type === customersOrSupliers) {
            // מחק את איש הקשר
            await genericServices.deleteRecord('contacts', 'contact_id', contact.contact_id);
            return res.status(200).json({ message: 'Contact deleted.' });
        } else {
            return res.status(400).json({ error: 'Contact type does not match.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// עדכון איש קשר לפי שם משתמש, סוג (לקוח/ספק) ושם איש קשר, כולל בדיקת הרשאות Admin
router.put('/:contact_name', async (req, res) => {
    try {
        const { username, customersOrSupliers, contact_name } = req.params;
        const updateData = req.body;

        // בדוק אם המשתמש קיים ומה ה-ROLE שלו
        const user = await genericServices.getRecordByColumns('users', { username });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        if (user.role !== 'Admin') {
            return res.status(403).json({ error: 'Permission denied. Only Admin can update contacts.' });
        }

        // מצא את איש הקשר לפי user_id, contact_name ו-type
        const contact = await genericServices.getRecordByColumns('contacts', { user_id: user.user_id, contact_name, contact_type: customersOrSupliers });
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found for this user and type.' });
        }
        // בדוק אם שינו את הסוג של איש הקשר
        if (updateData.contact_type && updateData.contact_type !== contact.contact_type) {
            // אם הסוג הנוכחי הוא 'other', אפשר לעדכן לכל סוג
            if (contact.contact_type === 'other') {
                // אין צורך בבדיקה נוספת, אפשר להמשיך לעדכן
            } else {
                // אם מנסים לשנות בין 'customer' ל'supplier' או להפך
                if (
                    (contact.contact_type === 'customer' && updateData.contact_type === 'supplier') ||
                    (contact.contact_type === 'supplier' && updateData.contact_type === 'customer')
                ) {
                    // שנה ל'other' במקום לעדכן ישירות
                    updateData.contact_type = 'other';
                } else {
                    // סוג לא תואם, החזר שגיאה
                    return res.status(400).json({ error: 'Invalid contact type change.' });
                }
            }
        }
        // עדכן את איש הקשר לפי contact_id
        const updated = await genericServices.updateRecord(
            'contacts',
            'contact_id',
            contact.contact_id,
            updateData
        );

        if (updated) {
            res.status(200).json({ message: 'Contact updated successfully.' });
        } else {
            res.status(400).json({ error: 'Failed to update contact.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



module.exports = router;