// React and hooks
import { useState } from "react";
// UI components from React Bootstrap
import {
  Nav,
  Form,
  OverlayTrigger,
  Tooltip,
  Collapse,
} from "react-bootstrap";
// Routing for navigation
import { NavLink } from "react-router-dom";
// Context hook for i18n translations
import { useLanguage } from "../hooks/LanguageContext";
// Modal component to add a new patient
import AddPatientModal from "./AddPatientModal";
// Global styles
import "../index.css";

// Sidebar component receives a `visible` prop to determine if sidebar should expand or collapse
const Sidebar = ({ visible }: { visible: boolean }) => {
  const { t } = useLanguage(); // Translation hook
  const [patientsOpen, setPatientsOpen] = useState(true); // Toggle patient list open/closed
  const [showAddModal, setShowAddModal] = useState(false); // Controls visibility of AddPatientModal
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu toggle

  // Initial patient list
  const [patientList, setPatientList] = useState<string[]>([
    "Beaulieu, Nick",
    "Oudououha, Omar",
    "Sun, Christopher",
    "González, Carolina",
  ]);

  // Function to add a new patient to the list
  const handleAddPatient = (fullName: string) => {
    setPatientList((prev) => [...prev, fullName]);
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <div className="d-md-none position-fixed top-0 start-0 p-2 z-3">
        <button
          className="icon-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <i className="bi bi-list nav-icon"></i>
        </button>
      </div>

      {/* Mobile sidebar menu */}
      <Collapse in={mobileMenuOpen} dimension="height">
        <div className="bg-navy-custom d-md-none p-3 shadow-sm position-absolute w-100 z-2 text-white">
          <h5 className="fw-bold mb-3 text-center">ContourCT</h5>
          <Form.Control
            type="search"
            placeholder={t("search_placeholder")}
            className="mb-4 search-bar"
          />

          <Nav className="flex-column">
            {/* Home nav item (mobile) */}
            <div className="nav-item-custom d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-house nav-icon"></i>
              <span className="nav-text">{t("home")}</span>
            </div>

            {/* Patients nav + add button (mobile) */}
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div
                className="nav-item-custom d-flex align-items-center gap-2 fw-semibold"
                onClick={() => setPatientsOpen(!patientsOpen)}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-person-lines-fill nav-icon"></i>
                <span className="nav-text">{t("patients")}</span>
              </div>
              <button
                className="icon-button d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px" }}
                onClick={() => setShowAddModal(true)}
              >
                <i className="bi bi-plus-square nav-icon"></i>
              </button>
            </div>

            {/* List of patients (mobile) */}
            <Collapse in={patientsOpen}>
              <div className="ps-4">
                {patientList.map((name, index) => (
                  <NavLink
                    to={`/patient/${name.split(",")[1].trim()}`}
                    key={index}
                    className={({ isActive }) =>
                      [
                        "nav-item-custom d-flex align-items-center gap-2 text-start",
                        isActive && "active-nav",
                      ]
                        .filter(Boolean)
                        .join(" ")
                    }
                  >
                    <i className="bi bi-person-circle nav-icon"></i>
                    <span className="nav-text">{name}</span>
                  </NavLink>
                ))}
              </div>
            </Collapse>
          </Nav>
        </div>
      </Collapse>

      {/* Desktop Sidebar */}
      <div
        className={`sidebar d-none d-md-flex border-end flex-column ${
          visible ? "bg-navy-custom p-3" : "collapsed bg-navy-custom py-3"
        }`}
        style={{
          alignItems: visible ? "stretch" : "center",
          width: visible ? "240px" : "56px",
          color: "white",
          minHeight: "100vh",
        }}
      >
        {/* Logo and toggle button */}
        <div className="d-flex align-items-center mb-3 w-100 gap-2">
          <button
            className="icon-button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("toggle-sidebar"))
            }
          >
            <i className="bi bi-list nav-icon"></i>
          </button>
          {visible && <h5 className="fw-bold mb-0 text-white">ContourCT</h5>}
        </div>

        {/* Search bar (desktop only when visible) */}
        {visible && (
          <Form.Control
            type="search"
            placeholder={t("search_placeholder")}
            className="mb-4 search-bar"
          />
        )}

        {/* Navigation links */}
        <Nav className="flex-column w-100">
          {/* Home nav link (desktop) with tooltip */}
          <OverlayTrigger
            placement="right"
            overlay={<Tooltip id="home-tooltip">{t("home")}</Tooltip>}
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                [
                  "nav-item-custom mb-2 d-flex align-items-center",
                  visible ? "ps-3 justify-content-start" : "justify-content-center",
                  isActive && "active-nav",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              <i className="bi bi-house nav-icon me-2" />
              {visible && <span className="nav-text">{t("home")}</span>}
            </NavLink>
          </OverlayTrigger>

          {/* Patients title + buttons */}
          <div
            className={`nav-item-custom fw-semibold mb-2 d-flex align-items-center ${
              visible ? "ps-3 justify-content-start" : "justify-content-center"
            }`}
          >
            <i className="bi bi-person-lines-fill nav-icon me-2"></i>
            {visible && <span className="nav-text">{t("patients")}</span>}

            {/* Add/collapse buttons only shown when visible */}
            {visible && (
              <div className="ms-auto d-flex align-items-center gap-2 pe-2">
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip id="add-patient-tooltip">{t("add_patient")}</Tooltip>}
                >
                  <button
                    className="icon-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddModal(true);
                    }}
                  >
                    <i className="bi bi-plus-square nav-icon"></i>
                  </button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id="toggle-patient-list-tooltip">
                      {patientsOpen ? t("collapse") : t("expand")}
                    </Tooltip>
                  }
                >
                  <button
                    className="icon-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPatientsOpen(!patientsOpen);
                    }}
                  >
                    <i
                      className={`bi ${
                        patientsOpen ? "bi-caret-up" : "bi-caret-down"
                      }`}
                    ></i>
                  </button>
                </OverlayTrigger>
              </div>
            )}
          </div>

          {/* Patient links (desktop) */}
          <Collapse in={patientsOpen && visible}>
            <div className="w-100">
              {patientList.map((name, index) => (
                <NavLink
                  to={`/patient/${name.split(",")[1].trim()}`}
                  key={index}
                  className={({ isActive }) =>
                    [
                      "nav-item-custom ps-4 d-flex align-items-center gap-2 text-start",
                      isActive && "active-nav",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                >
                  <i className="bi bi-person-circle nav-icon"></i>
                  {visible && <span className="nav-text">{name}</span>}
                </NavLink>
              ))}
            </div>
          </Collapse>
        </Nav>

        {/* Modal for adding new patient */}
        <AddPatientModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddPatient={handleAddPatient}
        />
      </div>
    </>
  );
};

export default Sidebar;
