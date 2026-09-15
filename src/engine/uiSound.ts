const CLICK_SOUND_SRC = `${import.meta.env.BASE_URL}assets/audio/ui/Sound_UI1.wav`
const CLICK_SOUND_VOLUME = 0.1 // 0 (silent) to 1 (full volume)
const CLICKABLE_SELECTOR =
  'button, a[href], [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="checkbox"], [role="radio"], [role="switch"], input[type="button"], input[type="submit"], input[type="reset"], select, summary, [data-ui-sound]'

let audioContext: AudioContext | null = null
let audioBuffer: AudioBuffer | null = null
let loadPromise: Promise<AudioBuffer | null> | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

async function loadClickBuffer(): Promise<AudioBuffer | null> {
  if (audioBuffer) return audioBuffer
  if (!loadPromise) {
    loadPromise = fetch(CLICK_SOUND_SRC)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => getAudioContext().decodeAudioData(arrayBuffer))
      .then((buffer) => {
        audioBuffer = buffer
        return buffer
      })
      .catch(() => null)
  }
  return loadPromise
}

function playClickSound() {
  const context = getAudioContext()
  if (context.state === 'suspended') {
    void context.resume()
  }

  if (audioBuffer) {
    const source = context.createBufferSource()
    source.buffer = audioBuffer
    const gain = context.createGain()
    gain.gain.value = CLICK_SOUND_VOLUME
    source.connect(gain)
    gain.connect(context.destination)
    source.start(0)
  } else {
    // Buffer not decoded yet (first click raced the async load) — play once it's ready.
    void loadClickBuffer().then(() => playClickSound())
  }
}

export function initUiClickSound() {
  void loadClickBuffer()

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as Element | null
      if (target?.closest(CLICKABLE_SELECTOR)) {
        playClickSound()
      }
    },
    { capture: true },
  )
}
