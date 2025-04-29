import DashboardCard from "../../components/DashboardCard.jsx";
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
          iconBgColor="#3498db"
        />

        <DashboardCard
          title="Gestion des Absences"
          subtitle="Gestion des absences des stagiaires"
          path="/gerer-absence"
          iconBgColor="#e74c3c"
        />
      </div>
    </div>
  );
};

export default Dashboard;
