//// 'specific', because these tests will only run on this package’s class.

//// 'browser', because these tests need a fully functional AudioContext. That
//// means they’ll only run in the browser, not Node.js.

!function (ROOT) {

const
    a         = chai.assert
  , expect    = chai.expect
  , eq        = a.strictEqual
  , fail      = a.fail

    //// To test a `Seqin` subclass called `MyGreatSeqin`, you should have set:
    //// window.TestClassName = 'MyGreatSeqin'
  , TestClass = SEQIN[ROOT.TestClassName]


describe(`Test specific browser '${ROOT.TestClassName}'`, () => {

	describe('perform() response', () => {
        const ctx = new (ROOT.AudioContext||ROOT.webkitAudioContext)()
        const cache = {}

    	it(`Promise should respond with expected buffers, and add to cache`, () => {
            const testInstance = new TestClass({
                audioContext:     ctx
              , sharedCache:      cache
              , samplesPerBuffer: 2340
              , sampleRate:       23400
              , channelCount:     2
            })
            return testInstance.perform({
                bufferCount:     8
              , cyclesPerBuffer: 234
              , isLooping:       true
              , events:          []
            }).then( buffers => {
                buffers.forEach( (buffer,i) => {
                    eq( buffer.id, 'r1ma', `buffers[${i}].id is incorrect` )
                    const channelDataL = buffer.data.getChannelData(0)
                    const channelDataR = buffer.data.getChannelData(1)
                    // if (0 == i) {
                    //     const ui8 = new Uint8Array(channelDataL.buffer);
                    //     console.log('first two F32 (buffers[0] left channel)', channelDataL.slice(0,2));
                    //     console.log('first eight UI8 (buffers[0] left channel)', ui8.slice(0,8));
                    //     console.log('last two F32 (buffers[0] left channel)', channelDataL.slice(-2));
                    //     console.log('last eight UI8 (buffers[0] left channel)', ui8.slice(-8));
                    // }
                    eq(channelDataL.length, 2340, `buffers[${i}].data.getChannelData(0) (left channel) has wrong length`)
                    eq(channelDataR.length, 2340, `buffers[${i}].data.getChannelData(1) (right channel) has wrong length`)
                    eq(
                        asmCrypto.SHA256.hex( new Uint8Array(channelDataL.buffer) )
                      , '7ba35a6aca885b6126b2f9ecc06bfc3b0cd43631f996fb0d8170f3f5b5a32b7f'
                      , `buffers[${i}].data.getChannelData(0) (left channel) has incorrect hash`
                    )
                    eq(
                        asmCrypto.SHA256.hex( new Uint8Array(channelDataR.buffer) )
                      , '7ba35a6aca885b6126b2f9ecc06bfc3b0cd43631f996fb0d8170f3f5b5a32b7f'
                      , `buffers[${i}].data.getChannelData(1) (right channel) has incorrect hash`
                    )

                    // console.log(i, 'left' , asmCrypto.SHA256.hex( new Uint8Array(channelDataL.buffer) ))
                    // console.log(i, 'right', asmCrypto.SHA256.hex( new Uint8Array(channelDataR.buffer) ))
                })
                for (let id in cache) {
                    if ('r1ma_sw_s23400_c2_l10' === id) {
                        const channelDataL = cache[id].getChannelData(0)
                        const channelDataR = cache[id].getChannelData(1)
                        // const ui8 = new Uint8Array(channelDataL.buffer);
                        // console.log('first two F32 (buffers[0] left channel)', channelDataL.slice(0,2));
                        // console.log('first eight UI8 (buffers[0] left channel)', ui8.slice(0,8));
                        // console.log('last two F32 (buffers[0] left channel)', channelDataL.slice(-2));
                        // console.log('last eight UI8 (buffers[0] left channel)', ui8.slice(-8));
                        eq(channelDataL.length, 10, `cache.${id}.data.getChannelData(0) (left channel) has wrong length`)
                        eq(channelDataL.length, 10, `cache.${id}.data.getChannelData(1) (right channel) has wrong length`)
                        eq(
                            asmCrypto.SHA256.hex( new Uint8Array(channelDataL.buffer) )
                          , '13a27ada6d9ecf0a492f045276fefb47c2a0933f17b0c5130dec512093abd46d'
                          , `cache.${id}.data.getChannelData(0) (left channel) has incorrect hash`
                        )
                        eq(
                            asmCrypto.SHA256.hex( new Uint8Array(channelDataR.buffer) )
                          , '13a27ada6d9ecf0a492f045276fefb47c2a0933f17b0c5130dec512093abd46d'
                          , `cache.${id}.data.getChannelData(1) (right channel) has incorrect hash`
                        )
                    } else {
                        fail('no unexpected id', id, `Found unexpected id '${id}' in the cache`)
                    }
                }
            })
    	})


    })

})

}( 'object' === typeof window ? window : global )
