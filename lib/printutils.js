const fs = require('fs')
const logUtils = require('./logutils')

const outputDir = './output/'
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir)
}
const markdownFile = fs.createWriteStream(`${outputDir}/changelog.md`)
const jsonFile = fs.createWriteStream(`${outputDir}/changelog.json`)

async function toJson (changeData, preferences) {
  logUtils.log('Generating JSON changelog...', true)
  if (preferences.printPrettyJson) {
    jsonFile.write(JSON.stringify(changeData, null, 2))
  } else {
    jsonFile.write(JSON.stringify(changeData))
  }
}

async function toMarkdown (changeData, preferences) {
  logUtils.log('Generating markdown changelog...', true)
  changeData.forEach(project => {
    const issueList = project.issues
      .filter(i => i.include)
      .map(i => {
        switch (preferences.changesListFormatting) {
          case 'plain':
          case 'text':
          case 'key':
            return `- ${i.key}: ${i.title}`
          case 'link':
          case 'url':
            return `- ${i.link}: ${i.title}`
          case 'markdown':
          case 'md':
          default:
            return `- [${i.key}](${i.link}): ${i.title}`
        }
      })
    if (!issueList || !issueList.length) {
      if (preferences.skipProjectIfNoChanges) {
        return
      }
      markdownFile.write(`# ${project.name}\nbuild ${project.currentBuild}\n`)
      markdownFile.write(`\nThere are no new changes for ${project.name}.\n`)
    } else {
      markdownFile.write(`# ${project.name}\nbuild ${project.currentBuild} → ${project.latestBuild}\n`)
      markdownFile.write(`\n${issueList.join('\n')}\n`)
    }
    markdownFile.write('\n')
  })
}

module.exports = { toJson, toMarkdown }
