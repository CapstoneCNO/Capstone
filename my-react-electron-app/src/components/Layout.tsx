import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { Navbar, Button } from "react-bootstrap";
import { useLanguage } from "../hooks/LanguageContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { lang, setLang, t } = useLanguage();
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    const toggleHandler = () => setShowSidebar((prev) => !prev);
    window.addEventListener("toggle-sidebar", toggleHandler);
    return () => window.removeEventListener("toggle-sidebar", toggleHandler);
  }, []);

  return (
    <div className="d-flex">
      <Sidebar visible={showSidebar} />

      <div className={`flex-grow-1 d-flex flex-column ${!showSidebar ? "menu-collapsed" : ""}`}>
        <div className="topbar d-flex justify-content-between align-items-center px-4 py-2 border-bottom shadow-sm">
          <div className="d-flex align-items-center gap-3">
            <span role="img" aria-label="folder">📂</span>
            <small className="text-muted">⏰ 22 hours ago</small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Button variant="primary" size="sm">
              {t("share")} ➔
            </Button>
            <span className="fw-semibold">👤 {t("profile")}</span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setLang(lang === "en" ? "fr" : "en")}
            >
              {lang === "en" ? "FR 🇫🇷" : "EN 🇬🇧"}
            </Button>
          </div>
        </div>

        <main className="p-4 flex-grow-1 bg-light">{children}</main>
      </div>
    </div>
  );
};

export default Layout;