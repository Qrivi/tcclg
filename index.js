#!/usr/bin/env node

const fs = require( 'fs' );
const chalk = require( 'chalk' );
const clear = require( 'clear' );
const figlet = require( 'figlet' );
const configUtils = require( './lib/configutils' );

async function run(){
    if( await configUtils.verify( config ) ) {
        console.log('\nLet\'s get this bread');
    } else {
        console.log( 'Please fix your configuration and try again.' );
        process.exit( 0 );
    }
}

clear();
console.log( 
    chalk.blue( figlet.textSync( 'TCCLG', { font: 'speed'} )),
    chalk.blue('\nA gotta go fast changelog generator\n' )
);

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
    console.log( 'Loaded the default configuration.' );
}

try {
    run();
} catch ( err ) {
    console.log( chalk.red( 'An exception occured.' ) );
    console.log( err );
    process.exit( 1 );
}
