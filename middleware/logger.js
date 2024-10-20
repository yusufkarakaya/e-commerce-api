const { format } = require('date-fns')
const { v4: uuid } = require('uuid')
const fs = require('fs')
const fsPromises = require('fs').promises
const path = require('path')

const logEvents = async (message, logFileName) => {
  const dateTime = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
  const logItem = `${dateTime} - ${uuid()} - ${message}\n`

  try {
    if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
      await fsPromises.mkdir(path.join(__dirname, '..', 'logs'))
    }
    await fsPromises.appendFile(
      path.join(__dirname, '..', 'logs', logFileName),
      logItem
    )
  } catch (error) {
    console.log(error)
  }
}

const logger = (req, res, next) => {
  const logFileName = 'reqLog.log'
  const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode}`

  logEvents(logMessage, logFileName)
  next()
}

module.exports = { logger, logEvents }
