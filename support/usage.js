/*
Tested
------
+ __Android 7.1 (Pixel):__  Chrome 58+, Firefox 51+
+ __iOS 10.3 (iPad Pro):__  Safari 10+
+ __Windows 10:__           Edge 14+, Chrome 51+, Opera 38+
+ __Windows XP:__           Firefox 45+
+ __OS X El Sierra:__       Safari 10.1+
*/

!function (ROOT) {

ROOT.sharedCache = {}

const
    d = document
  , $ = s => d.querySelector.call(d, s)
  , $$ = s => d.querySelectorAll.call(d, s)

let notes = []
  , samplesPerBuffer, sampleRate
  , $out, $layered, layeredCanvasCtx, audioCtx, $sharedCache, Rich1MathSeqin
  , maxNoteSamples = 0
  , layeredWidth = ROOT.innerWidth - 16 // `-16` for 8px margins on each side
  , layeredHeight = 800 < ROOT.innerHeight ? 200 : 100
  , zoom = 1, scroll = 0 // zoom 1 fits everything in `layeredWidth`

ROOT.usage = {

    //// Initialises the app.
    init: config => {

        //// Record config.
        samplesPerBuffer = config.samplesPerBuffer || 900
        sampleRate = config.sampleRate || 44100

        $out = $('#usage')

        //// Create a canvas to visualise notes layered on top of each other.
        $layered = document.createElement('canvas')
        $layered.className = 'layered-visualiser'
        $layered.width = layeredWidth
        $layered.height = layeredHeight
        $out.appendChild($layered)
        layeredCanvasCtx = $layered.getContext('2d')

        //// Create a container to visualise the sharedCache.
        $sharedCache = document.createElement('div')
        $sharedCache.className = 'shared-cache-visualiser'
        $out.appendChild($sharedCache)

        //// Set up audio.
        audioCtx = new (ROOT.AudioContext||ROOT.webkitAudioContext)()
        Rich1MathSeqin = new SEQIN.Rich1MathSeqin({
            audioContext: audioCtx
          , sharedCache: ROOT.sharedCache
          , samplesPerBuffer
          , sampleRate
          , channelCount: 1
        })

        //// Deal with keypresses.
		ROOT.addEventListener('keydown', evt => {
            if (evt.ctrlKey || evt.metaKey) return // ignore browser shortcuts
            Array.from( $$('.btn') ).forEach( $button => {
                const key = $button.getAttribute('data-key')
                if (! key) return
    			if (key === evt.key) $button.click()
                if ( key === evt.key || ('Enter' === evt.key && document.activeElement === $button) ) {
                    const c = $button.classList
                    if (! c.contains('pressed') ) {
                        c.add('pressed')
                        setTimeout( () => c.remove('pressed'), 200)
                    }
                }
            })
		})

        //// Deal with window size change.
		ROOT.addEventListener('resize', evt => {
            layeredWidth = ROOT.innerWidth - 16
            layeredHeight = 800 < ROOT.innerHeight ? 200 : 100
            $layered.width = layeredWidth
            $layered.height = layeredHeight
            updateLayeredVisualiser()
		})

    }


    //// A button generates and plays a note, and draws its waveform.
  , addButton: config => {

        //// Create the button.
        const $button = d.createElement('a')
        const color = `rgb(${config.red||0},${config.green||0},${config.blue||0})`
        $button.className = 'btn'
        $button.href = 'javascript:!1'
        $button.innerHTML = config.text
        $button.style.color = color
        if (config.key)
            $button.setAttribute('data-key', config.key)
        $out.appendChild($button)

        //// Deal with a click.
        $button.addEventListener('click', evt => {
            evt.preventDefault()

            //// Generate the note.
            const buffers = Rich1MathSeqin.getBuffers({
                bufferCount: config.bufferCount || 1
              , cyclesPerBuffer: config.cyclesPerBuffer
              , isLooping: false
              , events: [
                    { at:0, down:config.velocity }
                  , { at:900, up:1 }
                ]
              , meta: config
            })

            //// Store it.
            notes.push({ config, buffers })
            maxNoteSamples = Math.max( maxNoteSamples, samplesPerBuffer * (config.bufferCount||1) )

            //// Update the layered and sharedCache visualisers.
            updateLayeredVisualiser()
            updateSharedCacheVisualiser()

            //// Play the note.
            const src = audioCtx.createBufferSource()
            src.buffer = buffers[0].data
            src.connect(audioCtx.destination)
            src.start(0)

            return false
        })

    }

  , scrollTo: to => {
        scroll = to
        updateLayeredVisualiser()
    }

  , scrollBy: by => {
        scroll += by
        scroll = Math.max( Math.min(scroll, layeredWidth), 0) // clamp
        updateLayeredVisualiser()
    }

  , zoomTo: to => {
        zoom = 0 !== to ? to : maxNoteSamples / layeredWidth // zero means 'show the entire waveform'
        zoom = Math.max( Math.min(zoom, 16), 0.05)
        updateLayeredVisualiser()
    }

  , zoomBy: by => {
        zoom *= by
        zoom = Math.max( Math.min(zoom, 16), 0.05) // clamp
        updateLayeredVisualiser()
    }

  , clearNotes: () => {
        notes = []
        updateLayeredVisualiser()
    }


}


function updateLayeredVisualiser () {

    //// Delete the previous visualisation.
	layeredCanvasCtx.clearRect(0, 0, $layered.width, $layered.height)

	//// Draw each note’s waveform.
    notes.forEach( (note,i) => {

        //// Draw a filled shape.
        const
    	    channelBuffer = note.buffers[0].data.getChannelData(0)
          , xPerFrame = layeredWidth / maxNoteSamples * zoom

            //// When zoomed in, interleave each waveform’s line.
          , xOffset = (1 >= xPerFrame ? 0 : (i % notes.length) * xPerFrame / notes.length)

            //// Set the waveform colour.
          , fillColor = layeredCanvasCtx.createLinearGradient(0,0, 0,layeredHeight)
          , red = note.config.red, green = note.config.green, blue = note.config.blue
        fillColor.addColorStop(0.0, `rgba(${red||0},${green||0},${blue||0},1)`)
        fillColor.addColorStop(0.5, `rgba(${red||0},${green||0},${blue||0},0.3)`)
        fillColor.addColorStop(1.0, `rgba(${red||0},${green||0},${blue||0},1)`)
        layeredCanvasCtx.fillStyle = fillColor

        //// Step through each x position of the layered-canvas.
        let draws = 0
        for ( let x=xOffset; x<layeredWidth; x+=Math.max(xPerFrame,1) ) {
            const sampleValue = channelBuffer[ Math.floor((x + scroll) / xPerFrame) ]
            if (null == sampleValue) break // end of data
            layeredCanvasCtx.fillRect(
                x                                // x position
              , layeredHeight * 0.5                         // y position
              , 1                                           // width
              , sampleValue * layeredHeight * -0.5 // height
            )
            draws++
        }
    })
}


function updateSharedCacheVisualiser () {

    //// Remove visualised audio which is no longer in the cache.
    ////@TODO

    //// Add any new visualisations.
    for (let cacheId in ROOT.sharedCache) {
        if ( $('#'+cacheId) ) continue // a visualisation already exists
        const
            cache = ROOT.sharedCache[cacheId]
          , channelBuffer = cache.getChannelData(0)
          , $figure = document.createElement('figure')
          , $link = document.createElement('a')
          , $caption = document.createElement('caption')
          , $cacheCanvas = document.createElement('canvas')

        //// HTML
        $figure.id = cacheId
        $link.className = 'btn'
        $link.href = 'javascript:void(0)'
        $link.addEventListener('click', evt => {
             const isShowing = $figure.classList.contains('show')
             Array.from( $$('.shared-cache-visualiser figure.show') ).forEach(
                 $figure => $figure.classList.remove('show') )
             if (! isShowing) $figure.classList.add('show')
        })
        $cacheCanvas.width = cache.length
        $cacheCanvas.height = 100
        $link.appendChild($cacheCanvas)
        $figure.appendChild($link)
        $figure.appendChild($caption)
        $caption.innerHTML = cacheId
        $sharedCache.appendChild($figure)

        //// Draw the cached waveform.
        const
            cacheCanvasCtx = $cacheCanvas.getContext('2d')
          , fillColor = cacheCanvasCtx.createLinearGradient(0,0, 0,100)
          , red = cache.meta.red, green = cache.meta.green, blue = cache.meta.blue
        fillColor.addColorStop(0.0, `rgba(${red||0},${green||0},${blue||0},1)`)
        fillColor.addColorStop(0.5, `rgba(${red||0},${green||0},${blue||0},0.3)`)
        fillColor.addColorStop(1.0, `rgba(${red||0},${green||0},${blue||0},1)`)
        cacheCanvasCtx.fillStyle = fillColor
        for (let frame=0; frame<cache.length; frame++) {
            cacheCanvasCtx.fillRect(frame,50, 1,channelBuffer[frame] * -50) // x,y,w,h
        }
    }
}


}( 'object' === typeof window ? window : global )
