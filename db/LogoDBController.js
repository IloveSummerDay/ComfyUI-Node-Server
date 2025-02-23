const db_config = require('../configs/db_config.json')
const DBController = require('./DBController')

class LogoDBController extends DBController {
    constructor() {
        super(db_config.logo)
    }
}

module.exports = LogoDBController
