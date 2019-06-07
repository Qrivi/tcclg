#!/usr/bin/env node

const fs = require( 'fs' );
const chalk = require( 'chalk' );
const clear = require( 'clear' );
const figlet = require( 'figlet' );
const configUtils = require( './lib/configutils' );

clear();

let config;
if( process.argv[ 2 ] ) {
    try {
        const configFile = fs.readFileSync( process.argv[ 2 ] );
        config = JSON.parse( configFile );
        console.log( `Configuration file at ${process.argv[ 2 ]} will be used.` );
    } catch ( err ) {
        console.log( `Configuration file at ${process.argv[ 2 ]} could not be read.` );
    }
}
if( !config ) {
    config = require( './config/default.json' );
    console.log( 'Using the default configuration.' );
}

try {
    if( configUtils.verify( config ) ) {
        console.log( chalk.blue( figlet.textSync( 'Let\'s get this bread.', { font: 'small' } )));
    } else {
        console.log( 'Please fix your configuration and try again.' );
        process.exit( 1 );
    }
} catch ( err ) {
    console.log( chalk.red( 'An exception occured.' ) );
    console.log( err );
    process.exit( 1 );
}
