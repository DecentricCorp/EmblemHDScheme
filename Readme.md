```
HD Scheme Suite
    Derive
      ✓ returns an empty array when no key is provided
      ✓ returns an array of 16 items when provided a valid key (253ms)
      ✓ returns an array of 17 items when provided a valid key and a qty of 17 (300ms)
      ✓ returns valid keys (174ms)
    Generate Root HD Key
      ✓ generates a unique key each time (80ms)
    Split key
      ✓ provides an array of 16 hex words
    Split Keys To Paths
      ✓ returns array of integer paths
    Derive children
      ✓ Derives valid HDKeys (166ms)
    Derive specific child
      ✓ Derives expected key when provided an index of 0 (167ms)
      ✓ Derives expected key when provided an index of 1 (180ms)
      ✓ Derives expected key when provided an index greater than 16 (320ms)
      ✓ Derives expected key when provided an index less than 16 (179ms)
    Generate Dat Key
      ✓ should generate a random ed25519 keypairs
      ✓ should generate deterministic keys when provided a known seed
```