var Uploader = require('html5-uploader')
var template = require('underscore').template
var humanize = require('humanize')
var single = require('./single')
var multiple = require('./multiple')
var CovalLib = require('coval.js')
var Coval =  new CovalLib.Coval()
var hdkey = new Coval.Secure.HDKey()
var share, emblem
var storageLocation = 'EmblemFileVault-storage'
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
                    //publishPubkey()
                    //$(".my-address").text(address)
                    window.getBalance()
                })                            
            })                        
        } else {
            window.checkForAuth(function(){
                window.keys = JSON.parse(localStorage.getItem(storageLocation))
                single(window.keys[0].address)
                multiple(window.keys[0].address)

                $(".my-address").text(keys[0].address)
                window.getBalance()
                //publishPubkey()
                //pubnubInit()
                
            })
        }
    }                
}
window.getBalance = function() {
    //$(".loading").show()
    //$(".emblems").html("")
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
    /* var bitcore = hdkey.GetBitcore()
    var id = Math.floor(Math.random() * (1000000 - 1) + 1)
    hdkey.StandardHDKey(id, function(address, key){
        var keysha = bitcore.crypto.Hash.sha256(new Buffer(key.xprivkey)).toString('hex')
        //console.log("keyz", address, key.xprivkey, unloq_key)
        var accessToken = mockUnloq(id, keysha, key.xprivkey)
        handleLoginSuccess(accessToken)
    }) */
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
    keys[0].emblems.push(emblemResponse)
    localStorage.setItem(storageLocation, JSON.stringify(keys))
}

