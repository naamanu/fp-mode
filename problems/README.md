# fp-mode Problems

A collection of functional programming challenges for Haskell and OCaml.

## Structure

Each problem lives in a directory under its difficulty level:

```
problems/
├── easy/
│   └── <problem-slug>/
│       ├── problem.yaml      # Problem metadata and description
│       ├── starters/         # Starter code per language
│       │   ├── haskell.hs
│       │   └── ocaml.ml
│       ├── solutions/        # Reference solutions
│       │   ├── haskell.hs
│       │   └── ocaml.ml
│       └── tests/
│           └── cases.yaml    # Test cases
├── medium/
└── hard/
```

## Contributing

To add a new problem, create a directory with the above structure and submit a pull request.
