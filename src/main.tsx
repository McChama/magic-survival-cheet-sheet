import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { IS_COMPANION } from './config/platform'
import { initUiClickSound } from './engine/uiSound'

initUiClickSound()
// Live sync only does anything inside the Android companion (android/), so only there is its code
// loaded at all — a browser never downloads it. See src/capture/bridge.ts.
if (IS_COMPANION) void import('./capture/bridge').then(({ initCaptureBridge }) => initCaptureBridge())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
