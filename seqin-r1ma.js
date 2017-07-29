!function (ROOT) { 'use strict'

const META = {
    NAME:    { value:'Rich1MathSeqin' }
  , ID:      { value:'r1ma'           }
  , VERSION: { value:'1.0.0'          }
  , SPEC:    { value:'20170728'       }
  , HELP:    { value:
`Rich’s first (experimental) mathematical Seqin. @TODO description` }
}


//// Check that the environment is set up as expected.
const SEQIN = ROOT.SEQIN // available on the window (browser) or global (Node.js)
if (! SEQIN)           throw new Error('The SEQIN global object does not exist')
if (! SEQIN.Seqin)     throw new Error('The base SEQIN.Seqin class does not exist')
if (! SEQIN.MathSeqin) throw new Error('The base SEQIN.MathSeqin class does not exist')


//// Define the main class.
SEQIN.Rich1MathSeqin = class Rich1MathSeqin extends SEQIN.MathSeqin {

}


//// Add static constants to the main class.
Object.defineProperties(SEQIN.Rich1MathSeqin, META)


}( 'object' === typeof window ? window : global )
