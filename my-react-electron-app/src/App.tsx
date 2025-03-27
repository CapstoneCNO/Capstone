import { LanguageProvider } from "./hooks/LanguageContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PatientPage from "./pages/PatientPage";
import Layout from "./components/Layout"; // ← Make sure this is imported

const App = () => (
  <LanguageProvider>
    <Router>
      <Layout> {/* ← Layout wraps the routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/patient/:id" element={<PatientPage />} />
        </Routes>
      </Layout>
    </Router>
  </LanguageProvider>
);

export default App;
