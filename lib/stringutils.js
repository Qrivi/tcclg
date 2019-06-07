function trimSlash(url){     
    return url.replace(/\/$/, "");
} 

module.exports = {trimSlash};