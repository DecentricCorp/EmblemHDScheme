var Coval = require('coval.js')
var crypto = require('hypercore-crypto')
var Hdkey = new Coval.Coval().Secure.HDKey
var ram = require('random-access-memory')
var Dat = require('dat-node')
const util = require('util')
var path = require('path')
var fs = require('fs-extra')
var sha256 = require('js-sha256').sha256
const zlib = require('zlib')
const encryption = require('crypto')
var stream = require('stream')

var datMethods = {
    generateDat: (index, key, opts, cb)=>{
        var rnd = Math.random().toString().split('.')[1]
        var src = path.join(__dirname, 'dats', rnd)
        var storage
        if (opts && opts.storage && opts.storage === "ram") 
        {
            storage = ram
        } else {
            storage = src
        }
        new Dat(storage, { secretKey: key, createWithKey: true }, function (err, dat) {
            return cb(err, dat)
        })
    }
}

methods = {
    derive: function(rootKey, deriveType, opts) {
        if (!opts) opts = {}
        if (!opts.qty) opts.qty = 16
        var maxLevel = Math.ceil(opts.qty/16)
        var lastSetSize = opts.qty/16 * 16
        var children = []
        if (!rootKey) return children
        var baseRootKey = rootKey
        var keyHex = baseRootKey[deriveType].toString('hex')
        for (let index = 0; index < maxLevel; index++) {
            var currentChildren = methods.deriveChildren(baseRootKey, keyHex, index, deriveType, opts)
            children = children.concat(currentChildren)
            if (children.length === opts.qty) {
                return children
            } else if(children.length > opts.qty) {
                var toRemove = children.length - opts.qty
                children.splice(lastSetSize, toRemove)
                return children
            }
            var nextLevelPath =  "m/"+(index +1).toString()
            rootKey = baseRootKey.derive(nextLevelPath)
            keyHex = rootKey[deriveType].toString('hex')
        }
    },
    deriveChildren: function(key, keyHex, level, deriveType, opts){
        if (!level) level = 0
        var keyIndex = 0
        var keys = []
        var paths = methods.splitKeysToPaths(methods.splitKey(keyHex))
        var currentKey = key
        var deriveChild = ()=>{
            var localPath = paths.pop()
            var path = "m/"+level.toString()+"'/"+localPath
            currentKey = key.deriveChild(path)
            var datKey = methods.generateDatKey(Buffer(currentKey[deriveType].toString('hex')))
            var keyObject = {key: currentKey, dat: this.generateDatAsync(keyIndex, datKey.secretKey, opts), path: path, datKeys: {publicKey: datKey.publicKey.toString('hex'), secretKey: datKey.secretKey.toString('hex')}}
            keys.push(keyObject)
            keyIndex = keyIndex + 1
            if (paths.length > 0) {
                return deriveChild()
            } else {
                return keys
            }
        }
        return deriveChild()
    },
    deriveSpecificChild: function(key, deriveType, keyIndex, opts){
        var maxLevel = Math.floor(keyIndex/16)
        var lastSetIndex = (keyIndex - (maxLevel * 16))
        var derivationPath =  "m/"+maxLevel.toString()
        var keyHex = key[deriveType].toString('hex')
        if (maxLevel > 0) keyHex = key.derive(derivationPath)[deriveType].toString('hex')
        var paths = methods.splitKeysToPaths(methods.splitKey(keyHex))
        var localPath = paths.reverse()[lastSetIndex]
        var path = "m/"+maxLevel.toString()+"'/"+localPath
        var specificKey = key.deriveChild(path)
        var datKey = methods.generateDatKey(Buffer(sha256(specificKey[deriveType].toString('hex'))))
        return this.generateDatAsync(keyIndex, datKey.secretKey, opts).then((dat)=>{
            return {key: specificKey, path: path, dat:dat , datKeys: {publicKey: datKey.publicKey.toString('hex'), secretKey: datKey.secretKey.toString('hex')}}
        })
    },
    generateRootKey: function(){
        var hdkey = new Hdkey()
        return hdkey.StandardHDKey('0', function(address, key){
            return key
        })
    },
    splitKey: function(key){
        var splits = key.match(/.{4}/g)
        return splits
    },
    splitKeysToPaths: (splits)=>{
        var paths = []  
          
        var keyToPath = ()=>{
            var split = splits.pop()
            paths.push(parseInt(split, 16))
            if (splits.length > 0) {
                return keyToPath()
            } else {
                return paths
            }
        }
        return keyToPath()  
    },
    generateDatKey: (seed)=>{
        var keyPair = {seed: seed}
        var calculatedKeypair = crypto.keyPair(seed)
        keyPair.secretKey = calculatedKeypair.secretKey
        keyPair.publicKey = calculatedKeypair.publicKey
        keyPair.discoveryKey = crypto.discoveryKey(calculatedKeypair.secretKey)
        return keyPair 
    },
    generateDat: datMethods.generateDat,
    generateDatAsync : util.promisify(datMethods.generateDat),
    derivePromises: function(rootKey, deriveType, opts, cb){
        if (typeof(opts) === "function") {
            cb = opts
            opts = {qty: 16}
        }
        var keys = this.derive(rootKey, deriveType, opts)
        var checkDatKey = (keys, index)=>{
            var key = keys[index]
            
            key.dat.then(dat=>{
                key.dat = dat
                if (index+1 === keys.length) {
                    return cb(null, keys)
                } else {
                    checkDatKey(keys, index+1)
                }
            })
        }
        checkDatKey(keys, 0)
    },
    derivePathedDatKey(rootKey, keyType, level, index){
        if (!index) index = 0
        if (!level) level = 0
        var keyHex = rootKey[keyType].toString('hex')
        var splits = methods.splitKey(keyHex)
        var paths = methods.splitKeysToPaths(splits)
        var path = "m/"+level+"'/"+paths.reverse()[index]
        var currentKey = rootKey.deriveChild(path)
        var keys = methods.generateDatKey(new Buffer(currentKey[keyType].toString('hex')))
        return keys
    }
}
methods.deriveAsync = util.promisify(methods.derivePromises)

