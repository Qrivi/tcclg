const fs = require('fs')
const chalk = require('chalk')
const clear = require('clear')

const logDir = './log/'
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}
const logFile = fs.createWriteStream(`${logDir}/app.log`, { flags: 'a' })
const teamCityTrace = fs.createWriteStream(`${logDir}/teamcity-trace.log`, { flags: 'a' })
const jiraTrace = fs.createWriteStream(`${logDir}/jira-trace.log`, { flags: 'a' })

function now () {
  return new Date().toLocaleString()
}

function tag (level) {
  switch (level.toUpperCase()) {
    case 'WARN':
    case 'WARNING':
      return 'WARN '
    case 'ERROR':
      return 'ERROR'
    default:
      return 'INFO '
  }
}

function unchalk (string) {
  return string.replace(/.\[\d{1,2}m/g, '')
}

async function logMessage (level, message, showInConsole, replaceInConsole) {
  if (showInConsole) {
    if (replaceInConsole) {
      process.stdout.clearLine()
      process.stdout.cursorTo(0)
    } else {
      process.stdout.write('\n')
    }
    switch (level) {
      case 'warning':
        process.stdout.write(chalk.yellow(message))
        break
      case 'error':
        process.stdout.write(chalk.red(message))
        break
      case 'success':
        process.stdout.write(chalk.green(message))
        break
      default:
        process.stdout.write(message)
    }
  }
  logFile.write('\n' + message.toString()
    .split('\n')
    .map(line => `${now()} | ${tag(level)} | ${unchalk(line)}`)
    .join('\n'))
}

async function traceTeamCity (url, response) {
  teamCityTrace.write(`\n${now()} | TEAMCITY | GET ${url}\n${JSON.stringify(response, null, 2)}\n`)
}

async function traceJira (url, response, projectKey) {
  jiraTrace.write(`\n${now()} | ${projectKey} | GET ${url}\n${JSON.stringify(response, null, 2)}\n`)
}

async function log (message, showInConsole, replaceInConsole) {
  return logMessage('info', message, showInConsole, replaceInConsole)
}

async function warn (message, showInConsole, replaceInConsole) {
  return logMessage('warning', message, showInConsole, replaceInConsole)
}

async function error (message, showInConsole, replaceInConsole) {
  return logMessage('error', message, showInConsole, replaceInConsole)
}

async function success (message, showInConsole, replaceInConsole) {
  return logMessage('success', message, showInConsole, replaceInConsole)
}

function console (message) {
  process.stdout.write('\n' + message)
}

function newLine () {
  process.stdout.write('\n')
}

function clearConsole () {
  clear()
}

module.exports = { traceTeamCity, traceJira, log, warn, error, success, console, clearConsole, newLine }
