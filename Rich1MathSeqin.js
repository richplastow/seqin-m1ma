!function (ROOT) { 'use strict'


//// Standard metadata about this Seqin.
const META = {
    NAME:    { value:'Rich1MathSeqin' }
  , ID:      { value:'r1ma'           }
  , VERSION: { value:'0.0.7'          }
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


    _buildBuffers (config) {

        //// Get empty buffers from MathSeqin, and then fill them with audio.
        return super._buildBuffers(config).then( buffers => {

            //// Return the filled buffers.
            return new Promise( (resolve, reject) => {

                const samplesPerCycle = this.samplesPerBuffer / config.cyclesPerBuffer


                //// Rich1MathSeqin notes are built from a single waveform.
                const singleWaveformId =
                    'r1ma'                 // universally unique ID for Rich1MathSeqin
                  + '_SW'                  // denotes a single-waveform cycle
                  + '_r'+this.sampleRate   // sample-frames per second
                  + '_c'+this.channelCount // number of channels
                  + '_w'+samplesPerCycle   // wavelength of the waveform-cycle in sample-frames

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


                //// The single-waveform is repeated for the length of the buffer.
                //// This will be played back with various ADSR envelopes applied to
                //// it, to produce the complete audio.
                const oscillationId =
                    'r1ma'                     // universally unique ID for Rich1MathSeqin
                  + '_OS'                      // denotes an oscillation buffer
                  + '_b'+this.samplesPerBuffer // number of sample-frames in each buffer
                  + '_r'+this.sampleRate       // sample-frames per second
                  + '_c'+this.channelCount     // number of channels
                  + '_w'+samplesPerCycle       // wavelength of the waveform-cycles in sample-frames

                //// No cached oscillation buffer? Generate it!
                let oscillation = this.sharedCache[oscillationId]
                if (! oscillation) {
                    oscillation = this.sharedCache[oscillationId] = this.audioContext.createBuffer(
                        this.channelCount     // numOfChannels
                      , this.samplesPerBuffer // length
                      , this.sampleRate       // sampleRate
                    )
                    if (config.meta) oscillation.meta = config.meta //@TODO should be at seqin-si level
                    const f = Math.PI * 2 * config.cyclesPerBuffer / this.samplesPerBuffer
                    for (let channel=0; channel<this.channelCount; channel++) {
                        const singleWaveformChannel = singleWaveform.getChannelData(channel)
                        const oscillationChannel = oscillation.getChannelData(channel)
                        for (let i=0; i<this.samplesPerBuffer; i++) {
                            oscillationChannel[i] = singleWaveformChannel[i % samplesPerCycle]
                        }//@TODO find a faster technique for duplicating audio
                    }
                }


                //// Convert config.events to an array of ADSR envelope nodes.
                const envelopeNodes = this._eventsToEnvelopeNodes(config)
                buffers.envelopeNodes = envelopeNodes // helpful for Seqinalysis

                //// Add a `reducedEnvelopeNodes` array to each buffer.
                buffers.forEach(
                    (buffer, i) => this._addReducedEnvelopeNodes(config, envelopeNodes, buffer, i)
                )


                //// Create the complete audio by repeating the cached single-waveform.
                buffers.forEach( (buffer, i) => {
                    const n = buffer.reducedEnvelopeNodes

                    //// Deal with a silent buffer.
                    if (2 === n.length && 0 === n[0].level && 0 === n[1].level) {
                        buffer.hasRendered = true
                        if ( buffers.every(el => el.hasRendered) ) resolve(buffers)
                        return // the buffer will retain its `si` ID, from seqin-si
                    }

                    //// Update the buffer ID.
                    this._reducedEnvelopeNodesToID(buffer, samplesPerCycle)

                    //// Already got a cached gain-envelope buffer?
                    let gainEnvelopeBuffer = this.sharedCache[buffer.id]
                    if (gainEnvelopeBuffer) { //@TODO DRY
                        if (config.meta) gainEnvelopeBuffer.meta = config.meta //@TODO should be at seqin-si level
                        buffer.data = gainEnvelopeBuffer
                        buffer.hasRendered = true
                        if ( buffers.every(el => el.hasRendered) ) resolve(buffers)
                        return
                    }

                    //// Otherwise, generate it!
                    if (! gainEnvelopeBuffer) {

                        //// We’re going to render the ADSR envelope ‘offline’.
                        const offlineCtx = new OfflineAudioContext(
                            this.channelCount     // numOfChannels
                          , this.samplesPerBuffer // length
                          , this.sampleRate       // sampleRate
                        )

                        //// Create a gain node and set its initial gain value.
                        const gainNode = offlineCtx.createGain()

                        //// Connect the oscillation AudioBuffer to the gainNode,
                        //// and the gainNode to the destination.
                        const source = offlineCtx.createBufferSource()
                        source.buffer = oscillation
                        source.connect(gainNode)
                        gainNode.connect(offlineCtx.destination)

                        //// The first gain-node is either zero or negative. If
                        //// negative, calculate the level at sample-frame zero.
                        let initialLevel = 0 === n[0].at
                          ? n[0].level
                          : (
                                (n[1].at / (n[1].at-n[0].at)) // ratio, where the triangle’s base crosses the origin
                              * (n[0].level - n[1].level)     // multiply by the triangle’s height (negative if upwards slope)
                              + n[1].level                    // add the height of the rightmost node
                            )

                        //// Set the initial gain node, and schedule the rest.
                        // gainNode.gain.value = initialLevel / 9 // a value between 0 and 9 @TODO remove this line if no browsers need it
                        gainNode.gain.setValueAtTime(initialLevel / 9, offlineCtx.currentTime)
                        for (let j=1; j<n.length; j++) // note `j=1`
                            gainNode.gain.linearRampToValueAtTime(
                                n[j].level / 9 // 'level' is a value between 0 and 9
                              , (n[j].at / this.sampleRate) + offlineCtx.currentTime
                            )

                        ////
                        source.start()
                        offlineCtx.startRendering().then( renderedBuffer => {
                            gainEnvelopeBuffer = this.sharedCache[buffer.id] = renderedBuffer
                            gainEnvelopeBuffer.meta = config.meta || {} //@TODO should be at seqin-si level
                            gainEnvelopeBuffer.reducedEnvelopeNodes = n

                            buffer.data = renderedBuffer

                            //// If all the gain-envelope buffers have rendered:
                            buffer.hasRendered = true
                            if ( buffers.every(el => el.hasRendered) ) resolve(buffers)

                        }).catch( err => console.log('Rendering failed: ' + err) )

                    }

                })
            })
        })

    }//_buildBuffers()


    _eventsToEnvelopeNodes (config) {

        //// Sort the events in time-order.
        config.events.sort( (a, b) => a.at - b.at )

        //// _eventsToCacheIDs() only understands a simple down-up movement.
        if (2 !== config.events.length)
            throw new Error(`Seqin:_eventsToCacheIDs(): config.events must contain exactly 2 events, not ${config.events.length}`)
        if (! config.events[0].down)
            throw new Error(`Seqin:_eventsToCacheIDs(): config.events[0] must have a 'down' property`)
        if (0 !== config.events[1].down)
            throw new Error(`Seqin:_eventsToCacheIDs(): config.events[1].down must be 0, not ${config.events[1].down}`)

        //// Convert the list of events into a list of ADSR nodes. `filter(...)`
        //// removes duplicate nodes - eg start-of-sustain and start-of-release
        //// if `downEnd-downStart` is less than `attackDuration+decayDuration`.
        const
            attackDuration = 300
          , decayDuration = 900
          , releaseDuration = 1000
          , downStart = config.events[0].at
          , downEnd = Math.max( downStart + attackDuration + decayDuration, config.events[1].at)
          , finalSampleFramePlusOne = config.bufferCount * this.samplesPerBuffer
          , attackLevel = config.events[0].down
          , sustainLevel = Math.ceil(config.events[0].down / 2)
          , envelopeNodes = [
                { at:downStart,                                  level:0            } // start of attack
              , { at:downStart + attackDuration,                 level:attackLevel  } // start of decay
              , { at:downStart + attackDuration + decayDuration, level:sustainLevel } // start of sustain
              , { at:downEnd,                                    level:sustainLevel } // start of release
              , { at:downEnd + releaseDuration,                  level:0            } // end of release
            ].filter( (node, i, self) => i === self.findIndex(
                n => n.at === node.at && n.level === node.level
            ) )

        //// If the attack is not scheduled to start on the first sample-frame,
        //// insert an ADSR node with zero-level there.
        if (0 !== downStart)
            envelopeNodes.unshift({ at:0, level:0 })

        //// If the end-of-release node is placed on or before the the last
        //// buffer’s final sample-frame, insert a zero-level node after it.
        if (downEnd + releaseDuration < finalSampleFramePlusOne)
            envelopeNodes.push({ at:finalSampleFramePlusOne, level:0 })

        return envelopeNodes
    }//_eventsToEnvelopeNodes()


    _addReducedEnvelopeNodes (config, envelopeNodes, buffer, i) {

        //// Get this buffer’s first and last sample-frame.
        const first = this.samplesPerBuffer * i
        const last  = this.samplesPerBuffer * i + this.samplesPerBuffer - 1

        //// Determine which ADSR nodes have an effect on this buffer.
        let before, inner = [], after
        for (let j=0; j<envelopeNodes.length; j++) {
            const { at, level } = envelopeNodes[j]
            if (first >= at)
                before = { at, level } // last node before the buffer begins
            else if (last > at)
                inner.push({ at, level }) // a node somewhere in the middle of the buffer
            else {
                after = { at, level } // first node after the buffer ends
                break
            }
        }

        const rightOfBefore = inner[0] || after
        const leftOfAfter = inner[inner.length-1] || before

        //// Where a level enters the buffer horizontally...
        if (before.level === rightOfBefore.level)
            before.at = first // ...trim `before.at`

        //// Where a level exits the buffer horizontally...
        if (after.level === leftOfAfter.level)
            after.at = last+1 // ...trim `after.at`

        ////@TODO trim where angles cut across buffer-boundaries at precisely integer values

        //// Attach the reduced ADSR nodes to the buffer, with 'at' values
        //// converted from absolute to relative.
        buffer.reducedEnvelopeNodes =
            [ before ].concat(inner).concat(after)
           .map( n => ({ at: n.at -= first, level:n.level }) )

// console.log(i, first, last, buffer.reducedEnvelopeNodes.map( n => n.at+'='+n.level ).join(' '));
    }//_addReducedEnvelopeNodes()


    _reducedEnvelopeNodesToID (buffer, samplesPerCycle) {
        const ns = buffer.reducedEnvelopeNodes

        //// The buffer ID’s start does not depend on its ADSR envelope.
        buffer.id =
            'r1ma'                     // universally unique ID for Rich1MathSeqin
          + '_GE'                      // denotes a buffer with a gain-envelope applied
          + '_b'+this.samplesPerBuffer // number of sample-frames in each buffer
          + '_r'+this.sampleRate       // sample-frames per second
          + '_c'+this.channelCount     // number of channels
          + '_w'+samplesPerCycle       // wavelength of the waveform-cycle in sample-frames
          + '_'

        //// Deal with a simple horizontal level.
        if (2 === ns.length && ns[0].level === ns[1].level)
            return buffer.id += 'g' + ns[0].level // eg '..._g4' if it stays at level 4

        //// Deal with a simple diagonal level.
        if (2 === ns.length && 0 === ns[0].at && this.samplesPerBuffer === ns[1].at)
            return buffer.id += 'g' + ns[0].level + 'L' + ns[1].level // eg '..._g4L0' if it’s level 4 at 0, and level 0 on the last sample-frame

        //// Look for highest common factor in all 'at' values.
        let gcd = (a, b) => b ? gcd(b, a % b) : a
          , ats = ns.map(n => n.at) // eg `[24,12,3,15,30,60]` would be `3`
          , a = ats[0]
        for (let i=0, b; i<ats.length; i++)
            if ( null != (b = ats[i+1]) )
                a = gcd(a, b)
        const grid = Math.abs(a)
// console.log(ats, grid);
        buffer.id += (1 === grid ? '' : grid) + 'g' // eg '..._1000g' for a 6000-samplesPerBuffer buffer chopped into 6 imaginary peices

        //// The first node’s 'at' is always zero or negative. If it’s zero we
        //// leave it out. If it’s negative we chop off the minus sign.
        if (0 < ns[0].at)
            throw new Error(`Rich1MathSeqin:_reducedEnvelopeNodesToID(): Unreachable?! The first node shouldn’t be able to be at ${ns[0].at}!`)
        if (0 > ns[0].at)
            buffer.id += ns[0].at / -grid

        //// Add the first nodes’s level.
        buffer.id += ns[0].level

        //// Add the grid-aware 'at', and also the level, for each inner-node.
        for (let i=1; i<ns.length-1; i++)
            buffer.id += `L${ns[i].at/grid}${ns[i].level}` // 'L' means 'draw a linear line to'

        //// The rightmost node’s 'at' can be left out if it sits exactly on the
        //// sample-frame at the start of the following buffer.
        const rn = ns[ns.length-1]
        if (this.samplesPerBuffer > rn.at)
            throw new Error(`Rich1MathSeqin:_reducedEnvelopeNodesToID(): Unreachable?! The last node shouldn’t be able to be at ${rn.at}!`)
        if (this.samplesPerBuffer === rn.at)
            buffer.id += `L${rn.level}`
        else
            buffer.id += `L${rn.at/grid}${rn.level}`

    }//_reducedEnvelopeNodesToID()

}//Rich1MathSeqin


//// Add static constants to the main class.
Object.defineProperties(SEQIN.Rich1MathSeqin, META)


}( 'object' === typeof window ? window : global )
