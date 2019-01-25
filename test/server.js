const expect = require('chai').expect
var path = require('path')
var serverLib = require('../lib.server')
var request = require('request')
var fs = require('fs-extra')
const btoa = require('btoa')
var mime = require('mime')
var app
describe('Emblem Dat server', ()=>{
    before(()=>{
        app = serverLib({deleteAfterImport: false}, (app)=>{
            return app
        })
        app.listen(3000)
    })

    it('processes single file upload', (done)=>{
        var src = path.join(__dirname, '..', 'imports', 'file1.txt')
        var tmpsrc = path.join(__dirname, '..', 'tmp', 'single', 'imports', 'file1.txt')
        var opts = getPostOptions(src, 'single')
        request(opts, function (err, res) {
            if(err) console.log(err)
            var body = JSON.parse(res.body)
            var fileContents = fs.readFileSync(tmpsrc).toString()
            expect(fileContents).to.equal("value1")
            done()
        })
    })
    it('processes multi file upload', (done)=>{
        var src1 = path.join(__dirname, '..', 'multifileImports', 'file1.txt')
        var src2 = path.join(__dirname, '..', 'multifileImports', 'file2.txt')
        var tmpsrc1 = path.join(__dirname, '..', 'tmp', 'multi', 'multifileImports', 'file1.txt')
        var tmpsrc2 = path.join(__dirname, '..', 'tmp', 'multi', 'multifileImports', 'file2.txt')
        var opts = getPostOptions([src1, src2], 'multi')
        request(opts, function (err, res) {
            if(err) console.log(err)
            var body = JSON.parse(res.body)
            expect(body.shadow.files.length).to.equal(2)
            var fileContents1 = fs.readFileSync(tmpsrc1).toString()
            var fileContents2 = fs.readFileSync(tmpsrc2).toString()
            expect(fileContents1).to.equal("value1")
            expect(fileContents2).to.equal("value2")
            done()
        })
    })
    it('processes nested multi file upload', (done)=>{
        var src1 = path.join(__dirname, '..', 'multifileNestedImports', 'file1.txt')
        var src2 = path.join(__dirname, '..', 'multifileNestedImports', 'file2.txt')
        var src3 = path.join(__dirname, '..', 'multifileNestedImports', 'file3.txt')
        var src4 = path.join(__dirname, '..', 'multifileNestedImports', 'sub', 'file3.txt')
        var tmpsrc1 = path.join(__dirname, '..', 'tmp', 'nested', 'multifileNestedImports', 'file1.txt')
        var tmpsrc2 = path.join(__dirname, '..', 'tmp', 'nested', 'multifileNestedImports', 'file2.txt')
        var tmpsrc3 = path.join(__dirname, '..', 'tmp', 'nested', 'multifileNestedImports', 'file3.txt')
        var tmpsrc4 = path.join(__dirname, '..', 'tmp', 'nested', 'multifileNestedImports', 'sub', 'file3.txt')
        var opts = getPostOptions([src1, src2, src3, src4], 'nested')
        request(opts, function (err, res) {
            if(err) console.log(err)
            var body = JSON.parse(res.body)
            expect(body.shadow.files.length).to.equal(4)
            var fileContents1 = fs.readFileSync(tmpsrc1).toString()
            var fileContents2 = fs.readFileSync(tmpsrc2).toString()
            var fileContents3 = fs.readFileSync(tmpsrc3).toString()
            var fileContents4 = fs.readFileSync(tmpsrc4).toString()
            expect(fileContents1).to.equal("value1")
            expect(fileContents2).to.equal("value2")
            expect(fileContents3).to.equal("value3")
            expect(fileContents4).to.equal("value3")
            done()
        })
    })
    it('uploaded file produces dat collections', (done)=>{
        var src = path.join(__dirname, '..', 'imports', 'file1.txt')
        var opts = getPostOptions(src, 'single')
        request(opts, function (err, res) {
            if(err) console.log(err)
            var body = JSON.parse(res.body)
            expect(body.shadow.files.length).to.equal(1)
            done()
        })
    })
})

function getPostOptions(files, from){
    if (!Array.isArray(files)) files = [files]
    var options = {
        method: "POST",
        url: "http://localhost:3000",
        port: 3000,
        formData :  { file: [] },
        headers: {'x-requested-from': from}
    }
    files.forEach(file => {
        options.formData.file.push(customFile(file))
    })
    function customFile(file){
        var toRemovePath = path.join(__dirname, '..')
        var localPath = file.replace(toRemovePath, '')
        return {
            value:  fs.createReadStream(file),
            options: {
              filename: btoa(localPath),
              contentType: mime.getType(file)
            }
          }
    }
    return options
}