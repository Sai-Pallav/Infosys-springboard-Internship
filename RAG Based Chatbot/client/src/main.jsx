import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import SharedChatView from './components/SharedChatView.jsx'

const isShared = window.location.pathname.startsWith('/share/');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isShared ? <SharedChatView /> : <App />}
  </StrictMode>,
)
