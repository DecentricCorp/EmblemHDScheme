var Coval = require('coval.js')
var crypto = require('hypercore-crypto')
var hdkey = new new Coval.Coval().Secure.HDKey()
var ram = require('random-access-memory')
var Dat = require('dat-node')

var methods = {
    derive: function(rootKey, deriveType, qty) {
        if (!qty) qty = 16
        var maxLevel = Math.ceil(qty/16)
        var lastSetSize = qty/16 * 16
        var children = []
        if (!rootKey) return children
        var baseRootKey = rootKey
        var keyHex = baseRootKey[deriveType].toString('hex')
        //console.log("base hex", keyHex)
        for (let index = 0; index < maxLevel; index++) {
            var currentChildren = this.deriveChildren(baseRootKey, keyHex, index, deriveType)
            children = children.concat(currentChildren)
            if (children.length === qty) {
                return children
            } else if(children.length > qty) {
                var toRemove = children.length - qty
                children.splice(lastSetSize, toRemove);
                return children
            }
            var nextLevelPath =  "m/"+(index +1).toString()
            //console.log('next level path', nextLevelPath)
            rootKey = baseRootKey.derive(nextLevelPath)
            keyHex = rootKey[deriveType].toString('hex')
        }
    },
    deriveChildren: function(key, keyHex, level, deriveType){
        if (!level) level = 0
        var keys = []
        var paths = this.splitKeysToPaths(this.splitKey(keyHex))
        //console.log("children paths", paths)
        var currentKey = key
        var deriveChild = ()=>{
            var localPath = paths.pop()
            var path = "m/"+level.toString()+"'/"+localPath
            //console.log(path, keys.length)
            currentKey = key.deriveChild(path)
            var datKey = this.generateDatKey(Buffer(currentKey[deriveType].toString('hex')))
            var keyObject = {key: currentKey, path: path, datKeys: {publicKey: datKey.publicKey.toString('hex'), secretKey: datKey.secretKey.toString('hex')}}
            keys.push(keyObject)
            if (paths.length > 0) {
                return deriveChild()
            } else {
                //console.log(keys)
                return keys
            }
        }
        return deriveChild()
    },
    deriveSpecificChild: function(key, deriveType, keyIndex){
        var maxLevel = Math.floor(keyIndex/16)
        var lastSetIndex = (keyIndex - (maxLevel * 16))
        var derivationPath =  "m/"+maxLevel.toString()
        var keyHex = key[deriveType].toString('hex')
        if (maxLevel > 0) keyHex = key.derive(derivationPath)[deriveType].toString('hex')
        var paths = this.splitKeysToPaths(this.splitKey(keyHex))
        //console.log("specific paths", paths)
        var localPath = paths.reverse()[lastSetIndex]
        var path = "m/"+maxLevel.toString()+"'/"+localPath
        var specificKey = key.deriveChild(path)
        var datKey = this.generateDatKey(Buffer(specificKey[deriveType].toString('hex')))
        return {key: specificKey, path: path, datKeys: {publicKey: datKey.publicKey.toString('hex'), secretKey: datKey.secretKey.toString('hex')}}
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
    generateDat: (key, cb)=>{
        Dat(ram, { key: key, createWithKey: true}, function (err, dat) {
            return cb(err, dat)
        })
    }
}

module.exports = {
    derive: methods.derive,
    generateRootKey: methods.generateRootKey
}