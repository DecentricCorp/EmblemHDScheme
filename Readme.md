<img src="./media/Emblem.DAT.Shard.Network.png"/>

```
HD Scheme Suite
    Derive
      ✓ returns an empty array when no key is provided
      ✓ returns an array of 16 items when provided a valid key (108ms)
      ✓ returns an array of 17 items when provided a valid key and a qty of 17 (137ms)
      ✓ returns valid keys (66ms)
      ✓ creates Dat in ram when option is specified (64ms)
    Derive Async
      ✓ resolves all promises (143ms)
    Generate Root HD Key
      ✓ generates a unique key each time
    Split key
      ✓ provides an array of 16 hex words
    Split Keys To Paths
      ✓ returns array of integer paths
    Derive children
      ✓ Derives valid HDKeys (73ms)
    Derive specific child
      ✓ Derives expected key when provided an index of 0 (158ms)
      ✓ Derives expected key when provided an index of 1 (77ms)
      ✓ Derives expected key when provided an index greater than 16 (134ms)
      ✓ Derives expected key when provided an index less than 16 (83ms)
    Generate Dat Key
      ✓ should generate a random ed25519 keypairs
      ✓ should generate deterministic keys when provided a known seed
    Generate Dat
      ✓ creates a valid dat from provided key
      ✓ generates 16 Dat objects when no qty is provided (144ms)

  Dat storage
    ✓ stores data in single dat (204ms)
    ✓ dat is servable over http (173ms)
    ✓ should return secret and shadowed collection when passed folder path (330ms)
    ✓ should be able to read metadata from shadowed collection of one file (213ms)
    ✓ should be able to read metadata from shadowed collection of multiple files (319ms)
    ✓ should be able to read metadata from shadowed collection of multiple and nested files (332ms)
    ✓ should hash file content into shadow metadata (337ms)
    ✓ should encrypt secret collection content (305ms)
    ✓ secret collection content should be decryptable (308ms)


  27 passing (5s)
```