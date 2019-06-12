#!/usr/bin/env node

const fs = require( 'fs' );
const chalk = require( 'chalk' );
const clear = require( 'clear' );
const figlet = require( 'figlet' );
const configUtils = require( './lib/configutils' );
const requestUtils = require( './lib/requestutils' );
const logUtils = require( './lib/logutils' );

async function run(){
    if( await configUtils.verify( config ) ) {
        logUtils.log('\nConfiguration is OK. Let\'s get this bread.');
        config.projects.forEach( project => {
            if(project.include){
                let issues = requestUtils.getChanges(project, config.teamcity);
                if( config.jira )
                    issues = requestUtils.getIssues(issues, config.jira);
                console.log(issues);
            }
        });
    } else {
        logUtils.error( chalk.red('\nPlease fix your configuration and try again.') );
        process.exit( 0 );
    }
}

clear();
logUtils.log( 
    chalk.blue( figlet.textSync( 'TCCLG', { font: 'speed'} )),
    chalk.blue('\nA gotta go fast changelog generator' )
);

let config;
if( process.argv[ 2 ] ) {
    try {
        const configFile = fs.readFileSync( process.argv[ 2 ] );
        config = JSON.parse( configFile );
        logUtils.log( `Configuration file at ${process.argv[ 2 ]} will be used.` );
    } catch ( err ) {
        logUtils.error( `Configuration file at ${process.argv[ 2 ]} could not be read.` );
    }
}
if( !config ) {
    config = require( './config/default.json' );
    logUtils.log( 'Loaded the default configuration.' );
}

try {
    run();
} catch ( err ) {
    logUtils.error( chalk.red( 'An exception occured.' ) );
    logUtils.error( err );
    process.exit( 1 );
}
