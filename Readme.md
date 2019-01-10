```
HD Scheme Suite
    Derive
      ✓ returns an empty array when no key is provided
      ✓ returns an array of 16 items when provided a valid key (98ms)
      ✓ returns an array of 17 items when provided a valid key and a qty of 17 (162ms)
      ✓ returns valid keys (70ms)
      ✓ creates Dat in ram when option is specified (85ms)
    Derive Async
      ✓ resolves all promises (189ms)
    Generate Root HD Key
      ✓ generates a unique key each time
    Split key
      ✓ provides an array of 16 hex words
    Split Keys To Paths
      ✓ returns array of integer paths
    Derive children
      ✓ Derives valid HDKeys (77ms)
    Derive specific child
      ✓ Derives expected key when provided an index of 0 (246ms)
      ✓ Derives expected key when provided an index of 1 (79ms)
      ✓ Derives expected key when provided an index greater than 16 (142ms)
      ✓ Derives expected key when provided an index less than 16 (71ms)
    Generate Dat Key
      ✓ should generate a random ed25519 keypairs
      ✓ should generate deterministic keys when provided a known seed
    Generate Dat
      ✓ creates a valid dat from provided key
      ✓ generates 16 Dat objects when no qty is provided (181ms)

  Dat storage
    ✓ stores data in single dat (224ms)
    ✓ dat is servable over http (155ms)


  20 passing (3s)
```