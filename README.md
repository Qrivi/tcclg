# TeamCity Changelog Generator

Converts a very time consuming monkey job in a one line command monkey job. 🙈

![Example flow](https://i.imgur.com/vLCAQCm.gif)

Run this script by either running  `node index.js [config.json]` or `npm start [config.json]`. If `config.json` is omitted, the default config in `config/default.json` will be used.

## Configuration

### `preferences`
Some formatting preferences for the outputted change log files.

#### `preferences.changesListFormatting`
This value will affect how Jira issues will be listed in the markdown change log.

| Value                | Description                                                                                                                                                             |
|----------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `markdown` `md`      | This is the default. Will first print the issue's key, followed by a colon and the issue's title. The key will link to the issue on your Jira.                          |
| `plain` `text` `key` | Very similar to above in formatting, but the key will not be clickable — everything is just plain text.                                                                 |
| `link` `url`         | Also similar, but this will print the issue's link instead of its key. This can be useful if you have to copy the log to a non-markdown context, e.g. an e-mail client. |

#### `preferences.skipProjectIfNoChanges`
If this is `true`, projects that have no changes will be omitted in the markdown change log. Otherwise the default behavior is to add a line that just mentions that there are no changes for that project.

#### `preferences.printPrettyJson`
If this is set to `true`, the JSON change log will be pretty printed for readability.

### `teamcity`
This object configures how TCCLG connects to your TeamCity.

#### `teamcity.url`
URL pointing to your TeamCity instance's root.

#### `teamcity.username` & `teamcity.password`
Login credentials for your TeamCity instance. If none are required, these properties can be ignored.

### `jira`
An *array of* objects that configures to which Jira boards TCCLG connects.

#### `jira.include`
Simple killswitch: if set to `false`, the object will be ignored. This can be useful if you need the configuration later and want to run TCCLG without having to make much changes to the configuration.

#### `jira.url`
URL pointing to your Jira board's root.

#### `jira.username` & `jira.password`
Login credentials for your Jira board. If none are required, these properties can be ignored. Note that you might very well [need a token and not your password](https://confluence.atlassian.com/cloud/api-tokens-938839638.html) to authenticate.

#### `jira.projectKey`
Only commits that start with a Jira project key will be included in the change log and TCCLG will use this key to fetch issue details from Jira's API.

#### `jira.acceptedStatusses`
A list of statuses the issues fetched from Jira must have in order to be included in the change log. If this property is omitted, all issues qualify. If an empty list is provided, none qualify. So don't do that.

### `projects`
An *array of* objects that configures which TeamCity build configurations TCCLG needs to check.

#### `projects.include`
Simple killswitch: if set to `false`, the object will be ignored. This can be useful if you need the configuration later and want to run TCCLG without having to make much changes to the configuration.

#### `projects.name`
A nice name used to identify your project.

#### `projects.branch`
The name of the branch that contains the changes to be checked.

#### `projects.buildType`
The id of your TeamCity build configuration (`BuildType.id`) that takes care of your project. You can effortlessly get this from the URL: it's a query parameter on your build configuration's page.

#### `projects.build`
Build number after which changes need to be logged. You can also provide a URL here, in which case TCCLG will attempt to fetch the build number from that URL. This is very neato if your project has a version endpoint.
