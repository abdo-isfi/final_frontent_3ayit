import React from 'react';
import DashboardCard from '../../components/DashboardCard.jsx';
import traineesImage from '../../images/trainees.jpeg';
import trainersImage from '../../images/trainers.jpeg'; 
import '../../index.css';

const SGDashboard = () => {
  return (
    <div className="sg-dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Bienvenue, Surveillant Général</h1>
          <p className="dashboard-subtitle">Sélectionnez une option à gérer</p>
        </div>
        
        <div className="cards-grid">
          <DashboardCard
            title="Gérer Stagiaires"
            subtitle="Accéder à la gestion des stagiaires"
            path="/sg/gerer-stagiaires"
            image={traineesImage}
          />
          
          <DashboardCard
            title="Formateurs"
            subtitle="Gérer les formateurs"
            path="/sg/gerer-formateurs"
            image={trainersImage}
          />
          
          <DashboardCard
            title="Tableau de Bord"
            subtitle="Statistiques et aperçu global"
            path="/sg/dashboard"
            image={trainersImage}
          />
          
          <DashboardCard
            title="Gestion des Absences"
            subtitle="Suivre et gérer les absences"
            path="/sg/absence"
            image={traineesImage}
          />
        </div>
      </div>

      <style jsx>{`
        .sg-dashboard {
          min-height: calc(100vh - 90px);
          padding: var(--space-6) var(--space-4);
          background-color: var(--gray-100);
          display: flex;
          flex-direction: column;
        }
        
        .dashboard-container {
          max-width: 1300px;
          width: 100%;
          margin: 0 auto;
        }
        
        .dashboard-header {
          text-align: center;
          margin-bottom: var(--space-8);
        }
        
        .dashboard-title {
          font-size: var(--font-size-3xl);
          color: var(--primary-dark);
          margin-bottom: var(--space-2);
          font-weight: 700;
        }
        
        .dashboard-subtitle {
          font-size: var(--font-size-lg);
          color: var(--gray-600);
          margin-bottom: var(--space-6);
        }
        
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: var(--space-6);
        }
        
        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }
          
          .dashboard-title {
            font-size: var(--font-size-2xl);
          }
          
          .dashboard-subtitle {
            font-size: var(--font-size-md);
          }
        }
      `}</style>
    </div>
  );
};

export default SGDashboard;
