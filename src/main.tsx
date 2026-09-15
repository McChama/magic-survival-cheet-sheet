import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { FONT_URL } from './config/assets'
import { initUiClickSound } from './engine/uiSound'

initUiClickSound()

// Registered here (not a static @font-face url() in index.css) so the path resolves
// against Vite's `base` — see src/config/assets.ts.
new FontFace('MagicSurvival', `url(${FONT_URL})`)
  .load()
  .then((loaded) => document.fonts.add(loaded))
  .catch(() => {
    // Fonts fall back to the ui-sans-serif/system-ui stack already listed everywhere
    // MagicSurvival is used — a failed load just means that fallback stays in effect.
  })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
