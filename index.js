var Coval = require('coval.js')
var crypto = require('hypercore-crypto')
var hdkey = new new Coval.Coval().Secure.HDKey()
var ram = require('random-access-memory')
var Dat = require('dat-node')
const util = require('util')
var path = require('path')
var fs = require('fs-extra')

var datMethods = {
    generateDat: (index, key, opts, cb)=>{
        var rnd = Math.random().toString().split('.')[1]
        var src = path.join(__dirname, 'dats', rnd)        
        Dat(/* ram */ src, { key: key, createWithKey: true}, function (err, dat) {
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
            var currentChildren = this.deriveChildren(baseRootKey, keyHex, index, deriveType, opts)
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
        var paths = this.splitKeysToPaths(this.splitKey(keyHex))
        var currentKey = key
        var deriveChild = ()=>{
            var localPath = paths.pop()
            var path = "m/"+level.toString()+"'/"+localPath
            currentKey = key.deriveChild(path)
            var datKey = this.generateDatKey(Buffer(currentKey[deriveType].toString('hex')))
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
        var paths = this.splitKeysToPaths(this.splitKey(keyHex))
        var localPath = paths.reverse()[lastSetIndex]
        var path = "m/"+maxLevel.toString()+"'/"+localPath
        var specificKey = key.deriveChild(path)
        var datKey = this.generateDatKey(Buffer(specificKey[deriveType].toString('hex')))
        return this.generateDatAsync(keyIndex, datKey.secretKey, opts).then((dat)=>{
            return {key: specificKey, path: path, dat:dat , datKeys: {publicKey: datKey.publicKey.toString('hex'), secretKey: datKey.secretKey.toString('hex')}}
        })
    },
    generateRootKey: function(){
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
        return crypto.keyPair(seed)
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
    }
}
methods.deriveAsync = util.promisify(methods.derivePromises)


module.exports = {
    derive: methods.derive,
    deriveAsync: methods.deriveAsync,
    generateRootKey: methods.generateRootKey
}