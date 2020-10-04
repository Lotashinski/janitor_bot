const path = require('path')
const log4js = require("log4js")

const LOG4JS_CONFIG = path.resolve('config', 'log4js.json')
log4js.configure(LOG4JS_CONFIG)

module.exports.logManager = log4js
