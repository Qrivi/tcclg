#!/usr/bin/env node

const fs = require( 'fs' );
const chalk = require( 'chalk' );
const figlet = require( 'figlet' );
const logUtils = require( './lib/logutils' );
const app = require( './app' );

logUtils.clearConsole();
logUtils.log( chalk.blue( figlet.textSync( 'TCCLG', { font: 'speed' } ) ), true );
logUtils.log( chalk.blue( 'A gotta go fast changelog generator' ), true );
logUtils.newLine();

let config;
if( process.argv[ 2 ] ) {
    try {
        config = JSON.parse( fs.readFileSync( process.argv[ 2 ] ) );
        logUtils.log( `Configuration file at ${process.argv[ 2 ]} will be used.`, true );
    } catch ( err ) {
        logUtils.warn( `Configuration file at ${process.argv[ 2 ]} could not be read.`, true );
    }
}
if( !config ) {
    config = require( './config/default.json' );
    logUtils.log( 'Loaded the default configuration.', true );
}

app.run( config )
    .catch( err => app.interrupt( err ) );
