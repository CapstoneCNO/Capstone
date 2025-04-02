import { Modal, Form, Button } from "react-bootstrap";
import { useState } from "react";


interface Props {
  show: boolean;
  onClose: () => void;
  onAddPatient: (fullName: string) => void;
}

const AddPatientModal: React.FC<Props> = ({ show, onClose, onAddPatient }) => {
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
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="text-primary">Register Patient</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Register</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddPatientModal;
