const db_config = require('../configs/db_config.json')
const DBController = require('./DBController')

class ModelDBController extends DBController {
    constructor() {
        super(db_config.model)
    }
}

module.exports = ModelDBController
