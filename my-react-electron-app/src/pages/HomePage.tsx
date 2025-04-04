import { useLanguage } from "../hooks/LanguageContext";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import patient1 from "../assets/images/Patients.jpg";
import patient2 from "../assets/images/Patients.jpg";
import patient3 from "../assets/images/Patients.jpg";
import machine from "../assets/images/CT_SCAN.jpg";
import "../index.css";

const HomePage = () => {
  const { t } = useLanguage();

  const services = [
    { key: "ct_scan", image: patient1 },
    { key: "mri", image: patient2 },
    { key: "radiation", image: patient3 },
  ];

  return (
    <>
      {/* Welcome Section */}
      <section style={{ backgroundColor: "#f8fafd" }} className="py-5 px-4">
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h2 className="fw-bold mb-3">{t("welcome_heading") ?? "Welcome John!"}</h2>
              <p>{t("welcome_subtext") ?? "Lorem ipsum lorem lorem lorem"}</p>
              <Button variant="primary" className="get-started-button">
                {t("get_started") ?? "Get started"}
              </Button>
            </Col>
            <Col md={4}>
              <img src={machine} alt="CT Machine" className="img-fluid rounded" />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Service Cards Section */}
      <section style={{ backgroundColor: "#fff" }} className="py-5 px-4">
        <Container>
          <h3 className="fw-bold text-center mb-4">{t("patients")}</h3>
          <Row className="justify-content-center g-4">
            {services.map((service, idx) => (
              <Col key={idx} xs={12} sm={6} md={4} lg={3}>
                <Card className="patient-card border-0 h-100 text-center">
                  <Card.Img
                    variant="top"
                    src={service.image}
                    alt={t('services.${service.key}')}
                    className="rounded"
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "250px",
                    }}
                  />
                  <Card.Body>
                    <Card.Title className="fw-semibold">
                      {t(`services.${service.key}`)}
                    </Card.Title>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
    </>
  );
};

export default HomePage;
