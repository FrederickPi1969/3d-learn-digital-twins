import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import './styles/hud.css'

;(window as typeof window & { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL = '/cesium/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
