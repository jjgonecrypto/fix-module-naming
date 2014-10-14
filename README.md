Fix Module Casing
=========


1. Matches all `.js` files, camelCases their name, and if a `module.exports` assignment to either a function declaration or invocation is found, then also capitalizes it, and renames it.

2. Searches for all `require(...)` calls for the file and renames it accordingly.
