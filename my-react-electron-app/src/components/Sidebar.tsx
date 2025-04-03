import { useState } from "react";
import {
  Nav,
  Form,
  OverlayTrigger,
  Tooltip,
  Collapse,
} from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../hooks/LanguageContext";
import AddPatientModal from "./AddPatientModal";
import "../index.css";

const Sidebar = ({ visible }: { visible: boolean }) => {
  const { t } = useLanguage();
  const [patientsOpen, setPatientsOpen] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [patientList, setPatientList] = useState<string[]>([
    "Beaulieu, Nick",
    "Oudououha, Omar",
    "Sun, Christopher",
    "González, Carolina",
  ]);

  const handleAddPatient = (fullName: string) => {
    setPatientList((prev) => [...prev, fullName]);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <div className="d-md-none position-fixed top-0 start-0 p-2 z-3">
        <button
          className="icon-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <i className="bi bi-list nav-icon"></i>
        </button>
      </div>

      {/* Mobile menu */}
      <Collapse in={mobileMenuOpen} dimension="height">
        <div className="bg-navy-custom d-md-none p-3 shadow-sm position-absolute w-100 z-2 text-white">
          <h5 className="fw-bold mb-3 text-center">ContourCT</h5>
          <Form.Control
            type="search"
            placeholder={t("search_placeholder")}
            className="mb-4 search-bar"
          />

          <Nav className="flex-column">
            <div className="nav-item-custom d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-house nav-icon"></i>
              <span className="nav-text">{t("home")}</span>
            </div>

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

            <Collapse in={patientsOpen}>
              <div className="ps-4">
                {patientList.map((name, index) => (
                  <NavLink
                    to={`/patient/${name.split(",")[1].trim()}`}
                    key={index}
                    className={({ isActive }) =>
                      [
                        "nav-item-custom d-flex align-items-center gap-2 text-start",
                        isActive && "active-nav"
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
        <div className="d-flex justify-content-between align-items-center mb-3 w-100">
          {visible && (
            <h5 className="fw-bold mb-0 w-100 text-center">ContourCT</h5>
          )}
          <button
            className="icon-button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("toggle-sidebar"))
            }
          >
            <i className="bi bi-list nav-icon"></i>
          </button>
        </div>

        {visible && (
          <Form.Control
            type="search"
            placeholder={t("search_placeholder")}
            className="mb-4 search-bar"
          />
        )}

        <Nav className="flex-column w-100">
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
                  isActive && "active-nav"
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              <i className="bi bi-house nav-icon me-2" />
              {visible && <span className="nav-text">{t("home")}</span>}
            </NavLink>
          </OverlayTrigger>

          <div
            className={`nav-item-custom fw-semibold mb-2 d-flex align-items-center ${
              visible ? "ps-3 justify-content-start" : "justify-content-center"
            }`}
          >
            <i className="bi bi-person-lines-fill nav-icon me-2"></i>
            {visible && <span className="nav-text">{t("patients")}</span>}
            {visible && (
              <div className="ms-auto d-flex align-items-center gap-2 pe-2">
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip id="add-patient-tooltip">{t("add_patient")}</Tooltip>
                  }
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

          <Collapse in={patientsOpen && visible}>
            <div className="w-100">
              {patientList.map((name, index) => (
                <NavLink
                  to={`/patient/${name.split(",")[1].trim()}`}
                  key={index}
                  className={({ isActive }) =>
                    [
                      "nav-item-custom ps-4 d-flex align-items-center gap-2 text-start",
                      isActive && "active-nav"
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
