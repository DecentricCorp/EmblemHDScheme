var express = require('express')
var multer = require('multer')
const atob = require('atob')
var fs = require('fs-extra')
var EmblemHDModule = require('./')
var EmblemHD = new EmblemHDModule().publicMethods
var HypercoreDaemon = require('./hypercored')
var app = express()

var init = function (eventHooks, cb) {
    HypercoreDaemon.init(eventHooks)
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*")
        res.header("Access-Control-Allow-Headers", "X-Requested-From")
        next()
    })
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

    var upload = multer({ storage: storage })
    var uploadedFiles = upload.fields([
        { name: 'file' }
    ])
    app.post('/', uploadedFiles, function (req, res, next) {
        var destination = req.files.file[0].destination.replace('//', '/').split('/')
        destination.pop()
        destination = destination.join('/')
        var rootKey = EmblemHD.generateRootKey()
        var storeDatsPromise = EmblemHD.storeShadowedAsync(rootKey, {src: destination})
        storeDatsPromise.then((datCollections)=>{
            datCollections.shadowCollection.then(shadowDats=>{
                var shadow = shadowDats[0].dat
                datCollections.secretCollection.then(secretCollection=>{
                    var secret = secretCollection[0].dat
                    shadow.joinNetwork()
                    var shadowKey = 'dat://'+shadow.key.toString('hex')
                    secret.joinNetwork()
                    var secretKey = 'dat://'+secret.key.toString('hex')
                    shadow.archive.readFile('/shadow.json', function (err, content) {
                        var shadowJson = JSON.parse(content.toString())
                        res.json({ success: true, shadow: shadowJson, shadowKey: shadowKey, secretKey: secretKey })
                    })
                })
            })            
        })        
    })
    return cb(app)
}



module.exports = init