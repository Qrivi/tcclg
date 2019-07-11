#!/usr/bin/env node

const fs = require('fs')
const chalk = require('chalk')
const logUtils = require('./lib/logutils')
const app = require('./app')

logUtils.clearConsole()
logUtils.console(chalk.blue('_____________________________ _________'))
logUtils.console(chalk.blue('___  __/_  ____/_  ____/__  / __  ____/'))
logUtils.console(chalk.blue('__  /  _  /    _  /    __  /  _  / __  '))
logUtils.console(chalk.blue('_  /   / /___  / /___  _  /___/ /_/ /  '))
logUtils.console(chalk.blue('/_/    \\____/  \\____/  /_____/\\____/'))
logUtils.console(chalk.blue('A gotta go fast changelog generator    '))
logUtils.log('Starting TCCLG.')
logUtils.newLine()

let config
if (process.argv[ 2 ]) {
  try {
    config = JSON.parse(fs.readFileSync(process.argv[ 2 ]))
    logUtils.log(`Configuration file at ${process.argv[ 2 ]} will be used.`, true)
  } catch (err) {
    logUtils.error(err);
    logUtils.warn(`Configuration file at ${process.argv[ 2 ]} could not be read.`, true)
  }
}
if (!config) {
  config = require('./config/default.json')
  logUtils.log('Loaded the default configuration.', true)
}

process.on('exit', () => logUtils.newLine())
app.run(config).catch(err => app.interrupt(err))
