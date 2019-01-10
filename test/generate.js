const expect = require('chai').expect
const rewire = require('rewire')
var path = require('path')
var fs = require('fs-extra')
const EmblemHD = rewire('../').__get__('methods')
var sha256 = require('js-sha256').sha256

describe('HD Scheme Suite', ()=>{
    const RootKey = EmblemHD.generateRootKey()
    var HDKeySignature = [ '_buffers','xprivkey','network','depth','privateKey','publicKey','fingerPrint','_hdPublicKey','hdPublicKey','xpubkey' ]
    var FsDATSignature = ["archive","options","path","key","live","resumed","writable","version"]
    var RamDATSignature = ["archive","options","key","live","resumed","writable","version"]
    var ed25519Expected = '{"publicKey":{"type":"Buffer","data":[63,235,10,167,189,58,103,75,73,255,57,37,194,85,36,41,138,200,253,223,63,46,77,31,143,230,2,139,50,237,22,217]},"secretKey":{"type":"Buffer","data":[98,101,102,54,98,51,100,98,56,53,101,51,53,51,48,97,53,52,98,51,97,101,102,52,99,101,55,49,97,99,98,100,63,235,10,167,189,58,103,75,73,255,57,37,194,85,36,41,138,200,253,223,63,46,77,31,143,230,2,139,50,237,22,217]}}'
    var ed25519Seed = 'bef6b3db85e3530a54b3aef4ce71acbd9f5a70e77cf0c3a4527f8389ac5b9e10'
    var ed25519Key = '3feb0aa7bd3a674b49ff3925c25524298ac8fddf3f2e4d1f8fe6028b32ed16d9'
    var ed25519DiscoveryKey = '3feeff20ae5ad5b93890bc77e78901e0d06c29c8aca34609c094ccc726ae865b'
    before(()=>{
        var src = path.join(__dirname, '..', 'dats')
        fs.ensureDirSync(src)
    })
    after(()=>{
        var src = path.join(__dirname, '..', 'dats')
        fs.removeSync(src)
    })

    describe('Derive', ()=>{
        it('returns an empty array when no key is provided', function () {
            var keys = EmblemHD.derive()
            expect(keys).to.be.an('array')
        })
        it('returns an array of 16 items when provided a valid key', ()=>{
            var keys = EmblemHD.derive(RootKey, 'privateKey')
            expect(keys).to.have.lengthOf(16);
        })
        it('returns an array of 17 items when provided a valid key and a qty of 17', ()=>{
            var keys = EmblemHD.derive(RootKey, 'privateKey', {qty: 17})
            expect(keys).to.have.lengthOf(17);
        })
        it('returns valid keys', ()=>{
            var keys = EmblemHD.derive(RootKey, 'privateKey')
            expect(Object.keys(keys[0].key)).to.deep.equal(HDKeySignature)
        })
        it('creates Dat in ram when option is specified', ()=>{
            var keys = EmblemHD.derive(RootKey, 'privateKey', {storage: "ram"})
            var dat = keys[0].dat
            dat.then(dat=>{
                expect(Object.keys(dat)).to.deep.equal(RamDATSignature)
            })
            
        })
    })

    describe('Derive Async',()=>{
        it('resolves all promises', (done)=>{
            var keysPromise = EmblemHD.deriveAsync(RootKey, 'privateKey')
            keysPromise.then(keys=>{
                var count = 0
                keys.forEach(key=>{
                    expect(Object.keys(key.dat)).to.deep.equal(FsDATSignature)
                    count = count +1
                    if (count === keys.length) {
                        done()
                    }
                })                
            })
            
        })
    })

    describe('Generate Root HD Key', ()=>{
        it('generates a unique key each time', function () {
            var key1 = EmblemHD.generateRootKey().privateKey.toString('hex')
            var key2 = EmblemHD.generateRootKey().privateKey.toString('hex')
            var key3 = EmblemHD.generateRootKey().privateKey.toString('hex')
            expect(key1).to.not.equal(key2)
            expect(key1).to.not.equal(key3)
            expect(key3).to.not.equal(key2)
        })
    })

    describe('Split key', ()=>{
        it('provides an array of 16 hex words', function () {
            var key1 = RootKey.privateKey.toString('hex')
            var key2 = RootKey.publicKey.toString('hex')
            var privSplits = EmblemHD.splitKey(key1)
            var pubSplits = EmblemHD.splitKey(key2)
            expect(privSplits).to.have.lengthOf(16); 
            expect(pubSplits).to.have.lengthOf(16); 
        })
    })

    describe('Split Keys To Paths', ()=>{
        it('returns array of integer paths', ()=>{
            var key1 = RootKey.privateKey.toString('hex')
            var privSplits = EmblemHD.splitKey(key1)
            var paths = EmblemHD.splitKeysToPaths(privSplits)
        })
    })

    describe('Derive children', ()=>{
        it('Derives valid HDKeys', ()=>{
            var keyHex = RootKey.privateKey.toString('hex')
            var keys = EmblemHD.deriveChildren(RootKey, keyHex, 0, 'privateKey')
                keys.forEach(key => {
                    expect(Object.keys(key.key)).to.deep.equal(HDKeySignature)
                })
        })
    })

    describe('Derive specific child', ()=>{
        it('Derives expected key when provided an index of 0', (done)=>{
            var keyIndex = 0
            var keys= EmblemHD.derive(RootKey, 'privateKey', {qty: keyIndex + 1})
                var expectedKey = keys[keyIndex]
                var key = EmblemHD.deriveSpecificChild(RootKey, 'privateKey', keyIndex)
                key.then((key)=>{
                    expect(key.key).to.deep.equal(expectedKey.key)
                    done()
                })
        })

        it('Derives expected key when provided an index of 1', ()=>{
            var keyIndex = 1
            var expectedKey = EmblemHD.derive(RootKey, 'privateKey', {qty: keyIndex + 1})[keyIndex]
            var key = EmblemHD.deriveSpecificChild(RootKey, 'privateKey', keyIndex)
            key.then((key)=>{
                expect(key.key).to.deep.equal(expectedKey.key)
            })
        }) 

        it('Derives expected key when provided an index greater than 16', ()=>{
            var keyIndex = 22
            var expectedKey = EmblemHD.derive(RootKey, 'privateKey', {qty: keyIndex + 1})[keyIndex]
            var key = EmblemHD.deriveSpecificChild(RootKey, 'privateKey', keyIndex)
            key.then((key)=>{
                expect(key.key).to.deep.equal(expectedKey.key)
            })
        })

        it('Derives expected key when provided an index less than 16', ()=>{
            var keyIndex = 13
            var expectedKey = EmblemHD.derive(RootKey, 'privateKey', {qty: keyIndex + 1})[keyIndex]
            var key = EmblemHD.deriveSpecificChild(RootKey, 'privateKey', keyIndex)
            key.then((key)=>{
                expect(key.key).to.deep.equal(expectedKey.key)
            })
        })
    })

    describe('Generate Dat Key', ()=>{
        it('should generate a random ed25519 keypairs', ()=>{
            var keyset1 = EmblemHD.generateDatKey()
            var keyset2 = EmblemHD.generateDatKey()
            expect(keyset1).not.deep.equal(keyset2)
            expect(keyset1.publicKey.length).to.equal(32)
            expect(keyset1.secretKey.length).to.equal(64)
        })
        it('should generate deterministic keys when provided a known seed', ()=>{
            var seed = new Buffer(ed25519Seed)
            var keyset1 = EmblemHD.generateDatKey(seed)
            expect(keyset1.publicKey.toString('hex')).to.equal(ed25519Key)
        })
    })

    describe('Generate Dat', ()=>{
        it('creates a valid dat from provided key', (done)=>{
            var seed = new Buffer(ed25519Seed)
            var keyset1 = EmblemHD.generateDatKey(seed)
            keyset1.seed = seed
            EmblemHD.generateDat(0, keyset1.secretKey, {storage: "ram"}, (err, dat1)=>{  
                expect(dat1.key.toString('hex')).to.equal(ed25519Key)
                expect(dat1.archive.discoveryKey.toString('hex')).to.equal(ed25519DiscoveryKey)
                done()
            })
        })
        it('generates 16 Dat objects when no qty is provided',(done)=>{
            var keys = EmblemHD.derive(RootKey, 'privateKey', {storage: "ram"})
            
            var checkDatKey = (index)=>{
                var key = keys[index]
                var datKeys = key.datKeys
                key.dat.then(dat=>{
                    expect(dat.key.toString('hex')).to.equal(datKeys.publicKey)
                    if (index+1 === keys.length) {
                        done()
                    } else {
                        checkDatKey(index+1)
                    }
                })
            }
            checkDatKey(0)
        })
    })
})