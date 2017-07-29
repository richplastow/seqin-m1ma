//// This is the test entry-point for Node.js.
//// You’ll need to install mocha and chai first:
//// $ npm install mocha --global
//// $ npm install chai --global

//// Define `TestMeta` - this has been copied from the main script.
global.TestMeta = {
    NAME:    { value:'Rich1MathSeqin' }
  , ID:      { value:'r1ma'           }
  , VERSION: { value:'1.0.0'          }
  , SPEC:    { value:'20170728'       }
  , HELP:    { value:
`Rich’s first (experimental) mathematical Seqin. @TODO description` }
}

//// Polyfill `performance.now()` and define a dummy `AudioContext`.
global.performance = {
    now: () => { const hr = process.hrtime(); return hr[0] * 1e4 + hr[1] / 1e6 }
}
global.AudioContext = class AudioContext {}
global.AudioContext.prototype.sampleRate = 48000

//// Load Seqin dependencies.
require('seqin-base')
require('seqin-ma')

//// Load the class to be tested.
require('../seqin-'+global.TestMeta.ID.value)

//// Run the tests.
require('seqin-base/support/test-base-isomorphic')
require('seqin-ma/support/test-family-isomorphic')