var storageMethods = {
    storeShadowed: function(rootKey, opts, cb){
        var secretCollection = methods.deriveAsync(rootKey, 'privateKey', {qty: 1, storage: "ram", "import":true})
        var shadowCollection = methods.deriveAsync(rootKey, 'publicKey', {qty: 1, storage: "ram", "import":true})
        var rootSrc, realCreateReadStream
        var encryptionKey = rootKey.privateKey.toBuffer()
        secretCollection.then(secretContainer=>{
            var secretDat = secretContainer[0].dat
            shadowCollection.then(shadowContainer=>{
                var importProgress = secretDat.importFiles(opts.src)
                var shadowDat = shadowContainer[0].dat
                var shadowStream = shadowDat.archive.createWriteStream('shadow.json')
                var shadowObject = {files: []}
                importProgress.on('put', (src, dest)=>{
                    rootSrc = src
                    var fileHash = sha256(src.fs.readFileSync(src.name))
                    realCreateReadStream = src.fs.createReadStream
                    var createEncryptedReadStream = function(name){                        
                        var content = src.fs.readFileSync(name)
                        var encrypted = encrypt(content, encryptionKey)
                        var bufferStream = new stream.PassThrough()
                        bufferStream.end(new Buffer(encrypted))
                        return bufferStream
                    }
                    src.fs.createReadStream = createEncryptedReadStream
                    var origName = dest.name
                    var newName = origName.split('/')
                    newName[newName.length -1] = fileHash + '.enc'
                    dest.name = newName.join('/')
                    shadowObject.files.push({
                        name: origName, 
                        stats: src.stat,
                        hash: fileHash
                    })
                })
                importProgress.on('put-data', (chunk, src, dest)=>{
                    //console.log(chunk)
                })
                
                importProgress.on('end', (src, dest)=>{
                    if (opts.deleteAfterImport) {
                        fs.remove(opts.src, err=>{
                            
                        })
                    }
                    shadowStream.write(JSON.stringify(shadowObject, null, 4))
                    shadowStream.end()
                })
                shadowStream.on('finish', function () {
                    rootSrc.fs.createReadStream = realCreateReadStream
                    return cb(null, {
                        secretCollection:secretCollection, 
                        shadowCollection:shadowCollection 
                    })
                })             
            })
        })
    }
}
storageMethods.storeShadowedAsync = util.promisify(storageMethods.storeShadowed)

function init(){
    this.publicMethods =  {
        derive: methods.derive,
        deriveAsync: methods.deriveAsync,
        derivePathedDatKey: methods.derivePathedDatKey,
        generateRootKey: methods.generateRootKey,
        generateDatKey: methods.generateDatKey,
        storeShadowed: storageMethods.storeShadowed,
        storeShadowedAsync: storageMethods.storeShadowedAsync,
        splitKey: methods.splitKey,
        splitKeysToPaths: methods.splitKeysToPaths    
    }
    return this
}

module.exports = init

function encrypt (text, key) {
    try {
      const IV_LENGTH = 16 // For AES, this is always 16
      let iv = encryption.randomBytes(IV_LENGTH)
      let cipher = encryption.createCipheriv('aes-256-cbc', key, iv)
      let encrypted = cipher.update(text)
  
      encrypted = Buffer.concat([encrypted, cipher.final()])
  
      return iv.toString('hex') + ':' + encrypted.toString('hex')
    } catch (err) {
      throw err
    }
  }
  

