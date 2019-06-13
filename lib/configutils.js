const chalk = require('chalk')
const { table } = require('table')
const requestUtils = require('./requestutils')
const logUtils = require('./logutils')

async function verify (config) {
  let success = true

  logUtils.log('→ Verifying TeamCity configuration...', true)
  if (config.teamcity && config.teamcity.url) {
    logUtils.log(`TeamCity data will be fetched from ${config.teamcity.url}.`)
    if (config.teamcity.username && config.teamcity.username.length) {
      logUtils.log('TeamCity credentials are provided.')
    } else {
      logUtils.warn('TeamCity credentials are not provided.')
    }
    if (requestUtils.canConnect(config.teamcity.url, '/httpAuth/app/rest', config.teamcity.username, config.teamcity.password)) {
      logUtils.success('✔ Successfully connected to TeamCity.', true, true)
    } else {
      success = false
      logUtils.error('✘ Connecting to TeamCity failed.', true, true)
    }
  } else {
    success = false
    logUtils.error('✘ TeamCity configuration is missing the TeamCity URL.', true, true)
  }

  if (config.jira && config.jira.length && Array.isArray(config.jira)) {
    config.jira.forEach((jira, index) => {
      logUtils.log('→ Verifying Jira configuration...', true)
      if (jira.url && jira.projectKey) {
        if (!jira.include) {
          logUtils.warn(`✘ ${jira.projectKey} issues will not be included.`, true, true)
        } else {
          logUtils.log(`${jira.projectKey} issues will be fetched from ${jira.url}.`)
          if (jira.username && jira.username.length) {
            logUtils.log('Jira credentials are provided.')
          } else {
            logUtils.warn('Jira credentials are not provided')
          }
          if (requestUtils.canConnect(jira.url, '/rest/api/2/myself', jira.username, jira.password)) {
            if (jira.acceptedStatusses && jira.acceptedStatusses.length && Array.isArray(jira.acceptedStatusses)) {
              logUtils.log(`Only issues that are ${jira.acceptedStatusses.join(' or ')} will be considered.`)
            }
            logUtils.success(`✔ Successfully connected to Jira for ${jira.projectKey} issues.`, true, true)
          } else {
            success = false
            logUtils.error(`✘ Connecting to Jira for ${jira.projectKey} issues failed.`, true, true)
          }
        }
      } else {
        success = false
        logUtils.error(`✘ Jira configuration #${index} is missing the Jira URL.`, true, true)
      }
    })
  } else {
    logUtils.warn('There are no valid Jira configurations defined.', true)
  }

  if (!success) {
    return false
  }
  logUtils.newLine()

  let setup = [
    [ chalk.bold('Project name'), chalk.bold('Current build'), chalk.bold('Active branch'), '' ]
  ]

  logUtils.log('Verifying projects configuration...')
  if (config.projects && config.projects.length && Array.isArray(config.projects)) {
    config.projects.forEach((project, index) => {
      if (!project.include) {
        setup.push([ project.name, 'n/a', 'n/a', chalk.bgRed.bold(' Ignoring ') ])
      } else if (project.name && project.branch && project.build) {
        let buildStatus = ''
        if (project.build.startsWith('http')) {
          project.build = requestUtils.getBuildNumber(project.build)
          buildStatus = ' ✓'
        }
        if (!project.build) { // getBuildNumber returns false if no number is found on given url.
          success = false
          logUtils.error(`Could not find a build number for ${project.name} on ${project.build}.`)
        } else {
          setup.push([ project.name, project.build + buildStatus, project.branch, chalk.bgGreen.bold(' Including ') ])
        }
      } else {
        success = false
        logUtils.error(`✘ Project configuration ${index} is missing name, branch and/or version endpoint.`, true)
      }
    })
  } else {
    success = false
    logUtils.error('✘ There are no valid project configurations defined.', true)
  }

  if (!success) {
    return false
  }
  logUtils.log(table(setup), true)

  return true
}

module.exports = { verify }
