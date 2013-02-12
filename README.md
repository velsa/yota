yota
====

CasperJS script for viewing and changing the current network speed of your Yota 4G

### Instructions for Mac:

Install [CasperJS](http://casperjs.org/) using [HomeBrew](http://mxcl.github.com/homebrew/)

    brew install casperjs

Run yota.js script like this
    
    casperjs yota.js

You will get usage instructions

### Bash conveniece:

To run it from command line conveniently, add this to your `~/.bashrc`

    function yota() { 
        casperjs ~/yota.js $@ 
    }

And then you can simply run it like this:

    ~ > yota status

