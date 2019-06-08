const request = require('sync-request');
const base64 = require('base-64');

function canConnect( url, path, username, password ) {
    // return true;
    try{
        url = url.replace(/\/$/, "") + path;
        const credentials = base64.encode(`${username}:${password}`);
        const res = request('GET', url, { headers: { 'Authorization': `Basic ${credentials}`}});
        return res.statusCode === 200;
    }catch(err){
        // Telenet JIRA or TC are not reachable when not on the VPN.
        return false;
    }
}

function getBuildNumber( url ){
    try{
        const res = request( 'GET', url );
        const build = res.body.toString().match(/[_rl\d\.]+-r\d+/);
        return build[0] ? build[0] : false;
    }catch(err){
        // This will be thrown if connecting over HTTPS if certificate is invalid
        return false;
    }
}

module.exports = {canConnect, getBuildNumber};