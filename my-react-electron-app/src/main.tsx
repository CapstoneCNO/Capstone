// Import React's StrictMode which helps identify potential problems in an application
import { StrictMode } from 'react'

// Import the function to create the React root and render your app
import { createRoot } from 'react-dom/client'

// Import global CSS styles
import './index.css'

// Import Bootstrap Icons (for UI icons)
import "bootstrap-icons/font/bootstrap-icons.css";

// Import the main App component (your entire frontend application starts here)
import App from './App.tsx'

// Find the root HTML element and render the App component inside it
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App /> {/* Main application component wrapped in StrictMode for highlighting issues */}
  </StrictMode>,
)
