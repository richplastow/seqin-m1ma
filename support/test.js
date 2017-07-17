//// This is the test entry-point for Node.js.
//// You’ll need to install mocha and chai first:
//// $ npm install mocha --global
//// $ npm install chai --global

//// Define `TestClassName` and `TestMeta` for './test-common-isomorphic.js'.
global.TestClassName = 'Rich1MathSeqin'
global.TestMeta = {
//// This has been copy-pasted from the main script:
    NAME:    { value:'Rich1MathSeqin' }
  , ID:      { value:'r1ma'           }
  , VERSION: { value:'0.0.4'          }
  , SPEC:    { value:'20170705'       }
  , HELP:    { value:
`Rich’s first (experimental) mathematical Seqin. @TODO description` }
}

//// Polyfill `performance.now()`.
global.performance = {
    now: () => { const hr = process.hrtime(); return hr[0] * 1e4 + hr[1] / 1e6 }
}

//// Load Seqin dependencies.
require('seqin-si')
require('seqin-ma')

//// Load the class to be tested.
require('../'+global.TestClassName)

//// Run the tests.
require('seqin-si/support/test-common-isomorphic')
//@TODO './test-specific-isomorphic'
