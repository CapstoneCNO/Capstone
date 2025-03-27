import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useLanguage } from "../hooks/LanguageContext";

const PatientPage = () => {
  const { id } = useParams();
  const { t } = useLanguage();

  return (
    <Layout>
      <h2>🧑‍⚕️ {t("patient_page_title")}: {id}</h2>
      <p>{t("welcome")}</p>
    </Layout>
  );
};

export default PatientPage;
