import DashboardCard from "../../components/DashboardCard.jsx";
import scheduleImage from "./../../images/emploie.png";
import absenceImage from "./../../images/absence.jpg";
import "./../../index.css";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">Tableau de Bord</h1>

      <div className="cards-grid">
        <DashboardCard
          title="Emploi du Temps"
          subtitle="Visualiser votre emploi du temps personnel"
          path="/emploi-du-temps"
          image={scheduleImage}
        />

        <DashboardCard
          title="Gestion des Absences"
          subtitle="Gestion des absences des stagiaires"
          path="/gerer-absence"
          image={absenceImage}
        />
      </div>
    </div>
  );
};

export default Dashboard;
