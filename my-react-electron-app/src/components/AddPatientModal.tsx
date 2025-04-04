// React Bootstrap components for layout/styling
import { Modal, Form, Button } from "react-bootstrap";
// useState hook to manage form state
import { useState } from "react";
// Import translation hook
import { useLanguage } from "../hooks/LanguageContext";

// Props expected by this component
interface Props {
  show: boolean;                    // Whether the modal is visible
  onClose: () => void;             // Function to close the modal
  onAddPatient: (fullName: string) => void; // Function to add a new patient
}

// Functional component for adding a patient via modal form
const AddPatientModal: React.FC<Props> = ({ show, onClose, onAddPatient }) => {
  const { t } = useLanguage(); // Access translation function
  const [firstName, setFirstName] = useState(""); // Local state for first name
  const [lastName, setLastName] = useState("");   // Local state for last name

  // Handles form submission
  const handleSubmit = () => {
    if (!firstName || !lastName) return; // Prevent submission if fields are empty
    onAddPatient(`${lastName}, ${firstName}`);    // Pass formatted full name to parent
    setFirstName(""); // Clear form after submission
    setLastName("");
    onClose();         // Close modal
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop="static"
      dialogClassName="custom-modal" // Optional custom styling
    >
      {/* Modal header */}
      <Modal.Header closeButton className="bg-navy text-white">
        <Modal.Title>{t("register_patient")}</Modal.Title>
      </Modal.Header>

      {/* Modal body containing the form */}
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>{t("first_name")}</Form.Label>
            <Form.Control
              type="text"
              placeholder={t("enter_first_name")}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{t("last_name")}</Form.Label>
            <Form.Control
              type="text"
              placeholder={t("enter_last_name")}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      {/* Modal footer with action buttons */}
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          {t("register")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddPatientModal;
