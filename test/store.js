const expect = require('chai').expect
var path = require('path')
var fs = require('fs-extra')
const EmblemHD = require('../')
const RootKey = EmblemHD.generateRootKey()
var http = require('http')
var crypto = require('crypto')
var stream = require('stream')
const zlib = require('zlib')

const HASHMock = {
    'fileContentHashs': {
        'file1' : "3c9683017f9e4bf33d0fbedd26bf143fd72de9b9dd145441b75f0604047ea28e",
        'file2' : "0537d481f73a757334328052da3af9626ced97028e20b849f6115c22cd765197",
        'file3' : "89dc6ae7f06a9f46b565af03eab0ece0bf6024d3659b7e3a1d03573cfeb0b59d"
    },
    'filePaths' : {
        'file1': "/file1.txt",
        'file2': "/file2.txt",
        'file3': "/file3.txt",
        'file3Sub': "/sub/file3.txt"
    }
}

describe('Dat storage', ()=>{
    before(()=>{
        var src = path.join(__dirname, '..', 'dats')
        fs.ensureDirSync(src)
    })

    it('stores data in single dat', (done)=>{
        var keys = EmblemHD.deriveAsync(RootKey, 'privateKey', {qty: 1, storage: "ram", "import":true})
        keys.then(key=>{
            var src = path.join(__dirname, '..', 'imports')
            var dat = key[0].dat
            dat.importFiles(src, function () {
                var archive = dat.archive
                archive.readFile('/file1.txt', function (err, content) {
                    expect(content.toString()).to.equal("value1")
                    dat.close()
                    done()
                })
            })
        })
    })

    it('dat is servable over http', (done)=>{
        var keys = EmblemHD.deriveAsync(RootKey, 'privateKey', {qty: 1, storage: "ram", "import":true})
        keys.then(key=>{
            var src = path.join(__dirname, '..', 'imports')
            var dat = key[0].dat
            dat.importFiles(src, function () {                
                dat.serveHttp()      
                http.get({
                    host: 'localhost',
                    port: 8080,
                    path: '/file1.txt'
                }, (response)=>{
                    var body = '';
                    response.on('data', function(d) {
                        body += d;
                    });
                    response.on('end', function() {
                        expect(body).to.equal("value1")
                        dat.close()
                        done()
                    })
                })
            })
        })
    })

    it('should return secret and shadowed collection when passed folder path', (done)=>{
        var src = path.join(__dirname, '..', 'imports')
        var storeDatsPromise = EmblemHD.storeShadowedAsync(RootKey, {src: src})
        storeDatsPromise.then((dats)=>{
            expect(dats).to.have.property('secretCollection')
            expect(dats).to.have.property('shadowCollection')
            done()
        })
    })
    it('should be able to read metadata from shadowed collection of one file', (done)=>{
        var src = path.join(__dirname, '..', 'imports')
        var storeDatsPromise = EmblemHD.storeShadowedAsync(RootKey, {src: src})
        storeDatsPromise.then((dats)=>{
            dats.shadowCollection.then(shadowCollection=>{
                var dat = shadowCollection[0].dat
                var archive = dat.archive
                archive.readFile('/shadow.json', function (err, content) {
                    var shadowJson = JSON.parse(content.toString())
                    expect(shadowJson).to.have.property('files')
                    expect(shadowJson.files[0].name).to.equal(HASHMock.filePaths.file1)
                    dat.close()
                    done()
                })
            })            
        })
    })
    it('should be able to read metadata from shadowed collection of multiple files', (done)=>{
        var src = path.join(__dirname, '..', 'multifileImports')
        var storeDatsPromise = EmblemHD.storeShadowedAsync(RootKey, {src: src})
        storeDatsPromise.then((dats)=>{
            dats.shadowCollection.then(shadowCollection=>{
                var dat = shadowCollection[0].dat
                var archive = dat.archive
                archive.readFile('/shadow.json', function (err, content) {
                    var shadowJson = JSON.parse(content.toString())
                    expect(shadowJson.files.length).to.equal(2)
                    expect(shadowJson.files[0].name).to.equal(HASHMock.filePaths.file1)
                    expect(shadowJson.files[1].name).to.equal(HASHMock.filePaths.file2)
                    dat.close()
                    done()
                })
            })
            
        })
    })
    it('should be able to read metadata from shadowed collection of multiple and nested files', (done)=>{
        var src = path.join(__dirname, '..', 'multifileNestedImports')
        var storeDatsPromise = EmblemHD.storeShadowedAsync(RootKey, {src: src})
        storeDatsPromise.then((dats)=>{
            dats.shadowCollection.then(shadowCollection=>{
                var dat = shadowCollection[0].dat
                var archive = dat.archive
                archive.readFile('/shadow.json', function (err, content) {
                    var shadowJson = JSON.parse(content.toString())
                    expect(shadowJson.files.length).to.equal(4)
                    expect(shadowJson.files[0].name).to.equal(HASHMock.filePaths.file1)
                    expect(shadowJson.files[1].name).to.equal(HASHMock.filePaths.file2)
                    expect(shadowJson.files[2].name).to.equal(HASHMock.filePaths.file3)
                    expect(shadowJson.files[3].name).to.equal(HASHMock.filePaths.file3Sub)
                    dat.close()
                    done()
                })
            })            
        })
    })

    it('should hash file content into shadow metadata', (done)=>{
        var src = path.join(__dirname, '..', 'multifileNestedImports')
        var storeDatsPromise = EmblemHD.storeShadowedAsync(RootKey, {src: src})
        storeDatsPromise.then((dats)=>{
            dats.shadowCollection.then(shadowCollection=>{
                var dat = shadowCollection[0].dat
                var archive = dat.archive
                archive.readFile('/shadow.json', function (err, content) {
                    var shadowJson = JSON.parse(content.toString())
                    expect(shadowJson.files[0].hash).to.not.equal(shadowJson.files[1].hash)
                    expect(shadowJson.files[2].hash).to.equal(shadowJson.files[3].hash)
                    dat.close()
                    done()
                })
            })            
        })
    })

    it('should encrypt secret collection content', (done)=>{
        var src = path.join(__dirname, '..', 'imports')
        var storeDatsPromise = EmblemHD.storeShadowedAsync(RootKey, {src: src})
        storeDatsPromise.then((dats)=>{
            dats.secretCollection.then(secretCollection=>{
                var dat = secretCollection[0].dat
                var archive = dat.archive
                archive.readFile("\\" +HASHMock.fileContentHashs.file1 + ".enc", function (err, content) {
                    expect(content.toString()).to.not.equal('value1')
                    dat.close()
                    done()
                })
            })            
        })
    })

    it('secret collection content should be decryptable', (done)=>{
        var encryptionKey = RootKey.privateKey.toBuffer()
        var src = path.join(__dirname, '..', 'imports')
        var storeDatsPromise = EmblemHD.storeShadowedAsync(RootKey, {src: src})
        storeDatsPromise.then((dats)=>{
            dats.secretCollection.then(secretCollection=>{
                var dat = secretCollection[0].dat
                var archive = dat.archive
                archive.readFile("\\" +HASHMock.fileContentHashs.file1 + ".enc", function (err, content) {
                    var decrypted = decrypt(content.toString(), encryptionKey)
                    expect(decrypted).to.equal('value1')
                    dat.close()
                    done()
                })
            })            
        })
    })

    function decrypt (text, key) {
        try {
          let textParts = text.split(':')
          let iv = Buffer.from(textParts.shift(), 'hex')
          let encryptedText = Buffer.from(textParts.join(':'), 'hex')
          let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
          let decrypted = decipher.update(encryptedText)
      
          decrypted = Buffer.concat([decrypted, decipher.final()])
      
          return decrypted.toString()
        } catch (err) {
          throw err
        }
      }
})