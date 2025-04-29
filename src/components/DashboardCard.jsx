import React from "react";
import {  useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "../index.css";
import { Modal } from "react-bootstrap";

const DashboardCard = ({ title, subtitle, path, iconClass = "fas fa-tasks", iconBgColor = "#3498db", showButton = true }) => {
  const navigate = useNavigate();
  
  // Determine appropriate icon based on title
  const getIconClass = () => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes("stagiaire") || titleLower.includes("stagiaires")) {
      return "fas fa-user-graduate";
    } else if (titleLower.includes("formateur") || titleLower.includes("formateurs")) {
      return "fas fa-chalkboard-teacher";
    } else if (titleLower.includes("absence") || titleLower.includes("absences")) {
      return "fas fa-calendar-times";
    } else if (titleLower.includes("emploi") || titleLower.includes("temps")) {
      return "fas fa-calendar-alt";
    } else if (titleLower.includes("tableau") || titleLower.includes("bord") || titleLower.includes("statistique")) {
      return "fas fa-chart-line";
    } else {
      return iconClass; // Default icon
    }
  };
  
  return (
    <div className="dashboard-card">
      <div className="card-icon-container" style={{ backgroundColor: iconBgColor }}>
        <i className={getIconClass()}></i>
      </div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-subtitle">{subtitle}</p>
        {showButton && (
          <button 
            className="card-button"
            onClick={() => navigate(path)}
            aria-label={`Go to ${title}`}
          >
            Accéder
          </button>
        )}
      </div>

      <style jsx>{`
        .dashboard-card {
          background-color: var(--white);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
          transition: var(--transition-normal);
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .dashboard-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }
        
        .card-icon-container {
          height: 160px;
          position: relative;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
        }
        
        .card-icon-container i {
          font-size: 4rem;
          transition: transform 0.3s ease;
        }
        
        .dashboard-card:hover .card-icon-container i {
          transform: scale(1.1);
        }
        
        .card-content {
          padding: var(--space-5);
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        
        .card-title {
          font-size: var(--font-size-xl);
          margin: 0 0 var(--space-2) 0;
          color: var(--primary-dark);
          font-weight: 600;
        }
        
        .card-subtitle {
          color: var(--gray-600);
          margin: 0 0 var(--space-5) 0;
          font-size: var(--font-size-md);
          line-height: 1.5;
        }
        
        .card-button {
          background-color: var(--primary);
          color: white;
          text-decoration: none;
          border: none;
          padding: var(--space-3) var(--space-5);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-weight: 500;
          margin-top: auto;
          text-align: center;
          transition: var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }
        
        .card-button:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </div>
  );
};

DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  iconClass: PropTypes.string,
  iconBgColor: PropTypes.string,
  showButton: PropTypes.bool
};

export default DashboardCard;