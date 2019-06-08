const chalk = require( 'chalk');
const requestUtils = require('./requestutils');

function logInfo( message ) {
    console.log( chalk.blue( `ℹ️  ${message}`) );
}

function logOk( message ) {
    console.log( chalk.green( `✅ ${message}`) );
}

function logWarn( message ) {
    console.log( chalk.yellow( `⚠️ ${message}`) );
}

function logError( message ) {
    console.log( chalk.red( `🚫 ${message}`) );
}

async function verify( config ) {
    let success = true;

    if( config.teamcity && config.teamcity.url ) {
        logOk( `TeamCity URL is pointing to ${config.teamcity.url}.`);
        if( config.teamcity.username && config.teamcity.username.length )
            logOk( `Credentials are provided for TeamCity.`);
        else
            logWarn( `No credentials are required for TeamCity.`);
        if(requestUtils.canConnect( config.teamcity.url, '/httpAuth/app/rest', config.teamcity.username, config.teamcity.password )){
            logInfo( 'Connecting to TeamCity using this confituration was successful.');
        }else{
            success = false;
            logError(`Connecting to TeamCity using this configuration failed.`);
        }
    } else {
        success = false;
        logError( `TeamCity URL is missing.`);
    }

    if( config.jira && config.jira.length && Array.isArray( config.jira ) ) {
        config.jira.forEach( jira => {
            if( jira.url && jira.projectKey ) {
                if( !jira.active ) {
                    logWarn( `${jira.projectKey} issue details will not be fetched.`);
                } else {
                    logOk( `${jira.projectKey} issue details will be fetched from ${jira.url}.`);
                    if( jira.username && jira.username.length )
                        logOk( `Credentials are provided for this JIRA.`);
                    else
                        logWarn( `No credentials are required for this JIRA.`);
                    if(requestUtils.canConnect( jira.url, '/rest/api/2/myself', jira.username, jira.password )){
                        if( jira.acceptedStatusses && jira.acceptedStatusses.length && Array.isArray( jira.acceptedStatusses ) )
                            logOk( `Only issues that are ${jira.acceptedStatusses.join('or ')} will be considered.`);
                        logInfo( 'Connecting to JIRA using this confituration was successful.');
                    }else{
                        success = false;
                        logError(`Connecting to JIRA using this configuration failed.`);
                    }
                }
            } else {
                success = false;
                logError( 'A JIRA configuration is missing URL and/or project key.');
            }
        } );
    } else {
        logWarn( 'There are no JIRA set up.');
    }
    
    if( !success )
        return false;
    console.log('\n');

    if( config.projects && config.projects.length && Array.isArray( config.projects ) ) {
        config.projects.forEach( project => {
            if( project.name && project.branch && project.versionEndpoint ) {
                if( !project.active ){
                    logWarn( `${project.name} changes details will be ignored.`);
                }else{
                    const build = requestUtils.getBuildNumber(project.versionEndpoint);
                    if( build ){
                        logInfo( `${project.name} changes on ${project.branch} since build ${build} will be logged.`);
                    }else{
                        success = false;
                        logError( `Could not find a version number for ${project.name} on ${project.versionEndpoint}.`);
                    }
                }
            } else {
                success = false;
                logError( 'A project configuration is missing name, branch and/or version endpoint.');
            }
        } );
    } else {
        success = false;
        logError( 'There are no projects set up.');
    }

    return success;
}

module.exports = { verify };
