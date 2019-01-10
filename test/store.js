const expect = require('chai').expect
var path = require('path')
var fs = require('fs-extra')
const EmblemHD = require('../')
const RootKey = EmblemHD.generateRootKey()
var http = require('http');

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
                    expect(shadowJson.files[0].name).to.equal('/file1.txt')
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
                    expect(shadowJson.files[0].name).to.equal('/file1.txt')
                    expect(shadowJson.files[1].name).to.equal('/file2.txt')
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
                    expect(shadowJson.files[0].name).to.equal('/file1.txt')
                    expect(shadowJson.files[1].name).to.equal('/file2.txt')
                    expect(shadowJson.files[2].name).to.equal('/file3.txt')
                    expect(shadowJson.files[3].name).to.equal('/sub/file3.txt')
                    dat.close()
                    done()
                })
            })            
        })
    })

    it('should hash file content', (done)=>{
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
})