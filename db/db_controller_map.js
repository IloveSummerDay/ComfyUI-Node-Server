const StyleDBController = require('./StyleDBController')
const LogoDBController = require('./LogoDBController')
const ModelDBController = require('./ModelDBController')

module.exports = {
    style: new StyleDBController(),
    logo: new LogoDBController(),
    model: new ModelDBController(),
}
