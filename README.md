Fix Module Casing
=========


1. Matches all `.js` files, camelCases their name, and if a `module.exports` assignment to either a function declaration or invocation is found, then also capitalizes it, and renames it.

2. Searches for all `require(...)` calls for the file and renames it accordingly.

Usage
----

`npm install -g fix-module-naming`
`fix-module-naming .` where `.` is either an absolute or relative path

Options
-------

`- m, --mock` enables mock view, so you can see the output of changes without making them
`- i, --ignore &lt;items&gt;` a comma-delimited list of patterns in folders to ignore
