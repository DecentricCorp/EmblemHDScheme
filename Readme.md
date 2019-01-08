```
  HD Scheme Suite
    Derive
      ✓ returns an empty array when no key is provided
      ✓ returns an array of 16 items when provided a valid key (122ms)
      ✓ returns an array of 17 items when provided a valid key and a qty of 17 (199ms)
      ✓ returns valid keys (92ms)
      ✓ creates Dat in ram when option is specified (91ms)
    Derive Async
      ✓ resolves all promises (128ms)
    Generate Root HD Key
      ✓ generates a unique key each time
    Split key
      ✓ provides an array of 16 hex words
    Split Keys To Paths
      ✓ returns array of integer paths
    Derive children
      ✓ Derives valid HDKeys (81ms)
    Derive specific child
      ✓ Derives expected key when provided an index of 0 (159ms)
      ✓ Derives expected key when provided an index of 1 (96ms)
      ✓ Derives expected key when provided an index greater than 16 (217ms)
      ✓ Derives expected key when provided an index less than 16 (91ms)
    Generate Dat Key
      ✓ should generate a random ed25519 keypairs
      ✓ should generate deterministic keys when provided a known seed
    Generate Dat
      ✓ creates a valid dat from provided key
      ✓ generates 16 Dat objects when no qty is provided (131ms)
```