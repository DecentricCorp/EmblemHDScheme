<img src="./media/Emblem.DAT.Shard.Network.png"/>


```
function onlyAllowOneCall(fn){
    var hasBeenCalled = false;    
    return function(){
         if (!hasBeenCalled){
              //throw Error("Attempted to call callback twice")
              hasBeenCalled = true
              return fn.apply(this, arguments)
         } else {

         }
         
         
    }
} 
var key = 'e7a4ddd16e6bdaca756a9d2877173af6d5cfb5aed8202360c4efc955903e1b52'
var storage = rai('shadow-'+ key )
var archive = hyperdrive(storage, key)
connectToGateway(archive, onlyAllowOneCall((a,b)=>{console.log(a,b)}), ()=>{console.log("Connecting to gateway to sync dat")})
archive.readFile('/shadow.json', (a,b)=>{console.log(a,b.toString())})
```





```
HD Scheme Suite
    Derive
      ✓ returns an empty array when no key is provided
      ✓ returns an array of 16 items when provided a valid key (106ms)
      ✓ returns an array of 17 items when provided a valid key and a qty of 17 (132ms)
      ✓ returns valid keys (65ms)
      ✓ creates Dat in ram when option is specified (69ms)
    Derive Async
      ✓ resolves all promises (200ms)
    Generate Root HD Key
      ✓ generates a unique key each time
    Split key
      ✓ provides an array of 16 hex words
    Split Keys To Paths
      ✓ returns array of integer paths
    Derive children
      ✓ Derives valid HDKeys (82ms)
    Derive specific child
      ✓ Derives expected key when provided an index of 0 (185ms)
      ✓ Derives expected key when provided an index of 1 (76ms)
      ✓ Derives expected key when provided an index greater than 16 (140ms)
      ✓ Derives expected key when provided an index less than 16 (65ms)
    Generate Dat Key
      ✓ should generate a random ed25519 keypairs
      ✓ should generate deterministic keys when provided a known seed
    Generate Dat
      ✓ creates a valid dat from provided key
      ✓ generates 16 Dat objects when no qty is provided (195ms)

  Emblem Dat server
    ✓ processes single file upload (6447ms)
    ✓ processes multi file upload (10771ms)
    ✓ processes nested multi file upload (22146ms)

  Dat storage
    ✓ stores data in single dat (187ms)
    ✓ dat is servable over http (234ms)
    ✓ should return secret and shadowed collection when passed folder path (406ms)
    ✓ should be able to read metadata from shadowed collection of one file (409ms)
    ✓ should be able to read metadata from shadowed collection of multiple files (446ms)
    ✓ should be able to read metadata from shadowed collection of multiple and nested files (359ms)
    ✓ should hash file content into shadow metadata (413ms)
    ✓ should encrypt secret collection content (404ms)
    ✓ secret collection content should be decryptable (486ms)
    ✓ should be able to reconstruct the metadata from a publicKey (395ms)
    
   31 passing (9s)
```