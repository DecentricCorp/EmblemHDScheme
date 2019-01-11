<img src="./media/Emblem.DAT.Shard.Network.png"/>

```
HD Scheme Suite
    Derive
      ✓ returns an empty array when no key is provided
      ✓ returns an array of 16 items when provided a valid key (105ms)
      ✓ returns an array of 17 items when provided a valid key and a qty of 17 (142ms)
      ✓ returns valid keys (62ms)
      ✓ creates Dat in ram when option is specified (73ms)
    Derive Async
      ✓ resolves all promises (164ms)
    Generate Root HD Key
      ✓ generates a unique key each time
    Split key
      ✓ provides an array of 16 hex words
    Split Keys To Paths
      ✓ returns array of integer paths
    Derive children
      ✓ Derives valid HDKeys (75ms)
    Derive specific child
      ✓ Derives expected key when provided an index of 0 (180ms)
      ✓ Derives expected key when provided an index of 1 (77ms)
      ✓ Derives expected key when provided an index greater than 16 (130ms)
      ✓ Derives expected key when provided an index less than 16 (64ms)
    Generate Dat Key
      ✓ should generate a random ed25519 keypairs
      ✓ should generate deterministic keys when provided a known seed
    Generate Dat
      ✓ creates a valid dat from provided key
      ✓ generates 16 Dat objects when no qty is provided (166ms)

  Dat storage
    ✓ stores data in single dat (191ms)
    ✓ dat is servable over http (228ms)
    ✓ should return secret and shadowed collection when passed folder path (275ms)
    ✓ should be able to read metadata from shadowed collection of one file (386ms)
    ✓ should be able to read metadata from shadowed collection of multiple files (351ms)
    ✓ should be able to read metadata from shadowed collection of multiple and nested files (402ms)
    ✓ should hash file content into shadow metadata (379ms)
    ✓ should encrypt secret collection content (404ms)
    ✓ secret collection content should be decryptable (357ms)
    ✓ should be able to reconstruct the metadata from a publicKey (397ms)


  28 passing (6s)
```