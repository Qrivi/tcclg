const chalk = require( 'chalk' );
const { table } = require( 'table' );
const requestUtils = require( './requestutils' );
const logUtils = require( './logutils' );

function logInfo( message ) {
    logUtils.log( chalk.blue( `ℹ️  ${message}` ) );
}

function logOk( message ) {
    logUtils.log( chalk.green( `✅ ${message}` ) );
}

function logWarn( message ) {
    logUtils.warn( chalk.yellow( `⚠️ ${message}` ) );
}

function logError( message ) {
    logUtils.error( chalk.red( `🚫 ${message}` ) );
}

async function verify( config ) {
    let success = true;

    if( config.teamcity && config.teamcity.url ) {
        logOk( `TeamCity URL is pointing to ${config.teamcity.url}.` );
        if( config.teamcity.username && config.teamcity.username.length )
            logOk( '  Credentials are provided for TeamCity.' );
        else
            logWarn( `  No credentials are required for TeamCity.` );
        if( requestUtils.canConnect( config.teamcity.url, '/httpAuth/app/rest', config.teamcity.username, config.teamcity.password ) ) {
            logInfo( '  Connecting to TeamCity using this confituration was successful.' );
        } else {
            success = false;
            logError( `  Connecting to TeamCity using this configuration failed.` );
        }
    } else {
        success = false;
        logError( 'TeamCity URL is missing.' );
    }

    if( config.jira && config.jira.length && Array.isArray( config.jira ) ) {
        config.jira.forEach( jira => {
            if( jira.url && jira.projectKey ) {
                if( !jira.include ) {
                    logWarn( `${jira.projectKey} issue details will not be fetched.` );
                } else {
                    logOk( `${jira.projectKey} issue details will be fetched from ${jira.url}.` );
                    if( jira.username && jira.username.length )
                        logOk( '  Credentials are provided for this JIRA.' );
                    else
                        logWarn( '  No credentials are required for this JIRA.' );
                    if( requestUtils.canConnect( jira.url, '/rest/api/2/myself', jira.username, jira.password ) ) {
                        if( jira.acceptedStatusses && jira.acceptedStatusses.length && Array.isArray( jira.acceptedStatusses ) )
                            logOk( `  Only issues that are ${jira.acceptedStatusses.join('or ')} will be considered.` );
                        logInfo( '  Connecting to JIRA using this confituration was successful.' );
                    } else {
                        success = false;
                        logError( '  Connecting to JIRA using this configuration failed.' );
                    }
                }
            } else {
                success = false;
                logError( 'A JIRA configuration is missing URL and/or project key.' );
            }
        } );
    } else {
        logWarn( 'There are no JIRA set up.' );
    }

    if( !success )
        return false;
    console.log( '\n' );

    let setup = [
        [ chalk.bold('Project name'), chalk.bold('Current build'), chalk.bold('Active branch'), '' ]
    ];

    if( config.projects && config.projects.length && Array.isArray( config.projects ) ) {
        config.projects.forEach( project => {
            if( project.name && project.branch && project.build ) {
                let verifiedBuild = '';
                if( project.build.startsWith( 'http' ) ){
                    project.build = requestUtils.getBuildNumber( project.build );
                    verifiedBuild = ' ✓';
                }
                if( project.include && !project.build ) {
                    success = false;
                    logError( `Could not find a build number for ${project.name} on ${project.build}.` );
                } else {
                    const including = project.include ? chalk.bgGreen.bold( 'Including' ) : chalk.bgRed.bold( 'Ignoring' );
                    setup.push( [ project.name, project.build + verifiedBuild, project.branch, including ] );
                }
            } else {
                success = false;
                logError( 'A project configuration is missing name, branch and/or version endpoint.' );
            }
        } );
    } else {
        success = false;
        logError( 'There are no projects set up.' );
    }

    if( !success )
        return false;
    logUtils.log( table( setup ) );

    return true;
}

module.exports = { verify };
