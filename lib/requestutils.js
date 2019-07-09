const chalk = require('chalk')
const request = require('sync-request')
const logUtils = require('./logutils')
const base64 = require('base-64')

// Telenet JIRA or TC are not reachable when not on the VPN.
// Connection will also fail if trying HTTPS with invalid (or self-signed) certificates.

function canConnect (root, path, username, password) {
  logUtils.log(`Verifying connection to ${root}.`)
  try {
    const url = root.replace(/\/$/, '') + path
    const credentials = base64.encode(`${username}:${password}`)
    const res = request('GET', url, { headers: { 'Authorization': `Basic ${credentials}` } })

    if (res.statusCode !== 200) {
      throw new Error(`Connection did not succeed (HTTP ${res.statusCode}).`)
    }

    logUtils.success('Connection succeeded.')
    return true
  } catch (err) {
    logUtils.error(err)
    return false
  }
}

function getBuildNumber (url) {
  logUtils.log(`Fetching a build number from ${url}.`)
  try {
    const res = request('GET', url)
    const build = res.body.toString().match(/([_rl\d.]+-r\d+)/) || res.body.toString().match(/Build: <strong>(\d{4})<\/strong>/)

    if (!build || !build[1]) {
      throw new Error('No build number found on the specified URL.')
    }

    logUtils.success(`Found build ${build[1]}.`)
    return build[1]
  } catch (err) {
    logUtils.error(err)
    return false
  }
}

function getChanges (project, teamcity) {
  logUtils.log(`Fetching changes for ${project.buildType} (${project.name}) from ${teamcity.url} (${project.branch} branch, since ${project.build}).`)
  logUtils.newLine()
  logUtils.console(`${chalk.bold(project.name)}:`)
  try {
    const url = `${teamcity.url.replace(/\/$/, '')}/httpAuth/app/rest/builds?locator=count:100,buildType:${project.buildType},branch:${project.branch},sinceBuild:(buildType:${project.buildType},branch:${project.buildBranch},number:${project.build})&fields=build:(number,branchName,finishDate,changes(change(username,comment)))`
    const credentials = base64.encode(`${teamcity.username}:${teamcity.password}`)
    const res = request('GET', url, { headers: { 'Accept': 'application/json', 'Authorization': `Basic ${credentials}` } })

    if (res.body.toString().includes('Cannot find build or build id for locator')) {
      logUtils.traceTeamCity(url, res.body.toString())
      logUtils.error(`✘ Build ${project.build} does not exist or was not built from ${project.buildBranch}.`, true)
      return {
        name: project.name,
        status: 'build-not-found',
        currentBuild: project.build,
        branch: project.branch
      }
    }

    const json = JSON.parse(res.body.toString())
    logUtils.traceTeamCity(url, json)

    const builds = json.build
    if (!builds.length) {
      logUtils.warn(`There are no new builds since ${project.build} from ${project.branch}.`, true)
      return {
        name: project.name,
        status: 'no-builds',
        currentBuild: project.build,
        branch: project.branch
      }
    }

    const changes = builds.map(build => build.changes.change).flat()
    if (!changes.length) {
      logUtils.warn(`A new build was (manually) triggered from ${project.branch} but there are no new changes.`, true)
      return {
        name: project.name,
        status: 'no-changes',
        currentBuild: project.build,
        latestBuild: builds[0].number,
        branch: project.branch
      }
    }

    logUtils.log(`There are changes since ${project.build} on ${project.branch}.`, true)
    return {
      name: project.name,
      status: 'ok',
      currentBuild: project.build,
      latestBuild: builds[0].number,
      branch: project.branch,
      commits: changes.map(change => change.comment).reverse()
    }
  } catch (err) {
    logUtils.error(err)
    return {
      name: project.name,
      status: 'error',
      currentBuild: project.build
    }
  }
}

function getIssues (changes, jiras) {
  const acceptedKeys = new RegExp(`^((${jiras.filter(j => j.include === true).map(j => j.projectKey).join('|')})-\\d+)`, 'i')
  const issues = []

  changes.forEach(change => {
    if (change.toUpperCase().startsWith('MERGE')) {
      return
    }

    const key = change.trim().match(acceptedKeys) ? change.trim().match(acceptedKeys)[1].toUpperCase() : false
    if (key && !issues.find(issue => issue.key === key)) {
      logUtils.log(`→ ${key}: fetching details...`, true)
      const jira = jiras.find(j => j.projectKey === key.split('-')[0])
      const details = getIssueDetails(key, jira)
      logUtils.log(`→ ${key} [${details.status}]: ${details.title}`, true, true)
      issues.push({
        key: key,
        link: `${jira.url}/browse/${key}`,
        title: details.title,
        status: details.status,
        include: jira.acceptedStatusses ? jira.acceptedStatusses.includes(details.status) : false
      })
    } else if (!key) {
      const message = change.split('\n')[0].length > 50 ? `${change.split('\n')[0].substr(0, 50)}…` : change.split('\n')[0]
      logUtils.log(`→ ${message}`, true)
    }
  })

  logUtils.success(`✔ Fetched details for ${issues.length} issues (${changes.length} commits) from Jira.`, true)
  return issues
}

function getIssueDetails (key, jira) {
  logUtils.log(`Fetching details for ${key} from ${jira.url}.`)
  try {
    const url = `${jira.url.replace(/\/$/, '')}/rest/api/2/issue/${key}?fields=summary,status`
    const credentials = base64.encode(`${jira.username}:${jira.password}`)
    const res = request('GET', url, { headers: { 'Authorization': `Basic ${credentials}` } })
    const json = JSON.parse(res.body.toString())
    logUtils.traceJira(url, json)

    return {
      title: json.fields.summary,
      status: json.fields.status.name
    }
  } catch (err) {
    logUtils.error(err)
    return false
  }
}

module.exports = { canConnect, getBuildNumber, getChanges, getIssues }
