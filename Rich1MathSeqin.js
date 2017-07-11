!function (ROOT) { 'use strict'


//// Standard metadata about this Seqin.
const META = {
    NAME:    { value:'Rich1MathSeqin' }
  , ID:      { value:'r1ma'            }
  , VERSION: { value:'0.0.1'           }
  , SPEC:    { value:'20170705'        }
  , HELP:    { value:
`Rich’s first (experimental) mathematical Seqin. @TODO description` }
}


//// Check that the environment is set up as expected.
const SEQIN = ROOT.SEQIN // available on the window (browser) or global (Node.js)
if (! SEQIN)           throw new Error('The SEQIN global object does not exist')
if (! SEQIN.Seqin)     throw new Error('The base SEQIN.Seqin class does not exist')
if (! SEQIN.MathSeqin) throw new Error('The base SEQIN.MathSeqin class does not exist')


//// Define the main class.
SEQIN.Rich1MathSeqin = class extends SEQIN.MathSeqin {

    constructor (config) {
        super(config)
    }


    getBuffers(config) {

        //// Validate config and get empty buffers.
        const buffers = super.getBuffers(config) //@TODO something like super.super, to just get seqin-si’s empty buffers

        ////@TODO generate experimental mathematical sound
        buffers.map( buffer => {
            buffer.id = 'r1ma'
        })

        return buffers

    }
}


//// Add static constants to the main class.
Object.defineProperties(SEQIN.Rich1MathSeqin, META)


}( 'object' === typeof window ? window : global )
