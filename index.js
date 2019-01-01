var Coval = require('coval.js')
var crypto = require('hypercore-crypto')
var hdkey = new new Coval.Coval().Secure.HDKey()

var methods = {
    derive: function(rootKey, deriveType, qty) {
        if (!qty) qty = 16
        var maxLevel = Math.ceil(qty/16)
        var lastSetSize = qty/16 * 16
        var children = []
        if (!rootKey) return children
        var keyHex = rootKey[deriveType].toString('hex')
        for (let index = 0; index < maxLevel; index++) {
            var currentChildren = this.deriveChildren(rootKey, keyHex, index)           
            children = children.concat(currentChildren)
            if (children.length === qty) {
                return children
            } else if(children.length > qty) {
                var toRemove = children.length - qty
                children.splice(lastSetSize, toRemove);
                return children
            }      
        }
    },
    deriveChildren: function(key, keyHex, level){
        if (!level) level = 0
        var keys = []
        var paths = this.splitKeysToPaths(this.splitKey(keyHex))
        var currentKey = key
        var deriveChild = ()=>{
            var localPath = paths.pop()
            var path = "m/"+level.toString()+"'/"+localPath
            //console.log(path, keys.length)
            currentKey = key.deriveChild(path)
            var datKey = this.generateDatKey(Buffer(currentKey.privateKey.toString('hex')))
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
    deriveSpecificChild: function(key, keyHex, keyIndex){
        var maxLevel = Math.floor(keyIndex/16)
        var lastSetIndex = (keyIndex - (maxLevel * 16))
        var paths = this.splitKeysToPaths(this.splitKey(keyHex))
        var localPath = paths.reverse()[lastSetIndex]
        var path = "m/"+maxLevel.toString()+"'/"+localPath
        return key.deriveChild(path)
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
    }
}

module.exports = {
    derive: methods.derive,
    generateRootKey: methods.generateRootKey
}