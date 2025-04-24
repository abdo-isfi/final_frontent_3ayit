import React, { useState, useEffect } from "react";
import "./../../index.css";
import { useNavigate } from "react-router-dom";

const SchedulePage = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the current user and schedule
  useEffect(() => {
    // Get current user
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setCurrentUser(user);
        
        // Get the teacher's schedule
        const schedulesJson = localStorage.getItem('teacherSchedules') || '{}';
        const schedules = JSON.parse(schedulesJson);
        
        // First check if we can find the schedule by ID
        if (user.id && schedules[user.id]) {
          setSchedule(schedules[user.id]);
        } else {
          // If not, check if the user's email matches a formateur
          const formateursJson = localStorage.getItem('formateurs') || '[]';
          const formateurs = JSON.parse(formateursJson);
          
          // Find the formateur by email
          const formateur = formateurs.find(f => f.email === user.email);
          if (formateur && formateur.id && schedules[formateur.id]) {
            setSchedule(schedules[formateur.id]);
          }
        }
      } catch (e) {
        console.error('Error loading user or schedule:', e);
      }
    }
    setLoading(false);
  }, []);

  const handleBack = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="schedule-page">
        <h1 className="schedule-title">Emploi du Temps</h1>
        <div className="loading-message">Chargement de l'emploi du temps...</div>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      <h1 className="schedule-title">Emploi du Temps</h1>
      <button className="back-button" onClick={handleBack}>
        ⬅ Retour
      </button>
      
      {schedule ? (
        <div className="uploaded-schedule-container">
          <div className="uploaded-schedule-wrapper">
            {schedule.startsWith('data:application/pdf') ? (
              <iframe 
                src={schedule} 
                title="Emploi du Temps" 
                className="uploaded-schedule-pdf" 
                width="100%" 
                style={{ height: '80vh', minHeight: '700px' }}
              />
            ) : (
              <img 
                src={schedule} 
                alt="Emploi du Temps" 
                className="uploaded-schedule-image" 
              />
            )}
          </div>
        </div>
      ) : (
        <div className="no-schedule-message">
          <p>Aucun emploi du temps n'a été téléchargé par l'administration.</p>
          <p>Veuillez contacter l'administrateur pour obtenir votre emploi du temps.</p>
        </div>
      )}
      
      <style jsx>{`
        .schedule-page {
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .schedule-title {
          font-size: 24px;
          color: #333;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .back-button {
          background-color: #f0f0f0;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          font-size: 14px;
        }
        
        .uploaded-schedule-container {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .uploaded-schedule-wrapper {
          display: flex;
          justify-content: center;
          margin: 0 auto;
          max-width: 100%;
          overflow: hidden;
        }
        
        .uploaded-schedule-image,
        .uploaded-schedule-pdf {
          max-width: 100%;
          height: auto;
          object-fit: contain;
        }
        
        .uploaded-schedule-pdf {
          max-width: 100%;
          width: 100%;
          border: none;
          display: block;
          background-color: white;
        }
        
        .schedule-table-container {
          margin-top: 20px;
          overflow-x: auto;
        }
        
        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .schedule-table th {
          background-color: #4CAF50;
          color: white;
          padding: 15px;
          text-align: left;
        }
        
        .schedule-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #eee;
        }
        
        .schedule-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .loading-message,
        .no-schedule-message {
          text-align: center;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
          margin: 20px 0;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default SchedulePage;
