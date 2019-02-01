var Uploader = require('html5-uploader')
var template = require('underscore').template
var humanize = require('humanize')
var single = require('./single')
var multiple = require('./multiple')
var CovalLib = require('coval.js')
var Coval =  new CovalLib.Coval()
var hdkey = new Coval.Secure.HDKey()
var user = new Coval.User.Server()
const rai = require('random-access-idb')
var connectToGateway = require('./websocket')
var hyperdrive = require('hyperdrive')
const encryption = require('crypto')
var share, emblem
var storageLocation = 'EmblemFileVault-storage'
var sha256 = require('js-sha256').sha256
window.encryption = encryption
window.User = user
window.sha256 = sha256
window.rai = rai
window.hyperdrive = hyperdrive
window.connectToGateway = connectToGateway
window.Coval = Coval
window.hdkey = hdkey
window.keys = []
try {
    window.$ = window.jQuery = require('../bower_components/jquery/dist/jquery')
} catch (e) { }

window.getWallet = function() {
    if (!localStorage.getItem(storageLocation)) {
        window.checkForAuth(getWallet)                  
    } else {
        if (!JSON.parse(localStorage.getItem(storageLocation))[0].address) {
            var token = JSON.parse(localStorage.getItem(storageLocation))[0].accessToken
            window.checkForAuth(function(){
                window.hdkey.StandardHDKey('0', function(address, key){
                    localStorage.setItem(storageLocation, JSON.stringify([{address: address, key:key, accessToken: token}]))
                    window.keys[0] = {address: address, key: key, accessToken: token}
                    window.getBalance()
                    window.getWallet()
                })                            
            })                        
        } else {
            window.checkForAuth(function(){
                window.keys = JSON.parse(localStorage.getItem(storageLocation))
                var address = keys[0].address
                var id = keys[0].accessToken.unloq_id
                var key = keys[0].accessToken.unloq_key
                single(address, id, key)
                multiple(address, id, key)

                $(".my-address").text(keys[0].address)
                window.getBalance()
                //publishPubkey()
                //pubnubInit()
                
            })
        }
    }                
}
window.getBalance = function() {
    var queryURL = "http://sandboxbeta.myemblemwallet.com/balance?address=" + keys[0].address + "&nocache=" + rnd()
    
    $.ajax({
        url: queryURL,
        context: document.body
    }).done(function(val) {
        emblem = val
    })
}
window.rnd = function(){
    return Math.floor(Math.random() * (1000000 - 1) + 1)
}
window.checkForAuth = function (callback) {
    var storage = JSON.parse(localStorage.getItem(storageLocation))
    if (!storage || !storage[0].accessToken) {
        if (window.location.hash.split('?')[0] === "#register") {
            console.log("Register!!")
        } else if (window.location.hash.split('?')[0] === "#confirm") {
            console.log("Confirm")
        } else {
            window.generateEncryptionKey()
        }
    } else {
        return callback()
    }
}

window.generateEncryptionKey = function() {
    window.getNucypherPubkey(key=>{
        var id = Math.floor(Math.random() * (1000000 - 1) + 1)
        var accessToken = mockUnloq(id, key.key.privkey.hex, key)
        window.handleLoginSuccess(accessToken)
    })
}
window.mockUnloq = function(id, key, pk){
    var mock = { 
        "method": "MOCK", 
        "email": "", 
        "unloq_id": id.toString(),
        "unloq_key": key,
        "token": "", 
        "url": "",
        "pk": pk
    }
    return mock
}
 window.reset = function() {
    localStorage.clear()
    window.location.reload()
}

