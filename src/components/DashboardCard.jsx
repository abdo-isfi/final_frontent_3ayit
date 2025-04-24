import React from "react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "../index.css";

const DashboardCard = ({ title, subtitle, path, image, showButton = true }) => {
  const navigate = useNavigate();
  
  return (
    <div className="dashboard-card">
      <div className="card-image-container">
        <div
          className="card-image"
          style={{ backgroundImage: `url(${image})` }}
        />
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
        
        .card-image-container {
          height: 200px;
          position: relative;
          overflow: hidden;
        }
        
        .card-image {
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          transition: transform 0.5s ease;
          position: relative;
        }
        
        .card-image::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.1) 0%,
            rgba(0, 0, 0, 0.3) 100%
          );
        }
        
        .dashboard-card:hover .card-image {
          transform: scale(1.05);
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
  image: PropTypes.string.isRequired,
  showButton: PropTypes.bool
};

export default DashboardCard;