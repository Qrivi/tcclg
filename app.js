const configUtils = require('./lib/configutils')
const logUtils = require('./lib/logutils')
const printUtils = require('./lib/printutils')
const requestUtils = require('./lib/requestutils')

async function run (config) {
  if (await configUtils.verify(config)) {
    logUtils.log('Configuration is OK. Let\'s get this bread.')

    const changeData = []

    config.projects.forEach(project => {
      if (project.include) {
        let changes = requestUtils.getChanges(project, config.teamcity)
        if (changes.status === 'ok') {
          changes.issues = requestUtils.getIssues(changes.commits, config.jira)
          changeData.push(changes)
        }
      }
    })
    logUtils.newLine()
    printUtils.toJson(changeData, config.preferences)
    printUtils.toMarkdown(changeData, config.preferences)
    logUtils.success('Done!', true)
  } else {
    logUtils.newLine()
    logUtils.error('Please fix your configuration and try again.', true)
  }
}

async function interrupt (err) {
  await sleep(2000)
  logUtils.clearConsole()
  logUtils.warn('(╯°□°）╯︵ ┻━┻', true)
  logUtils.error('There\'s an error in the code!!1!', true)
  logUtils.error(err.stack)
  logUtils.newLine()
}

function sleep (ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

module.exports = { run, interrupt }
