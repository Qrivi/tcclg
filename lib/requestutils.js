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
      throw new Error(`Connection not successfull (HTTP ${res.statusCode}).`)
    }

    logUtils.success('Connection successfull.')
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
    const build = res.body.toString().match(/[_rl\d.]+-r\d+/)

    if (!build[0]) {
      throw new Error('No build number found on the specified URL.')
    }

    return build[ 0 ]
  } catch (err) {
    logUtils.error(err)
    return false
  }
}

function getChanges (project, teamcity) {
  logUtils.log(`Fetching changes for ${project.buildType} (${project.name}) from ${teamcity.url} (${project.branch} branch, since ${project.build}).`)
  try {
    const url = `${teamcity.url.replace(/\/$/, '')}/httpAuth/app/rest/builds?locator=count:100,buildType:${project.buildType},branch:${project.branch},sinceBuild:(buildType:${project.buildType},branch:${project.branch},number:${project.build})&fields=build:(number,branchName,finishDate,changes(change(username,comment)))`
    const credentials = base64.encode(`${teamcity.username}:${teamcity.password}`)
    const res = request('GET', url, { headers: { 'Accept': 'application/json', 'Authorization': `Basic ${credentials}` } })
    const json = JSON.parse(res.body.toString())
    logUtils.traceTeamCity(url, json)

    const builds = json.build
    if (!builds.length) {
      logUtils.warn(`There are no new builds for ${project.name}`, true)
      return {
        name: project.name,
        status: 'no-builds',
        currentBuild: project.build,
        branch: project.branch
      }
    }

    const changes = builds.map(build => build.changes.change).flat()
    if (!changes.length) {
      logUtils.warn(`A new (manual) build was triggered for ${project.name} but there are no new changes.`, true)
      return {
        name: project.name,
        status: 'no-changes',
        currentBuild: project.build,
        latestBuild: builds[0].number,
        branch: project.branch
      }
    }

    logUtils.log(`There are changes for ${project.name}.`, true)
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
  const acceptedKeys = new RegExp(`^((${jiras.filter(j => j.include === true).map(j => j.projectKey).join('|')})-\\d+)[: ]`, 'i')
  const issues = []

  logUtils.newLine()
  changes.forEach(change => {
    const key = change.trim().match(acceptedKeys) ? change.trim().match(acceptedKeys)[1].toUpperCase() : false
    if (key && !issues.find(issue => issue.key === key)) {
      logUtils.log(`→ Fetching details for ${key}`, true, true)
      const jira = jiras.find(j => j.projectKey === key.split('-')[0])
      const details = getIssueDetails(key, jira)
      issues.push({
        key: key,
        link: `${jira.url}/browse/${key}`,
        title: details.title,
        status: details.status,
        include: jira.acceptedStatusses.includes(details.status)
      })
    }
  })

  logUtils.success(`✔ Fetched details for ${issues.length} issues (${changes.length} commits) from Jira.`, true, true)
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
