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
            key[0].dat.importFiles(src, function () {
                var archive = key[0].dat.archive
                var dat = key[0].dat
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
            key[0].dat.importFiles(src, function () {
                var dat = key[0].dat
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
})