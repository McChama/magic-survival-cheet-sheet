const CLICK_SOUND_SRC = '/assets/audio/ui/Sound_UI1.wav'
const CLICK_SOUND_VOLUME = 0.1 // 0 (silent) to 1 (full volume)
const CLICKABLE_SELECTOR =
  'button, a[href], [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="checkbox"], [role="radio"], [role="switch"], input[type="button"], input[type="submit"], input[type="reset"], select, summary, [data-ui-sound]'

let audioPool: HTMLAudioElement[] = []
let poolIndex = 0
const POOL_SIZE = 6

function getAudioPool(): HTMLAudioElement[] {
  if (audioPool.length === 0) {
    audioPool = Array.from({ length: POOL_SIZE }, () => {
      const audio = new Audio(CLICK_SOUND_SRC)
      audio.preload = 'auto'
      audio.volume = CLICK_SOUND_VOLUME
      return audio
    })
  }
  return audioPool
}

function playClickSound() {
  const pool = getAudioPool()
  const audio = pool[poolIndex]
  poolIndex = (poolIndex + 1) % pool.length
  audio.currentTime = 0
  void audio.play().catch(() => {})
}

export function initUiClickSound() {
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
