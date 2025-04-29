import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  // Inline styles for the components
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      textAlign: 'center',
    },
    title: {
      color: '#333',
      fontSize: '2rem',
      margin: '0 auto',
    },
    dashboardGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '3rem',
      marginTop: '2rem',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0 2rem',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
      overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      cursor: 'pointer',
      maxWidth: '400px',
      margin: '0 auto',
    },
    cardHover: {
      transform: 'translateY(-5px)',
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.08)',
    },
    cardTop: {
      padding: '1.5rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardIcon: {
      color: 'white',
      fontSize: '3rem',
    },
    cardContent: {
      padding: '1.5rem',
    },
    cardTitle: {
      color: '#333',
      fontSize: '1.5rem',
      marginBottom: '0.5rem',
      fontWeight: 'bold',
    },
    cardDescription: {
      color: '#666',
      marginBottom: '1.5rem',
    },
    cardButton: {
      display: 'inline-block',
      backgroundColor: '#3498db',
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '4px',
      textDecoration: 'none',
      fontWeight: 'bold',
      transition: 'background-color 0.3s ease',
    },
    cardButtonHover: {
      backgroundColor: '#2980b9',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Tableau de bord Admin</h1>
      </div>
      
      <div style={styles.dashboardGrid}>
        {/* Gérer les utilisateurs */}
        <div style={styles.card} className="dashboard-card">
          <div style={{...styles.cardTop, backgroundColor: '#3498db'}}>
            <span style={styles.cardIcon}>👤</span>
          </div>
          <div style={styles.cardContent}>
            <h2 style={styles.cardTitle}>Gérer les utilisateurs</h2>
            <p style={styles.cardDescription}>
              Ajouter, modifier ou supprimer des utilisateurs du système.
            </p>
            <Link to="/admin/gerer" style={styles.cardButton} className="card-button">
              Gérer
            </Link>
          </div>
        </div>

        {/* Gérer les formateurs */}
        <div style={styles.card} className="dashboard-card">
          <div style={{...styles.cardTop, backgroundColor: '#2ecc71'}}>
            <span style={styles.cardIcon}>🧑‍🏫</span>
          </div>
          <div style={styles.cardContent}>
            <h2 style={styles.cardTitle}>Gérer les formateurs</h2>
            <p style={styles.cardDescription}>
              Ajouter, modifier ou supprimer des formateurs. Assignez des groupes aux formateurs.
            </p>
            <Link to="/admin/ajouter" style={styles.cardButton} className="card-button">
              Gérer
            </Link>
          </div>
        </div>

    
        
      </div>
    </div>
  );
};

export default AdminDashboard;
