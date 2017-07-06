!function (ROOT) { 'use strict'


//// Standard metadata about this Seqin.
const META = {
    NAME:    { value:'Monty1MathSeqin' }
  , ID:      { value:'m1ma'            }
  , VERSION: { value:'0.0.1'           }
  , SPEC:    { value:'20170705'        }
  , HELP:    { value:
`Monty’s first (experimental) mathematical Seqin. @TODO description` }
}


//// Check that the environment is set up as expected.
const SEQIN = ROOT.SEQIN // available on the window (browser) or global (Node.js)
if (! SEQIN)           throw new Error('The SEQIN global object does not exist')
if (! SEQIN.Seqin)     throw new Error('The base SEQIN.Seqin class does not exist')
if (! SEQIN.MathSeqin) throw new Error('The base SEQIN.MathSeqin class does not exist')


//// Define the main class.
SEQIN.Monty1MathSeqin = class extends SEQIN.MathSeqin {

    constructor (config) {

    }

}


//// Add static constants to the main class.
Object.defineProperties(SEQIN.Monty1MathSeqin, META)


}( 'object' === typeof window ? window : global )
