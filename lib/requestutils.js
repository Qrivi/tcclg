const request = require( 'sync-request' );
const logUtils = require( './logutils' );
const base64 = require( 'base-64' );

function canConnect( root, path, username, password ) {
    try {
        const url = root.replace( /\/$/, '' ) + path;
        const credentials = base64.encode( `${username}:${password}` );
        const res = request( 'GET', url, { headers: { 'Authorization': `Basic ${credentials}` } } );
        return res.statusCode === 200;
    } catch ( err ) {
        // Telenet JIRA or TC are not reachable when not on the VPN.
        return false;
    }
}

function getBuildNumber( url ) {
    try {
        const res = request( 'GET', url );
        const build = res.body.toString().match( /[_rl\d\.]+-r\d+/ );
        return build[ 0 ] ? build[ 0 ] : false;
    } catch ( err ) {
        // This will be thrown if connecting over HTTPS and certificate is invalid
        return false;
    }
}

function getChanges( teamcity, project ) {
    try {
        const url = `${teamcity.url.replace(/\/$/, '')}/httpAuth/app/rest/builds?locator=count:100,buildType:${project.buildType},branch:${project.branch},sinceBuild:(buildType:${project.buildType},branch:${project.branch},number:${project.build})&fields=build:(number,branchName,finishDate,changes(change(username,comment)))`;
        const credentials = base64.encode( `${teamcity.username}:${teamcity.password}` );
        const res = request( 'GET', url, { headers: { 'Accept': 'application/json', 'Authorization': `Basic ${credentials}` } } );
        const json = JSON.parse( res.body.toString() );
        logUtils.writeRequest( 'teamcity', 'GET', url, json );

        const builds = json.build;
        if( !builds.length ) {
            console.log( `Sorry no new builds since ${project.build}.` );
            return false;
        }

        const changes = builds.map( build => build.changes.change ).flat();
        if( !changes.length ) {
            console.log( `Sorry no changes since ${project.build}.` );
            return false;
        }

        const commits = changes.map( change => change.comment );
        return commits;
    } catch ( err ) {
        // Telenet JIRA or TC are not reachable when not on the VPN.
        return false;
    }
}

module.exports = { canConnect, getBuildNumber, getChanges };
