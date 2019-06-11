const fs = require( 'fs' );

const outputDir = './output/';

async function writeRequest( name, method, url, response ) {
    const date = new Date();
    const content = `${date.toLocaleString()}\n${method} ${url}\n${JSON.stringify(response, null, 2)}\n\n\n`;
    return await fs.appendFile( `${outputDir}/${name}.log`, content, ( err ) => {
        if( err )
            throw err;
    } );
}

module.exports = { writeRequest };
