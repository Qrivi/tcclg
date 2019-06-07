const chalk = require( 'chalk' );

function logOk( message){
    console.log(chalk.green(`👍 ${message}`));
}
function logWarn( message){
    console.log(chalk.yellow(`👍 ${message}`));
}
function logError( message){
    console.log(chalk.red(`👍 ${message}`));
}

function verify(config){
    let success = true;
    
    if(config.teamcity && config.teamcity.url){
        logOk(`TeamCity URL is pointing to ${config.teamcity.url}.`);
        if(config.teamcity.username && config.teamcity.username.length)
            logOk(` Credentials are provided for TeamCity.`);
        else
            logWarn(` No credentials are required for TeamCity.`);
    }else{
        success = false;
        logError(`TeamCity URL is missing.`);
    }
    
    if(config.jira && config.jira.length && Array.isArray(config.jira)){
        config.jira.forEach( jira => {
            if(jira.url && jira.projectKey){
                if(!jira.active){
                    logWarn(`${jira.projectKey} issue details will not be fetched.`);
                }else{
                    logOk(`${jira.projectKey} issue details will be fetched from ${jira.url}.`);
                    if(jira.username && jira.username.length)
                        logOk(` Credentials are provided for this JIRA.`);
                    else
                        logWarn(` No credentials are required for this JIRA.`);
                    if(jira.acceptedStatusses && jira.acceptedStatusses.length && Array.isArray(jira.acceptedStatusses))
                        logOk(` Only issues that are ${jira.acceptedStatusses.join(' or ')} will be considered.`);
                }
            }else{
                success = false;
                logError('A JIRA configuration is missing URL and/or project key.');
            }
        });
    }else{
        logWarn('There are no JIRA set up.');
    }
    
    if(config.projects && config.projects.length && Array.isArray(config.projects)){
        config.projects.forEach(project => {
            if(project.name && project.branch && project.versionEndpoint){   
                if(!project.active)
                    logWarn(`${project.name} changes details will be ignored.`);
                else
                    logOk(`${project.name} changes on ${project.branch} will be logged.`);
            }else{
                success = false;
                logError('A project configuration is missing name, branch and/or version endpoint.');
            }
        });
    }else{
        success = false;
        logError('There are no projects set up.');
    }
    
    return success;
}

module.exports = {verify};