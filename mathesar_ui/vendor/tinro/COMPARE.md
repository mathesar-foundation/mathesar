# How much tinro adds to your bandle?

Current tinro value is **6.43 Kb** (2.57 Kb gzipped) 

## Comparsion

* bundle.js with tinro inside: **33.87 Kb** (10.34 Kb gzipped)
* bundle.js with mocked tinro : **27.44 Kb** (7.77 Kb gzipped)

## How do we compare?

Comparsion made by building [testing app](https://github.com/AlexxNB/tinro/tree/master/tests) in production mode two times. First one with tinro letest version inside. In the second case - all imports from tinro are mocked by empty exports.
    