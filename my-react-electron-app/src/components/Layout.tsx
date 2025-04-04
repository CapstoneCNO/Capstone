// Layout wraps all pages of the application, providing a consistent sidebar, topbar, and responsive layout behavior.

// React imports
import { useEffect, useState, createContext, useContext } from "react";

// Custom components
import Sidebar from "./Sidebar";

// Bootstrap UI components
import { Button, Dropdown } from "react-bootstrap";

// Language context hook
import { useLanguage } from "../hooks/LanguageContext";

// Styles
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";

// Context for injecting custom elements into the topbar
const TopbarContext = createContext<{
  setTopbarActions: (actions: React.ReactNode) => void;
} | null>(null);

// Custom hook to access topbar context
export const useTopbar = () => {
  const context = useContext(TopbarContext);
  if (!context) throw new Error("useTopbar must be used within Layout");
  return context;
};

// Main layout wrapper for your app
const Layout = ({ children }: { children: React.ReactNode }) => {
  const { lang, setLang, t } = useLanguage();

  // State for toggling sidebar and topbar content
  const [showSidebar, setShowSidebar] = useState(true);
  const [topbarActions, setTopbarActions] = useState<React.ReactNode>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Setup listeners for sidebar toggle and screen resize
  useEffect(() => {
    const toggleHandler = () => setShowSidebar((prev) => !prev);
    const handleResize = () => setIsMobile(window.innerWidth < 768);

    window.addEventListener("toggle-sidebar", toggleHandler);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("toggle-sidebar", toggleHandler);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <TopbarContext.Provider value={{ setTopbarActions }}>
      <div className="d-flex">
        {/* Left sidebar navigation */}
        <Sidebar visible={showSidebar} />

        {/* Main content area */}
        <div
          className={`flex-grow-1 d-flex flex-column ${
            !showSidebar ? "menu-collapsed" : ""
          }`}
        >
          {/* Top navigation bar */}
          <div
            className="topbar d-flex justify-content-between align-items-center px-4 py-2 shadow-sm"
            style={{
              backgroundColor: "#53c89b",
              borderBottom: "2px solid #4ab28a",
              color: "white",
            }}
          >
            {/* Mobile: show a dropdown menu for compact view */}
            {isMobile ? (
              <div className="ms-auto">
                <Dropdown align="end">
                  <Dropdown.Toggle
                    variant="secondary"
                    size="sm"
                    className="d-flex align-items-center border-0 mobile-menu-button"
                    style={{
                      boxShadow: "none",
                      backgroundColor: "#f1f1f1",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.375rem",
                    }}
                  >
                    <i className="bi bi-three-dots-vertical" />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Header>{t("last_updated")}</Dropdown.Header>
                    <Dropdown.Item disabled>
                      <i className="bi bi-person me-2" /> {t("profile")}
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => setLang(lang === "en" ? "fr" : "en")}
                    >
                      {lang === "en" ? "FR" : "EN"}
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item as="button" className="text-success">
                      {t("share")} ➔
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            ) : (
              // Desktop: show full topbar layout
              <div className="d-flex justify-content-between w-100 align-items-center">
                <div className="d-flex align-items-center gap-3">
                  {/* Injected topbar buttons or actions */}
                  {topbarActions}
                  <Button variant="success" size="sm">
                    {t("share")} ➔
                  </Button>
                </div>

                {/* Right side: user info and language toggle */}
                <div className="d-flex align-items-center gap-2 text-white">
                  <small className="text-white-50">{t("last_updated")}</small>
                  <span className="fw-semibold">
                    <i className="bi bi-person me-1" /> {t("profile")}
                  </span>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => setLang(lang === "en" ? "fr" : "en")}
                  >
                    {lang === "en" ? "FR" : "EN"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Main content area */}
          <main className="p-4 flex-grow-1 bg-light">{children}</main>
        </div>
      </div>
    </TopbarContext.Provider>
  );
};

export default Layout;
