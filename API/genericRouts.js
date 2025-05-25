const createGenericRouter = require('../API/genericRouts');
module.exports = createGenericRouter('criteria', 'criterion_id', ['project_id', 'criterion_type', 'shipp_pay_term_id']);