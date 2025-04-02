import { useState } from "react";
import { Nav, Form, Button, OverlayTrigger, Tooltip, Collapse } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useLanguage } from "../hooks/LanguageContext";
import "../index.css";

const Sidebar = ({ visible }: { visible: boolean }) => {
  const { t } = useLanguage();
  const [patientsOpen, setPatientsOpen] = useState(true);
  const patientList = [
    "Beaulieu, Nick",
    "Oudououha, Omar",
    "Sun, Christopher",
    "González, Carolina",
  ];

  return (
    <div
      className={`sidebar border-end d-flex flex-column p-3 ${visible ? "bg-white" : "collapsed bg-light"}`}
      style={{ alignItems: visible ? "stretch" : "center" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3 w-100">
        {visible && <h5 className="fw-bold mb-0">ContourCT</h5>}
        <Button
          variant="light"
          size="sm"
          className="hamburger-btn"
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-sidebar"))}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            className="bi bi-list"
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
            />
          </svg>
        </Button>
      </div>

      {visible && (
        <>
          <span className="text-muted small mb-2"></span>
          <Form.Control
            type="search"
            placeholder={t("search_placeholder")}
            className="mb-4 search-bar"
          />
        </>
      )}

      <Nav className="flex-column w-100">
        <OverlayTrigger
          placement="right"
          overlay={<Tooltip id="home-tooltip">{t("home")}</Tooltip>}
        >
          <Nav.Link as={Link} to="/" className="d-flex align-items-center mb-3 text-start ps-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-house" viewBox="0 0 16 16">
              <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z" />
            </svg>
            {visible && <span className="ms-2">{t("home")}</span>}
          </Nav.Link>
        </OverlayTrigger>

        <OverlayTrigger
          placement="right"
          overlay={<Tooltip id="patients-tooltip">{t("patients")}</Tooltip>}
        >
          <div
            className="text-secondary fw-semibold mb-2 d-flex align-items-center justify-content-between pe-1 text-start ps-1"
            onClick={() => setPatientsOpen(!patientsOpen)}
            style={{ cursor: "pointer" }}
          >
            <span className="d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person-lines-fill" viewBox="0 0 16 16">
                <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1z" />
              </svg>
              {visible && <span className="ms-2">{t("patients")}</span>}
            </span>
            {visible && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-caret-down"
                viewBox="0 0 16 16"
              >
                <path d="M3.204 5h9.592L8 10.481zm-.753.659 4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659" />
              </svg>
            )}
          </div>
        </OverlayTrigger>

        <Collapse in={patientsOpen && visible}>
          <div>
            {patientList.map((name, index) => (
              <Nav.Link
                as={Link}
                to={`/patient/${name.split(",")[1].trim()}`}
                key={index}
                className="ps-4 text-muted text-start"
              >
                {name}
              </Nav.Link>
            ))}
          </div>
        </Collapse>
      </Nav>
    </div>
  );
};

export default Sidebar;