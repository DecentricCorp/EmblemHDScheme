var express = require('express')
var multer = require('multer')
var csp = require('./csp')
const atob = require('atob')
var fs = require('fs-extra')
const dbGateway = require('./dbGateway')
var EmblemHDModule = require('./')
var EmblemHD = new EmblemHDModule().publicMethods
var app = express()
const attachWebsocket = dbGateway(app)
var PubNub = require('pubnub')
var pubnub, pubnubOptions
var path = require('path')
var init = function (opts, cb) {
    initPubNub(opts)
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*")
        res.header("Access-Control-Allow-Headers", "X-Requested-From")
        next()
    })
    app.use(express.static(path.join(__dirname, 'public')))
    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            var filePath = atob(file.originalname).split('/')
            var requestPath = req.headers['x-requested-from']
            filePath.pop()
            filePath.join('/')
            var destinationPath = './tmp/' + requestPath + '/' + filePath.join('/') + '/'
            fs.ensureDirSync(destinationPath)
            cb(null, destinationPath)
        },
        filename: function (req, file, cb) {
            var fileName = atob(file.originalname).split('/').pop()
            cb(null, fileName)
        }
    })
    
    app.on('connect', event => {
        console.log("Event!!!", event)
    })
    var upload = multer({ storage: storage })
    var uploadedFiles = upload.fields([
        { name: 'file' }
    ])
    app.post('/', csp, uploadedFiles, function (req, res, next) {
        var address = req.headers['x-requested-from']
        var unloq_id = req.headers['x-requested-id']
        var unloq_key = req.headers['x-requested-key']
        var destination = req.files.file[0].destination.replace('//', '/').split('/')
        destination.pop()
        destination = destination.join('/')
        var rootKey = EmblemHD.generateRootKey()
        var storeDatsPromise = EmblemHD.storeShadowedAsync(rootKey, { src: destination, deleteAfterImport: opts.deleteAfterImport })
        storeDatsPromise.then((datCollections) => {
            datCollections.shadowCollection.then(shadowDats => {
                var shadow = shadowDats[0].dat
                datCollections.secretCollection.then(secretCollection => {
                    var secret = secretCollection[0].dat
                    shadow.joinNetwork()
                    var shadowKey = 'dat://' + shadow.key.toString('hex')
                    secret.joinNetwork()
                    var secretKey = 'dat://' + secret.key.toString('hex')
                    shadow.archive.readFile('/shadow.json', function (err, content) {
                        var shadowJson = JSON.parse(content.toString())
                        pubnubPublish('add', shadowKey.replace('dat://',''))
                        pubnubPublish('add', secretKey.replace('dat://',''))
                        createEmblem(rootKey.privateKey.toString('hex'), unloq_key, unloq_id, address, (emblem)=>{
                            res.json({ success: true, shadow: shadowJson, shadowKey: shadowKey, secretKey: secretKey, emblem: emblem })
                        })
                        
                    })
                })
            })
        })
    })
    function createEmblem(key, unloq_key, unloq_id, address, cb){
        var Create = require('./create')
        var req = {query: {
            address: address,
            name: 'Another%20New%20Name',
            unloq_id: unloq_id,
            pvt: '',
            skip_unloq: 'true',
            unloq_key: unloq_key,
            key: key        
        }}
        Create({request: req}).then(payload=>{
            cb(JSON.parse(payload.body))
        })
    }
    function initPubNub(opts) {
        pubnubOptions = opts
        pubnub = new PubNub({
            subscribeKey: opts.mySubscribeKey || 'demo',
            publishKey: opts.myPublishKey || 'demo',
            secretKey: opts.secretKey || '',
            ssl: true
        })
        pubnub.addListener({
            status: function (statusEvent) {
                
            },
            message: function (envelope) {
                var payload = envelope.message
            },
            presence: function (presenceEvent) {
                // handle presence
            }
        })
        pubnub.subscribe({
            channels: [pubnubOptions.myChannel || 'demo'],
        })
    }
    attachWebsocket(app)
    return cb(app, csp)
}

function pubnubPublish(type, keyHex){
    pubnub.publish(
        {
            message: {"type":type, "keyHex": keyHex},
            channel: pubnubOptions.myChannel,
            sendByPost: false, // true to send via post
            storeInHistory: false, //override default storage options
            meta: { 
                "cool": "meta"
            }   // publish extra meta with the request 
        }, 
        function (status, response) {
            if (status.error) {
                // handle error
                // console.log(status)
            } else {
                // console.log("message Published w/ timetoken", response.timetoken)
            }
        }
    );
}


module.exports = init