import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './m/App'
import './m/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
