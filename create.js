const ManyKeys = require('coval.js/build/secure/ManyKeys').ManyKeys
const RequestUtil = require('./util/request-util.js')
const response = require('./util/response-util').response
const SHA256 = require('crypto-js/sha256')
const fatalStatusCodeError = require('./util/error-util.js').fatalStatusCodeError
var UserUtil = require('./util/coval-util.js')
var User
const Verbose = false

module.exports = async function(context) {
    User = UserUtil.createAgentUser()
    if (!context || !context.request || !context.request.query) {
        fatalStatusCodeError('Need to specify context with request and query')
    }
    const query = context.request.query
    if (query.unloq_id && !query.unloq_key) {
        fatalStatusCodeError(`UnloqID ${query.unloq_id} was provided without an UnloqKey`)
    }
    const key = query.key ? query.key : User.Generate().GetValue()
    if (query.key) User.SetKey(key)
    const shares = User.Split(2, 2, 256)
    const whitelistedAddresses = await getWhitelistedAddresses(key)

    const payload = {
        emblem_type: query.pvt ? "private" : "public",
        encrypted: 'not used'/* JSON.parse(await RequestUtil.encrypt(key)).payload.encrypted */,
        addresses: whitelistedAddresses,
        encrypted_addresses: {}
    }
    if (!query.unloq_id || query.name) payload.provided_name = query.name

    let encryptedUserShare, encryptedIdentityShare
    if (query.unloq_id) {
        payload.origPubkey = JSON.parse(await RequestUtil.nucypherKey(query.unloq_key)).key.pubkey.hex
        payload.UserKey = query.unloq_key
        encryptedUserShare = await RequestUtil.userEncrypt(query.unloq_key, shares.GetValue()[0])
        payload.nucypher_user_encrypt = await RequestUtil.fromURL(createEncryptPOST(shares.GetValue()[0], payload.UserKey), "nucypher_user_encrypt")

        const identitySharePayload = JSON.stringify({
            user: JSON.parse(encryptedUserShare).encrypted,
            identity: shares.GetValue()[1]
        })
        const identityKey = SHA256(payload.origPubkey + process.env.MULTICHAINpass).toString()
        encryptedIdentityShare = await RequestUtil.userEncrypt(identityKey, identitySharePayload)
        payload.IDKey = identityKey

        const nucypherIdentitySharePayload = JSON.stringify({
            user: JSON.parse(encryptedUserShare).encrypted,
            identity: shares.GetValue()[1],
            user_nucypher: payload.nucypher_user_encrypt
        })
        payload.nucypher_id_encrypt = await RequestUtil.fromURL(createEncryptPOST(nucypherIdentitySharePayload, payload.IDKey), "nucypher_id_encrypt")

        if (query.pvt) {
            payload.encrypted_addresses = await encryptAddresses(query.unloq_key, whitelistedAddresses)
            if (query.name) {
                payload.provided_encrypted_name = JSON.parse(await RequestUtil.userEncrypt(query.unloq_key, query.name)).encrypted
            }
        }
    }

    /*  backward compatability allows for this to be optional, 
        providing the address makes the import call more secure 
        by offloading that work to server agent */
    if (query.address) {
        payload.import_response = JSON.parse(await RequestUtil.addressImport(query.address))
        // if (isHash(payload.import_response.emblem)) { // publish to stream
            await publishAddressAndUpdatePayload(JSON.stringify(payload.emblem_type === "private" ? payload.encrypted_addresses : payload.addresses), 'contents', 'contents_stream_response')
            await publishAddressAndUpdatePayload(payload.emblem_type, 'emblem_type', 'type_stream_response')
            if (query.name) {
                const providedName = payload.emblem_type === "private" ? payload.provided_encrypted_name : payload.provided_name
                await publishAddressAndUpdatePayload(providedName, 'name', 'name_stream_response')
            }
            if (query.unloq_id) {
                await publishAddressAndUpdatePayload(JSON.parse(encryptedIdentityShare).encrypted, 'piece', 'id_piece_stream_response')
                await publishAddressAndUpdatePayload(JSON.stringify(payload.nucypher_id_encrypt), 'nucypher_piece', 'nucypher_id_piece_stream_response')
            }
        // }
    }

    return formResponse()

    async function publishAddressAndUpdatePayload(data, type, container, logging = Verbose) { // FIXME side effects (modifying Payload)
        const response = await RequestUtil.fromURL(createAddressPublishPOST(data, type, payload.import_response.name), container, logging)
        if (Object.keys(response) === ['error']) {
            return formResponse()
        } else payload[container] = response
    }

    function formResponse() {
        const body = {
            payload: payload,
            key_action: query.key ? 'Loaded Entropy' : 'Generated Entropy',
            shares: shares
        }
        if (query.unloq_id) {
            body.my_share = JSON.parse(encryptedUserShare).encrypted
            body.id_share = JSON.parse(encryptedIdentityShare).encrypted
        }
        return response(body)
    }
}

async function getWhitelistedAddresses(key) {
    const whitelist = [
        "bitcoin",
        "bitcoincash",
        "bitcoindark",
        "bitcoingold",
        "blackcoin",
        "blocknet",
        "canadaecoin",
        "coval",
        "dash",
        "digibyte",
        "dogecoin",
        "dogecoindark",
        "emercoin",
        "ethereum",
        "feathercoin",
        "florincoin",
        "gridcoinresearch",
        "gulden",
        "litecoin",
        "magicoin",
        "myriadcoin",
        "namecoin",
        "navcoin",
        "neoscoin",
        "paccoin",
        "particl",
        "peercoin",
        "pinkcoin",
        "pivx",
        "potcoin",
        "primecoin",
        "reddcoin",
        "riecoin",
        "stratis",
        "syscoin",
        "trezarcoin",
        "vcash",
        "vergecoin",
        "vertcoin",
        "viacoin",
        "zcash"
    ]
    const ethereumAddressJSON = JSON.parse(await RequestUtil.ethAddress(key)).address
    const otherAddresses = new ManyKeys(key).GetAllAddresses()
    const allAddresses = {...otherAddresses, "ethereum": {"address": ethereumAddressJSON, "unit": "eth"}};

    const whitelisted = {}
    for (let i = 0; i < whitelist.length; i++) {
        const addressType = whitelist[i]
        if (allAddresses[addressType]) {
            whitelisted[addressType] = {address: allAddresses[addressType].address, unit: allAddresses[addressType].unit}
        }
    }
    return whitelisted
}

function isHash(emblem) {
    return typeof (emblem) !== 'object'
}

async function encryptAddresses(encryptionKey, addressesToEncrypt) {
    const encrypted = {}
    for (let i = 0; i < Object.keys(addressesToEncrypt).length; i++) {
        const item = Object.keys(addressesToEncrypt)[i]
        const encryptedAddressJSON = JSON.parse(await RequestUtil.userEncrypt(encryptionKey, addressesToEncrypt[item].address)).encrypted
        encrypted[item] = {address: encryptedAddressJSON, unit: addressesToEncrypt[item].unit}
    }
    return encrypted
}

/* Nucypher */
function createEncryptPOST(share, key) {
    return {
        method: 'POST',
        url: 'http://35.194.8.86/encrypt',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        form: {
            to_encrypt: share,
            unloq_key: key
        },
        json: true // Automatically stringifies the body to JSON
    }
}

function createAddressPublishPOST(data, type, name) {
    data = Buffer.from(data).toString('hex');
    return {
        method: 'GET',
        uri: 'http://35.225.9.182/publish?type='+type+'&name='+name+'&data='+data,
        json: false // Automatically stringifies the body to JSON
    }
}