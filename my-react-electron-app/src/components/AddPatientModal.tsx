import { Modal, Form, Button } from "react-bootstrap";
import { useState } from "react";
import { useLanguage } from "../hooks/LanguageContext"; // Adjust path if needed

interface Props {
  show: boolean;
  onClose: () => void;
  onAddPatient: (fullName: string) => void;
}

const AddPatientModal: React.FC<Props> = ({ show, onClose, onAddPatient }) => {
  const { t } = useLanguage(); // Translation function
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const handleSubmit = () => {
    if (!firstName || !lastName) return;
    onAddPatient(`${lastName}, ${firstName}`);
    setFirstName("");
    setLastName("");
    onClose();
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop="static"
      dialogClassName="custom-modal"
    >
      <Modal.Header closeButton className="bg-navy text-white">
        <Modal.Title>{t("register_patient")}</Modal.Title>
      </Modal.Header>

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
