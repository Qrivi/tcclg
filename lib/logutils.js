const fs = require( 'fs' );

const outputDir = './output/';
const logger = fs.createWriteStream( `${outputDir}/tcclg.log`, { flags: 'a' } );

function unchalk( string ) {
    return string.replace( /.\[\d{1,2}m/g, '' );
}

async function tcRequest( name, method, url, response ) {
    const date = new Date();
    const content = `${date.toLocaleString()}\n${method} ${url}\n${JSON.stringify(response, null, 2)}\n\n\n`;
    return await fs.appendFile( `${outputDir}/${name}.log`, content, ( err ) => {
        if( err )
            throw err;
    } );
}

async function log( message ) {
    const date = new Date();
    console.log( message );
    logger.write( '\n' );
    logger.write( message.split( '\n' ).map( line => `${date.toLocaleString()} | INFO  | ${unchalk( line )}` ).join( '\n' ) );
}

async function warn( message ) {
    const date = new Date();
    console.warn( message );
    logger.write( '\n' );
    logger.write( message.split( '\n' ).map( line => `${date.toLocaleString()} | WARN  | ${unchalk( line )}` ).join( '\n' ) );
}

async function error( message ) {
    const date = new Date();
    console.error( message );
    logger.write( '\n' );
    logger.write( message.split( '\n' ).map( line => `${date.toLocaleString()} | ERROR | ${unchalk( line )}` ).join( '\n' ) );
}

module.exports = { tcRequest, log, warn, error };
