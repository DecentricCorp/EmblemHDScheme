const RequestPromise = require('request-promise-native')

async function fromURL(url) {
    let val = ''
    await RequestPromise(url)
        .then(response => {
            // console.log('Response', response)
            val = response
        })
        .catch(err => {
            console.log('ERROR', `${err.name}: ${err.statusCode} at ${url}`)
            val = {error: err}
        })
    return val
}

async function addressBalances(address) {
    return await fromURL('http://34.67.105.21/balance?address=' + address)
}

async function nucypherKey(key) {
    return await fromURL('http://130.211.216.162/nucypher-key?key=' + key)
}

async function streamRetrieve(streamKey) {
    return await fromURL('http://34.67.105.21/retrieve?stream_key=' + streamKey + ':piece')
}

async function ethAddress(key) {
    return await fromURL('http://34.67.105.21/eth-address?key=' + key)
}

async function encrypt(key) {
    return await fromURL('http://34.67.105.21/encrypt?key=' + key)
}

async function addressImport(address) {
    return await fromURL('http://34.67.105.21/import?address=' + address)
}

async function userEncrypt(key, value) {
    return await fromURL('http://34.67.105.21/encrypt?key=' + key + '&to_encrypt=' + value)
}

module.exports.fromURL = fromURL
module.exports.addressBalances = addressBalances
module.exports.nucypherKey = nucypherKey
module.exports.streamRetrieve = streamRetrieve
module.exports.ethAddress = ethAddress
module.exports.encrypt = encrypt
module.exports.addressImport = addressImport
module.exports.userEncrypt = userEncrypt
