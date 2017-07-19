!function (ROOT) { 'use strict'


//// Standard metadata about this Seqin.
const META = {
    NAME:    { value:'Rich1MathSeqin' }
  , ID:      { value:'r1ma'           }
  , VERSION: { value:'0.0.6'          }
  , SPEC:    { value:'20170705'       }
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


    _buildBuffers(config) {

        //// Get empty buffers.
        return super._buildBuffers(config).then( buffers => {

            const samplesPerCycle = this.samplesPerBuffer / config.cyclesPerBuffer

            //// Rich1MathSeqin notes are built from a single waveform.
            const singleWaveformId =
                'r1ma'                 // universally unique ID for Rich1MathSeqin
              + '_sw'                  // denotes a single-waveform cycle
              + '_s'+this.sampleRate   // sample-frames per second
              + '_c'+this.channelCount // number of channels
              + '_l'+samplesPerCycle   // length of the waveform-cycle in sample-frames

            //// No cached single-waveform? Generate it!
            let singleWaveform = this.sharedCache[singleWaveformId]
            if (! singleWaveform) {
                singleWaveform = this.sharedCache[singleWaveformId] = this.audioContext.createBuffer(
                    this.channelCount // numOfChannels
                  , samplesPerCycle   // length
                  , this.sampleRate   // sampleRate
                )
                if (config.meta) singleWaveform.meta = config.meta //@TODO should be at seqin-si level
                const f = Math.PI * 2 * config.cyclesPerBuffer / this.samplesPerBuffer
                for (let channel=0; channel<this.channelCount; channel++) {
                    const singleWaveformChannel = singleWaveform.getChannelData(channel)
                    for (let i=0; i<samplesPerCycle; i++) {
                        singleWaveformChannel[i] = Math.sin(i * f)
                    }
                }
            }

            //// Create the complete audio by repeating the cached single-waveform.
            buffers.map( buffer => {
                buffer.id = 'r1ma'
                for (let channel=0; channel<this.channelCount; channel++) {
                    const singleWaveformChannel = singleWaveform.getChannelData(channel)
                    const outChannelBuffer = buffer.data.getChannelData(channel)
                    for (let i=0; i<this.samplesPerBuffer; i++) {
                        outChannelBuffer[i] = singleWaveformChannel[i % samplesPerCycle]
                    }//@TODO find a faster technique for duplicating audio
                }
            })

            //// Return the filled buffers.
            return Promise.resolve(buffers)
        })

    }//_buildBuffers()

}//Rich1MathSeqin


//// Add static constants to the main class.
Object.defineProperties(SEQIN.Rich1MathSeqin, META)


}( 'object' === typeof window ? window : global )