window.handleLoginSuccess = function(accessToken) {
    var storage
    if (!localStorage.getItem(storageLocation)) {
        storage = [{accessToken: null}]
    } else {
        storage = JSON.parse(localStorage.getItem(storageLocation))
    }
    storage[0].accessToken = accessToken
    localStorage.setItem(storageLocation, JSON.stringify(storage))
    //$('.ui.login.modal').modal('hide')
    window.getWallet()
}
$( document ).ready(function() {
    window.getWallet()
})
window.getNucypherPubkey = function(cb) {
    var queryURL = "http://35.194.8.86/nucypher-key"
    $.ajax({
        url: queryURL,
        context: document.body
    }).done(function(payload) {
        console.log("made nucypher key", payload)
        return cb(payload)
    })    
}
window.saveEmblem = function(res){
    if (!keys[0].emblems) {
        keys[0].emblems = []
    }
    var emblemResponse = JSON.parse(res)
    saveShadow(emblemResponse, (status)=>{
        if (status.localDownloadLength > status.remoteDownloadLength) return 
        if (keys[0].emblems.filter(item=>{return item.shadowKey === emblemResponse.shadowKey}).length < 1) {
            keys[0].emblems.push(emblemResponse)
            localStorage.setItem(storageLocation, JSON.stringify(keys))
            saveSecret(emblemResponse, (status)=>{
                if (status.localDownloadLength > status.remoteDownloadLength) return 
                console.log('saved secret dat')
            })
        }
    })    
}

window.saveShadow = function(res, cb){
    var key = res.shadowKey.replace('dat://', '')
    var storage = rai('shadow-'+ key )
    var archive = hyperdrive(storage, key)
    connectToGateway(archive, onlyAllowOneCall(cb), ()=>{console.log("Connecting to gateway to sync dat")})
}
window.saveSecret = function(res, cb){
    var key = res.secretKey.replace('dat://', '')
    var storage = rai('secret-'+ key )
    var archive = hyperdrive(storage, key)
    connectToGateway(archive, onlyAllowOneCall(cb), ()=>{console.log("Connecting to gateway to sync dat")})
}

window.readShadow = function(key, cb){
    var storage = rai('shadow-'+ key )
    var archive = hyperdrive(storage, key)
    archive.readFile('shadow.json', 'utf8', (err, contents) => {
        return cb(err, contents)
    })
}

window.readSecret = function(key, fileName, cb){
    var storage = rai('secret-'+ key )
    var archive = hyperdrive(storage, key)
    archive.readFile(fileName, (err, contents) => {
        return cb(err, contents.toString())
    })
}

window.decryptDat = function(emblemName){
    var emblem = findEmblemByName(emblemName)
    var decryptionKey = new Buffer(User.Combine(emblem.emblem.shares.value).GetValue(), "hex")
    
    readShadow(emblem.shadowKey.replace('dat://', ''), (err, val)=>{
        var stats = JSON.parse(val)
        function readFile(key, index, cb){
            var file = stats.files[index]
            readSecret(key, file.hash+".enc", (err, decoded)=>{
                var decrypted = decrypt(decoded, decryptionKey)
                console.log("filename", file.name)
                //console.log('%c       ', 'font-size: 100px; background: url('+window.btoa(decrypted.toString('hex'))+') no-repeat;')
                if (stats.files.length === index + 1) {
                    return cb()
                } else {
                    return readFile(key, index + 1, cb)
                }
            })
        }
        readFile(emblem.secretKey.replace('dat://', ''), 0, ()=>{
            console.log("Complete")
        })
        
    })
}

window.findEmblemByName = function(emblemName){
    return keys[0].emblems.filter(emblem => {
        return  emblem.emblem.payload.import_response.name === emblemName ||
                emblem.emblem.payload.provided_name === encodeURI(emblemName) || 
                emblem.emblem.payload.provided_name === emblemName
    })[0]
}

function onlyAllowOneCall(fn){
    var hasBeenCalled = false;    
    return function(){
         if (!hasBeenCalled){
              //throw Error("Attempted to call callback twice")
              hasBeenCalled = true
              return fn.apply(this, arguments)
         } else {

         }
         
         
    }
}

function decrypt (text, key) {
    try {
      let textParts = text.split(':')
      let iv = Buffer.from(textParts.shift(), 'hex')
      let encryptedText = Buffer.from(textParts.join(':'), 'hex')
      let decipher = encryption.createDecipheriv('aes-256-cbc', key, iv)
      let decrypted = decipher.update(encryptedText)
  
      decrypted = Buffer.concat([decrypted, decipher.final()])
  
      return decrypted.toString()
    } catch (err) {
      throw err
    }
  }


