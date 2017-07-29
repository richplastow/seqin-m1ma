//// 'specific', because these tests will only run on this package’s class.

//// 'browser', because these tests need a fully functional AudioContext. That
//// means they’ll only run in the browser, not Node.js.

!function (ROOT) {

const
    a         = chai.assert
  , expect    = chai.expect
  , eq        = a.strictEqual
  , ok        = a.isOk
  , fail      = a.fail

    //// To test a `Seqin` sub-class called `MyGreatSeqin`, you should have set:
    //// window.TestMeta = { // replace `window` with `global` for Node.js
    ////     NAME:    { value:'MyGreatSeqin' }
    ////   , ID:      { value:'mygt'       }
    ////   , VERSION: { value:'1.2.3'    }
    ////   , SPEC:    { value:'20170728' }
    ////   , HELP:    { value: 'This is literally the best Seqin ever made!' }
    //// }
  , TestMeta = ROOT.TestMeta
  , TestClassName = TestMeta.NAME.value
  , TestClass = SEQIN[TestClassName]


describe(`Test specific browser '${TestClassName}'`, () => {

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
                ok(Array.isArray(buffers), `buffers is ${typeof buffers} not an array` )
                buffers.forEach( (buffer,i) => {
                    eq( buffer.id, undefined, `buffers[${i}].id should not exist` )
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
                      , 'd3532b0f58880750fecf653f853b14071f5486c5334d12321f108d25ad8f1095'
                      , `buffers[${i}].data.getChannelData(0) (left channel) has incorrect hash`
                    )
                    eq(
                        asmCrypto.SHA256.hex( new Uint8Array(channelDataR.buffer) )
                      , 'd3532b0f58880750fecf653f853b14071f5486c5334d12321f108d25ad8f1095'
                      , `buffers[${i}].data.getChannelData(1) (right channel) has incorrect hash`
                    )

                    // console.log(i, 'left' , asmCrypto.SHA256.hex( new Uint8Array(channelDataL.buffer) ))
                    // console.log(i, 'right', asmCrypto.SHA256.hex( new Uint8Array(channelDataR.buffer) ))
                })
/*
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
*/
            })
    	})


    })

})

}( 'object' === typeof window ? window : global )
