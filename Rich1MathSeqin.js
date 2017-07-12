!function (ROOT) { 'use strict'


//// Standard metadata about this Seqin.
const META = {
    NAME:    { value:'Rich1MathSeqin' }
  , ID:      { value:'r1ma'            }
  , VERSION: { value:'0.0.3'           }
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
        const buffers = super.getBuffers(config)

        const samplesPerCycle = this.samplesPerBuffer / config.cyclesPerBuffer

        //// MathSeqin notes are built from a single waveform. Its ID is:
        const waveId =
            'r1ma_'             // universally unique ID for Rich1MathSeqin
          + 'w_'                // denotes a single waveform-cycle
          + 'l'+samplesPerCycle // length of the waveform-cycle in sample-frames

        //// No cached wave? Generate it!
        let waveBuffer = this.sharedCache[waveId]
        if (! waveBuffer) {
            waveBuffer = this.sharedCache[waveId] = this.audioContext.createBuffer(
                this.channelCount // numOfChannels
              , samplesPerCycle   // length
              , this.sampleRate   // sampleRate
            )
            if (config.meta) waveBuffer.meta = config.meta //@TODO should be at seqin-si level
            const f = Math.PI * 2 * config.cyclesPerBuffer / this.samplesPerBuffer
            for (let channel=0; channel<this.channelCount; channel++) {
                const waveChannelBuffer = waveBuffer.getChannelData(channel)
                for (let i=0; i<samplesPerCycle; i++) {
                    waveChannelBuffer[i] = Math.sin(i * f)
                }
            }
        }

        //// Create the wave from the cached wave.
        buffers.map( buffer => {
            buffer.id = 'r1ma'
            for (let channel=0; channel<this.channelCount; channel++) {
                const waveChannelBuffer = waveBuffer.getChannelData(channel)
                const outChannelBuffer = buffer.data.getChannelData(channel)
                for (let i=0; i<this.samplesPerBuffer; i++) {
                    outChannelBuffer[i] = waveChannelBuffer[i % samplesPerCycle]
                }
            }
        })

        return buffers
    }
}


//// Add static constants to the main class.
Object.defineProperties(SEQIN.Rich1MathSeqin, META)


}( 'object' === typeof window ? window : global )
