import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../../index.css';

const TraineeDetailsPage = () => {
  const [trainee, setTrainee] = useState(null);
  const [absenceHistory, setAbsenceHistory] = useState([]);
  const [absenceCalendar, setAbsenceCalendar] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { cef } = useParams();

  useEffect(() => {
    // Load trainee data from localStorage
    const loadTraineeData = () => {
      try {
        const traineeData = JSON.parse(localStorage.getItem('selectedTraineeDetails'));
        const history = JSON.parse(localStorage.getItem('traineeAbsenceHistory')) || [];
        const calendar = JSON.parse(localStorage.getItem('traineeAbsenceCalendar')) || {};
        
        // If no data in localStorage, try to find trainee by CEF
        if (!traineeData) {
          const traineesData = JSON.parse(localStorage.getItem('traineesData')) || [];
          const found = traineesData.find(t => (t.cef === cef || t.CEF === cef));
          
          if (found) {
            setTrainee(found);
            
            // Get absences for this trainee
            const studentAbsences = JSON.parse(localStorage.getItem('studentAbsences')) || {};
            const traineeCef = found.cef || found.CEF;
            const foundAbsences = studentAbsences[traineeCef] || [];
            
            setAbsenceHistory(foundAbsences);
            setAbsenceCalendar(generateAbsenceCalendar(foundAbsences));
          } else {
            // No trainee found
            console.error('Trainee not found');
          }
        } else {
          setTrainee(traineeData);
          setAbsenceHistory(history);
          setAbsenceCalendar(calendar);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading trainee data:', error);
        setLoading(false);
      }
    };
    
    loadTraineeData();
  }, [cef]);

  const handleBack = () => {
    navigate("/sg/absence");
  };

  // Function to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };
  
  // Generate absence calendar from absences
  const generateAbsenceCalendar = (absences) => {
    if (!absences || absences.length === 0) return {};
    
    const absencesByMonth = {};
    
    absences.forEach(absence => {
      if (!absence.date) return;
      
      const date = new Date(absence.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // Month is 0-indexed
      const day = date.getDate();
      
      const monthKey = `${year}-${month}`;
      
      if (!absencesByMonth[monthKey]) {
        absencesByMonth[monthKey] = [];
      }
      
      absencesByMonth[monthKey].push({
        day,
        status: absence.status,
        date: absence.date
      });
    });
    
    return absencesByMonth;
  };

  // Calculate count of absences by type
  const calculateAbsenceCounts = (absences) => {
    if (!absences || absences.length === 0) return { absent: 0, late: 0, total: 0 };
    
    const absent = absences.filter(a => a.status === 'absent').length;
    const late = absences.filter(a => a.status === 'late').length;
    
    return {
      absent,
      late,
      total: absent + late
    };
  };
  
  // Calculate total absence hours
  const calculateAbsenceHours = (absences) => {
    if (!absences || absences.length === 0) return 0;
    
    let totalHours = 0;
    
    absences.forEach(absence => {
      if (absence.status === 'absent') {
        // Full day absence is typically 8 hours
        if (!absence.startTime || !absence.endTime) {
          totalHours += 8;
        } else {
          // Calculate hours based on time range
          const start = absence.startTime.split(':').map(Number);
          const end = absence.endTime.split(':').map(Number);
          
          if (start.length >= 2 && end.length >= 2) {
            const startHour = start[0] + start[1] / 60;
            const endHour = end[0] + end[1] / 60;
            totalHours += (endHour - startHour);
          }
        }
      } else if (absence.status === 'late') {
        // Late arrivals typically count as 1 hour
        totalHours += 1;
      }
    });
    
    return Math.round(totalHours * 10) / 10; // Round to 1 decimal place
  };
  
  // Calculate disciplinary note based on absences and lateness
  const calculateDisciplinaryNote = (absences) => {
    if (!absences || absences.length === 0) return 20; // Start with 20 points
    
    // Count total absence hours
    const absenceHours = calculateAbsenceHours(
      absences.filter(a => a.status === 'absent')
    );
    
    // Count late arrivals
    const lateArrivals = absences.filter(a => a.status === 'late').length;
    
    // Calculate deductions
    // -0.5 points per 2.5 hours of absence
    const absenceDeduction = Math.floor(absenceHours / 2.5) * 0.5;
    
    // -1 point per 4 late arrivals
    const latenessDeduction = Math.floor(lateArrivals / 4) * 1;
    
    // Calculate final score (minimum 0)
    const finalNote = Math.max(0, 20 - absenceDeduction - latenessDeduction);
    
    // Round to 1 decimal place
    return Math.round(finalNote * 10) / 10;
  };
  
  // Get absence statistics
  const absenceCounts = calculateAbsenceCounts(absenceHistory);
  const absenceHours = calculateAbsenceHours(absenceHistory);
  const disciplinaryNote = calculateDisciplinaryNote(absenceHistory);

  if (loading) {
    return <div className="loading">Chargement des détails du stagiaire...</div>;
  }

  if (!trainee) {
    return (
      <div className="trainee-not-found">
        <h2>Stagiaire non trouvé</h2>
        <p>Les informations du stagiaire ne sont pas disponibles.</p>
        <button className="back-button" onClick={handleBack}>Retour</button>
      </div>
    );
  }

  return (
    <div className="trainee-details-page">
      <div className="page-header">
        <button className="back-button" onClick={handleBack}>⬅ Retour</button>
        <h1 className="page-title">Détails du Stagiaire</h1>
      </div>

      <div className="trainee-details-container">
        <div className="trainee-details">
          <div className="detail-row">
            <div className="detail-item">
              <strong>CEF:</strong> {trainee.cef || trainee.CEF}
            </div>
            <div className="detail-item">
              <strong>Groupe:</strong> {trainee.class || trainee.GROUPE}
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-item">
              <strong>Nom:</strong> {trainee.name || trainee.NOM}
            </div>
            <div className="detail-item">
              <strong>Prénom:</strong> {trainee.first_name || trainee.PRENOM}
            </div>
          </div>
          
          {/* Additional details if available */}
          {trainee.birth_date && (
            <div className="detail-row">
              <div className="detail-item">
                <strong>Date de naissance:</strong> {formatDate(trainee.birth_date)}
              </div>
            </div>
          )}
          
          {/* Absence Statistics */}
          <div className="absence-stats">
            <h3>Statistiques d'absences</h3>
            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-value">{absenceCounts.absent}</div>
                <div className="stat-label">Absences</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{absenceCounts.late}</div>
                <div className="stat-label">Retards</div>
              </div>
            </div>
            
            <div className="stats-row additional-stats">
              <div className="stat-item">
                <div className="stat-value">{absenceHours}</div>
                <div className="stat-label">Heures d'Absence</div>
              </div>
              <div className="stat-item">
                <div className={`stat-value ${disciplinaryNote < 10 ? 'warning' : ''}`}>
                  {disciplinaryNote}/20
                </div>
                <div className="stat-label">Note de Discipline</div>
              </div>
            </div>
          </div>
          
          {/* Absence Calendar View */}
          {absenceCalendar && Object.keys(absenceCalendar).length > 0 && (
            <div className="absence-calendar">
              <h3>Calendrier d'absences</h3>
              <div className="calendar-container">
                {Object.entries(absenceCalendar).map(([monthKey, daysWithAbsences]) => {
                  const [year, month] = monthKey.split('-').map(n => parseInt(n, 10));
                  const monthName = new Date(year, month - 1, 1).toLocaleDateString('fr-FR', { month: 'long' });
                  
                  // Create an array of days with absences for easier rendering
                  const absentDays = daysWithAbsences.map(d => d.day);
                  
                  // Get the number of days in this month
                  const daysInMonth = new Date(year, month, 0).getDate();
                  
                  // Get the day of the week the month starts on (0 = Sunday, 1 = Monday, etc.)
                  const firstDay = new Date(year, month - 1, 1).getDay();
                  // Adjust for Monday as first day of week (European style)
                  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
                  
                  // Generate calendar days
                  const days = [];
                  
                  // Add empty cells for days before the 1st of the month
                  for (let i = 0; i < adjustedFirstDay; i++) {
                    days.push(null);
                  }
                  
                  // Add days of the month
                  for (let i = 1; i <= daysInMonth; i++) {
                    days.push(i);
                  }
                  
                  return (
                    <div key={monthKey} className="month-calendar">
                      <h4 className="month-name">{monthName} {year}</h4>
                      <div className="week-days">
                        <div className="week-day">Lu</div>
                        <div className="week-day">Ma</div>
                        <div className="week-day">Me</div>
                        <div className="week-day">Je</div>
                        <div className="week-day">Ve</div>
                        <div className="week-day">Sa</div>
                        <div className="week-day">Di</div>
                      </div>
                      <div className="days-grid">
                        {days.map((day, index) => (
                          <div 
                            key={index} 
                            className={`day-cell ${!day ? 'empty' : ''} ${absentDays.includes(day) ? 'absent' : ''}`}
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Absences History Section */}
          <div className="absences-section">
            <h3>Historique des Absences</h3>
            
            {absenceHistory.length > 0 ? (
              <div className="absences-table-container">
                <table className="absences-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Heure</th>
                      <th>Statut</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absenceHistory.map((absence, index) => (
                      <tr key={index} className={`status-${absence.status}`}>
                        <td>{formatDate(absence.date)}</td>
                        <td>{absence.startTime ? `${absence.startTime} - ${absence.endTime}` : 'Journée'}</td>
                        <td>
                          <span className={`status-badge ${absence.status}`}>
                            {absence.status === 'absent' && 'Absent'}
                            {absence.status === 'late' && 'Retard'}
                            {absence.status === 'present' && 'Présent'}
                          </span>
                        </td>
                        <td>{absence.fromExcel ? 'Import Excel' : (absence.teacher || 'Non spécifié')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-absences-message">
                <p>Aucune absence enregistrée pour ce stagiaire.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .trainee-details-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .page-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .back-button {
          background-color: #f0f0f0;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          font-size: 14px;
          margin-right: 15px;
        }
        
        .page-title {
          font-size: 24px;
          color: #333;
          margin: 0;
        }
        
        .trainee-details-container {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .detail-row {
          display: flex;
          margin-bottom: 15px;
          gap: 20px;
        }
        
        .detail-item {
          flex: 1;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 4px;
        }
        
        .detail-item strong {
          font-weight: 600;
          color: #555;
        }
        
        .absence-stats {
          margin-top: 30px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        
        .absence-stats h3 {
          margin-top: 0;
          color: #333;
          font-size: 18px;
          margin-bottom: 15px;
        }
        
        .stats-row {
          display: flex;
          gap: 20px;
        }
        
        .stat-item {
          flex: 1;
          text-align: center;
          padding: 15px;
          background-color: white;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
        }
        
        .stat-label {
          color: #666;
          font-size: 14px;
        }
        
        .absence-calendar {
          margin-top: 30px;
        }
        
        .absence-calendar h3 {
          margin-top: 0;
          color: #333;
          font-size: 18px;
          margin-bottom: 15px;
        }
        
        .calendar-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .month-calendar {
          background-color: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .month-name {
          text-align: center;
          margin-top: 0;
          margin-bottom: 10px;
          color: #333;
          font-size: 16px;
          text-transform: capitalize;
        }
        
        .week-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 5px;
        }
        
        .week-day {
          text-align: center;
          font-weight: 600;
          color: #666;
          font-size: 12px;
        }
        
        .days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 3px;
        }
        
        .day-cell {
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          font-size: 13px;
        }
        
        .empty {
          background-color: transparent;
        }
        
        .absent {
          background-color: #ffcdd2;
          color: #d32f2f;
          font-weight: bold;
        }
        
        .absences-section {
          margin-top: 30px;
        }
        
        .absences-section h3 {
          margin-top: 0;
          color: #333;
          font-size: 18px;
          margin-bottom: 15px;
        }
        
        .absences-table-container {
          overflow-x: auto;
        }
        
        .absences-table {
          width: 100%;
          border-collapse: collapse;
          border-spacing: 0;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .absences-table th {
          background-color: #f5f5f5;
          padding: 12px 15px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 1px solid #ddd;
        }
        
        .absences-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #eee;
        }
        
        .status-absent {
          background-color: #fff8f8;
        }
        
        .status-late {
          background-color: #fff9e6;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .status-badge.absent {
          background-color: #ffcdd2;
          color: #c62828;
        }
        
        .status-badge.late {
          background-color: #ffe0b2;
          color: #e65100;
        }
        
        .status-badge.present {
          background-color: #c8e6c9;
          color: #2e7d32;
        }
        
        .no-absences-message {
          padding: 20px;
          text-align: center;
          background-color: #f8f9fa;
          border-radius: 8px;
          color: #666;
          font-style: italic;
        }
        
        .loading, .trainee-not-found {
          padding: 50px;
          text-align: center;
          color: #666;
        }
        
        .trainee-not-found h2 {
          color: #d32f2f;
          margin-bottom: 15px;
        }
        
        .trainee-not-found button {
          margin-top: 20px;
          padding: 8px 16px;
          background-color: #f0f0f0;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .additional-stats {
          margin-top: 15px;
        }
        
        .stat-value.warning {
          color: #e65100;
        }
      `}</style>
    </div>
  );
};

export default TraineeDetailsPage; 