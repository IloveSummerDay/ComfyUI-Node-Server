const StyleDBController = require('./StyleDBController')
const LogoDBController = require('./LogoDBController')

module.exports = {
    style: new StyleDBController(),
    logo: new LogoDBController(),
}
