//// This is the test entry-point for Node.js.
//// You’ll need to install mocha and chai first.

//// Define `TestClassName` and `TestMeta` for './test-common-isomorphic.js'.
global.TestClassName = 'Rich1MathSeqin'
global.TestMeta = {
//// This has been copy-pasted from the main script:
    NAME:    { value:'Rich1MathSeqin' }
  , ID:      { value:'r1ma'            }
  , VERSION: { value:'0.0.1'           }
  , SPEC:    { value:'20170705'        }
  , HELP:    { value:
`Rich’s first (experimental) mathematical Seqin. @TODO description` }
}

//// Load Seqin dependencies.
require('seqin-si')
require('seqin-ma')

//// Load the class to be tested.
require('../'+global.TestClassName)

//// Run the tests.
require('seqin-si/support/test-common-isomorphic')
//@TODO './test-specific-isomorphic'
