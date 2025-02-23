const db_config = require('../configs/db_config.json')
const DBController = require('./DBController')

class StyleDBController extends DBController {
    constructor() {
        super(db_config.style)
    }
}

module.exports = StyleDBController
