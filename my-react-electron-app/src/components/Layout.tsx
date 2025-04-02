import { useEffect, useState, createContext, useContext } from "react";
import Sidebar from "./Sidebar";
import { Navbar, Button } from "react-bootstrap";
import { useLanguage } from "../hooks/LanguageContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";

// Topbar context
const TopbarContext = createContext<{
  setTopbarActions: (actions: React.ReactNode) => void;
} | null>(null);

export const useTopbar = () => {
  const context = useContext(TopbarContext);
  if (!context) throw new Error("useTopbar must be used within Layout");
  return context;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { lang, setLang, t } = useLanguage();
  const [showSidebar, setShowSidebar] = useState(true);
  const [topbarActions, setTopbarActions] = useState<React.ReactNode>(null);

  useEffect(() => {
    const toggleHandler = () => setShowSidebar((prev) => !prev);
    window.addEventListener("toggle-sidebar", toggleHandler);
    return () => window.removeEventListener("toggle-sidebar", toggleHandler);
  }, []);

  return (
    <TopbarContext.Provider value={{ setTopbarActions }}>
      <div className="d-flex">
        <Sidebar visible={showSidebar} />

        <div className={`flex-grow-1 d-flex flex-column ${!showSidebar ? "menu-collapsed" : ""}`}>
          <div className="topbar d-flex justify-content-between align-items-center px-4 py-2 border-bottom shadow-sm">
            <div className="d-flex align-items-center gap-3">
              {topbarActions}
              <Button variant="primary" size="sm">
                {t("share")} ➔
              </Button>
            </div>

            <div className="d-flex align-items-center gap-2">
              <small className="text-muted">{t("last_updated")}</small>
              <span className="fw-semibold">👤 {t("profile")}</span>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setLang(lang === "en" ? "fr" : "en")}
              >
                {lang === "en" ? "FR " : "EN"}
              </Button>
            </div>
          </div>

          <main className="p-4 flex-grow-1 bg-light">{children}</main>
        </div>
      </div>
    </TopbarContext.Provider>
  );
};

export default Layout;
