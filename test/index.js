const expect = require('chai').expect
const rewire = require('rewire')
const EmblemHD = rewire('../').__get__('methods')

describe('HD Scheme Suite', ()=>{
    var RootKey 
    var HDKeySignature = [ '_buffers','xprivkey','network','depth','privateKey','publicKey','fingerPrint','_hdPublicKey','hdPublicKey','xpubkey' ]
    before(function() {
        RootKey = EmblemHD.generateRootKey()
      });

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
            var keys = EmblemHD.derive(RootKey, 'privateKey', 17)
            expect(keys).to.have.lengthOf(17);
        })
        it('returns valid keys', ()=>{
            var keys = EmblemHD.derive(RootKey, 'privateKey')
            expect(Object.keys(keys[0].key)).to.deep.equal(HDKeySignature)
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
            var keys = EmblemHD.deriveChildren(RootKey, keyHex)
            keys.forEach(key => {
                expect(Object.keys(key.key)).to.deep.equal(HDKeySignature)
            });
        })
    })
    describe('Derive specific child', ()=>{
        it('Derives expected key when provided an index of 0', ()=>{
            var keyIndex = 0
            var keyHex = RootKey.privateKey.toString('hex')
            var expectedKey = EmblemHD.derive(RootKey, 'privateKey', keyIndex + 1)[keyIndex]
            var key = EmblemHD.deriveSpecificChild(RootKey, keyHex, keyIndex)
            expect(key).to.deep.equal(expectedKey.key)
        })

        it('Derives expected key when provided an index of 1', ()=>{
            var keyIndex = 1
            var keyHex = RootKey.privateKey.toString('hex')
            var expectedKey = EmblemHD.derive(RootKey, 'privateKey', keyIndex + 1)[keyIndex]
            var key = EmblemHD.deriveSpecificChild(RootKey, keyHex, keyIndex)
            expect(key).to.deep.equal(expectedKey.key)
        })

        it('Derives expected key when provided an index greater than 16', ()=>{
            var keyIndex = 22
            var keyHex = RootKey.privateKey.toString('hex')
            var expectedKey = EmblemHD.derive(RootKey, 'privateKey', keyIndex + 1)[keyIndex]
            var key = EmblemHD.deriveSpecificChild(RootKey, keyHex, keyIndex)
            expect(key).to.deep.equal(expectedKey.key)
        })

        it('Derives expected key when provided an index less than 16', ()=>{
            var keyIndex = 13
            var keyHex = RootKey.privateKey.toString('hex')
            var expectedKey = EmblemHD.derive(RootKey, 'privateKey', keyIndex + 1)[keyIndex]
            var key = EmblemHD.deriveSpecificChild(RootKey, keyHex, keyIndex)
            expect(key).to.deep.equal(expectedKey.key)
        })

        it('Derives expected key when provided a large index above 200', ()=>{
            var keyIndex = 201
            var keyHex = RootKey.privateKey.toString('hex')
            var expectedKey = EmblemHD.derive(RootKey, 'privateKey', keyIndex + 1)[keyIndex]
            var key = EmblemHD.deriveSpecificChild(RootKey, keyHex, keyIndex)
            expect(key).to.deep.equal(expectedKey.key)
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
            var seed = new Buffer('bef6b3db85e3530a54b3aef4ce71acbd9f5a70e77cf0c3a4527f8389ac5b9e10')
            var keyset1 = EmblemHD.generateDatKey(seed)
            var keyset2 = EmblemHD.generateDatKey(seed)
            expect(keyset1).to.deep.equal(keyset2)
        })
    })
})