// Import the LanguageProvider for multilingual support context
import { LanguageProvider } from "./hooks/LanguageContext";

// React Router imports to handle navigation and routing
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages/components to be rendered for specific routes
import HomePage from "./pages/HomePage";
import PatientPage from "./pages/PatientPage";

// Layout component that wraps all pages to provide consistent UI (topbar, sidebar, etc.)
import Layout from "./components/Layout";

const App = () => (
  // Wrap the entire application with LanguageProvider to provide language context globally
  <LanguageProvider>
    {/* Set up routing using React Router */}
    <Router>
      {/* Layout wraps all the pages to provide shared layout structure */}
      <Layout>
        {/* Define route-to-component mappings */}
        <Routes>
          {/* Route for the homepage */}
          <Route path="/" element={<HomePage />} />
          
          {/* Dynamic route for each patient’s page based on ID */}
          <Route path="/patient/:id" element={<PatientPage />} />
        </Routes>
      </Layout>
    </Router>
  </LanguageProvider>
);

export default App;
