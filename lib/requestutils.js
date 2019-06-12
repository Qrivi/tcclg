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

function getChanges( project, teamcity ) {
    try {
        const url = `${teamcity.url.replace(/\/$/, '')}/httpAuth/app/rest/builds?locator=count:100,buildType:${project.buildType},branch:${project.branch},sinceBuild:(buildType:${project.buildType},branch:${project.branch},number:${project.build})&fields=build:(number,branchName,finishDate,changes(change(username,comment)))`;
        const credentials = base64.encode( `${teamcity.username}:${teamcity.password}` );
        const res = request( 'GET', url, { headers: { 'Accept': 'application/json', 'Authorization': `Basic ${credentials}` } } );
        const json = JSON.parse( res.body.toString() );
        logUtils.tcRequest( 'teamcity', 'GET', url, json );

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

function getIssues( changes, jiras ){
    const acceptedKeys = new RegExp( `^((${jiras.filter(j => j.include === true).map(j => j.projectKey).join('|')})-\\d+)[: ]`, 'i' ); 
    const keys = [];
    const issues = [];
    
    changes.forEach(change => {
        const key = change.trim().match( acceptedKeys ) ? change.trim().match( acceptedKeys )[1].toUpperCase() : false;
        if( key && !keys.includes(key) ){
            keys.push(key);
            const jira = jiras.find( j => j.projectKey === key.split('-')[0]);        
            const details = getIssueDetails(key, jira);
            if( details && jira.acceptedStatusses.includes(details.status) )
                issues.push( {
                    key: key,
                    link: `${jira.url}/browse/${key}`,
                    status: details.status,
                    title: details.title
                } );
            else if( details ) 
                console.log( `Issue ${key} has status ${details.status} which is not accepted`);
            else
                console.log( `Could not fetch issue details for ${key}. >:(`);
        }
    });
}

function getIssueDetails( key, jira ){
    try {
        const url = `${jira.url.replace(/\/$/, '')}/rest/api/2/issue/${key}`;
        const credentials = base64.encode( `${jira.username}:${jira.password}` );
        const res = request( 'GET', url, { headers: {  'Authorization': `Basic ${credentials}` } } );
        const json = JSON.parse( res.body.toString() );
        return {
            title: json.fields.summary,
            status: json.fields.status.name
        }
    } catch ( err ) {
        // This will be thrown if connecting over HTTPS and certificate is invalid
        return false;
    }
}

module.exports = { canConnect, getBuildNumber, getChanges, getIssues };
