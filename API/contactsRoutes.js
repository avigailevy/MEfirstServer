const express = require('express');
const router = express.Router();
const genericServices = require('../Services/genericServices');
const createGenericRouter = require('./genericRouter');

const genericRouter = createGenericRouter('contacts', 'contact_id', ['user_id', 'contact_name']);
router.use('/', genericRouter);

// קבלת כל אנשי הקשר של משתמש מסוים
router.get('/:username/:customersOrSupliers', async (req, res) => {
    try {
        const filteredContacts = await genericServices.getAllRecordsByColumns(
            'contacts',
            { user_id: req.params.username, type: req.params.customersOrSupliers }
        );
        res.json(filteredContacts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ניתוב זה מחזיר את כל אנשי הקשר של משתמש מסוים לפי סוג (לקוחות/ספקים)
router.post('/', async (req, res) => {
    try {
        const { user_id, contact_name, type } = req.body;

        // בדוק אם איש הקשר כבר קיים עם אותו user_id וcontact_name
        const existingContact = await genericServices.getRecordByColumns('contacts', { user_id, contact_name });

        if (existingContact) {
            // אם הסוג שונה מהסוג הקיים, שנה ל-OTHER
            if (existingContact.type !== type) {
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
        const newContact = await genericServices.createRecord('contacts', { user_id, contact_name, contact_type: type });
        res.status(201).json(newContact);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// מוחק איש קשר לפי שם משתמש, סוג (לקוח/ספק) ושם איש קשר.
router.delete('/:username/:customersOrSupliers/:contact_name', async (req, res) => {
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



module.exports = router;