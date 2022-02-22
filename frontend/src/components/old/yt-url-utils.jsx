// https://github.com/fent/node-ytdl-core/blob/master/lib/url-utils.js
const validQueryDomains = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'music.youtube.com',
    'gaming.youtube.com',
]);

const validPathDomains = /^https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/(embed|v|shorts)\/)/;
var getURLVideoID = link => {
    const parsed = new URL(link);
    let id = parsed.searchParams.get('v');
    if (validPathDomains.test(link) && !id) {
        const paths = parsed.pathname.split('/');
        id = parsed.host === 'youtu.be' ? paths[1] : paths[2];
    } else if (parsed.hostname && !validQueryDomains.has(parsed.hostname)) {
        throw Error('Not a YouTube domain');
    }
    if (!id) {
        throw Error(`No video id found: ${link}`);
    }
    id = id.substring(0, 11);
    if (!exports.validateID(id)) {
        throw TypeError(`Video id (${id}) does not match expected ` +
            `format (${idRegex.toString()})`);
    }
    return id;
};

const idRegex = /^[a-zA-Z0-9-_]{11}$/;
var validateID = id => idRegex.test(id);

const urlRegex = /^https?:\/\//;
var getVideoID = str => {
    if (validateID(str)) {
        return str;
    } else if (urlRegex.test(str)) {
        return getURLVideoID(str);
    } else {
        throw Error(`No video id found: ${str}`);
    }
};

var validateURL = string => {
    try {
        exports.getURLVideoID(string);
        return true;
    } catch (e) {
        return false;
    }
};

export {validateURL, getVideoID};