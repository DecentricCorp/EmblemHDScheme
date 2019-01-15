var express = require('express')
var multer = require('multer')
const atob = require('atob')
var fs = require('fs-extra')
var app = express()

var init = function (cb) {
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
        res.json({ success: true, files: req.files })
    })

    app.listen(3000)
    return cb(app)
}



module.exports = init