import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../index.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Add a memoization utility function to cache expensive calculations
const memoize = (fn) => {
  const cache = {};
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache[key] === undefined) {
      cache[key] = fn(...args);
    }
    return cache[key];
  };
};

const SGStatistics = () => {
  const [stats, setStats] = useState({
    teachersCount: 0,
    traineesCount: 0,
    totalAbsences: 0,
    recentAbsences: 0,
    groupsCount: 0
  });
  
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groupStats, setGroupStats] = useState({
    totalTrainees: 0,
    totalAbsenceHours: 0,
    disciplinaryActions: {
      premiereMiseEnGarde: 0,
      deuxiemeMiseEnGarde: 0,
      premierAvertissement: 0,
      deuxiemeAvertissement: 0,
      blame: 0,
      exclusion2Jours: 0,
      exclusionTemp: 0
    }
  });
  
  // Add state for storing trainee list with absences
  const [topAbsentTrainees, setTopAbsentTrainees] = useState([]);
  
  const [absenceChartData, setAbsenceChartData] = useState({
    labels: ['Injustifiées', 'Justifiées'],
    datasets: [{
      data: [30, 15],
      backgroundColor: ['#FF6384', '#36A2EB'],
      borderWidth: 1
    }]
  });
  
  const [disciplinaryChartData, setDisciplinaryChartData] = useState({
    labels: [
      'Première Mise en Garde', 
      'Deuxième Mise en Garde', 
      'Premier Avertissement',
      'Deuxième Avertissement',
      'Blâme',
      'Exclusion de 2 Jours',
      'Exclusion Temporaire/Définitive'
    ],
    datasets: [{
      data: [12, 8, 6, 4, 3, 2, 1],
      backgroundColor: [
        '#FFD700', // Gold
        '#FFA500', // Orange
        '#FF8C00', // Dark Orange
        '#FF4500', // Orange Red
        '#FF0000', // Red
        '#8B0000', // Dark Red
        '#000000'  // Black
      ],
      borderWidth: 1
    }]
  });
  
  useEffect(() => {
    // Load data from localStorage
    const loadGroups = () => {
      try {
        // Get trainees and extract groups
        const traineesJson = localStorage.getItem('traineesData') || '[]';
        const trainees = JSON.parse(traineesJson);
        
        // Get unique groups
        const uniqueGroups = [...new Set(trainees.map(t => t.class || t.GROUPE).filter(Boolean))];
        setAvailableGroups(uniqueGroups);
        
        // Set first group as selected if available
        if (uniqueGroups.length > 0 && !selectedGroup) {
          setSelectedGroup(uniqueGroups[0]);
          calculateGroupStatistics(uniqueGroups[0]);
        }
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    };
    
    loadGroups();
  }, []);
  
  useEffect(() => {
    // Calculate statistics when a group is selected
    if (selectedGroup) {
      calculateGroupStatistics(selectedGroup);
    }
  }, [selectedGroup]);
  
  useEffect(() => {
    // Add effect to load dashboard statistics from localStorage
    const calculateDashboardStats = () => {
      try {
        // Initialize stats with defaults in case any calculation fails
        let teachersCount = 0;
        let traineesCount = 0;
        let groupsCount = 0;
        let totalAbsences = 0;
        let recentAbsences = 0;
        
        // Count teachers
        try {
          const teachersJson = localStorage.getItem('teachersData') || '[]';
          const teachers = JSON.parse(teachersJson);
          teachersCount = Array.isArray(teachers) ? teachers.length : 0;
        } catch (e) {
          console.warn('Error loading teachers data:', e);
        }
        
        // Get trainees data
        let trainees = [];
        try {
          const traineesJson = localStorage.getItem('traineesData') || '[]';
          trainees = JSON.parse(traineesJson);
          traineesCount = Array.isArray(trainees) ? trainees.length : 0;
        } catch (e) {
          console.warn('Error loading trainees data:', e);
        }
        
        // Count unique groups - only if trainees loaded successfully
        if (Array.isArray(trainees) && trainees.length > 0) {
          const uniqueGroups = [...new Set(trainees.map(t => t.class || t.GROUPE).filter(Boolean))];
          groupsCount = uniqueGroups.length;
        }
        
        // Count absences - use a more efficient approach
        try {
          const studentAbsencesJson = localStorage.getItem('studentAbsences') || '{}';
          const studentAbsences = JSON.parse(studentAbsencesJson);
          
          // Only calculate if we have valid data
          if (studentAbsences && typeof studentAbsences === 'object') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const sevenDaysAgoTime = sevenDaysAgo.getTime();
            
            // Process all students' absences at once
            Object.values(studentAbsences).forEach(absences => {
              if (Array.isArray(absences)) {
                // Use reduce for better performance than multiple filters
                const { total, recent } = absences.reduce((counts, absence) => {
                  if (absence.status === 'absent') {
                    counts.total++;
                    
                    // Check if absence is recent
                    try {
                      const absenceDate = new Date(absence.date);
                      if (!isNaN(absenceDate) && absenceDate.getTime() >= sevenDaysAgoTime) {
                        counts.recent++;
                      }
                    } catch (e) {
                      // Ignore date parsing errors
                    }
                  }
                  return counts;
                }, { total: 0, recent: 0 });
                
                totalAbsences += total;
                recentAbsences += recent;
              }
            });
          }
        } catch (e) {
          console.warn('Error calculating absence stats:', e);
        }
        
        // Update stats
        setStats({
          teachersCount,
          traineesCount,
          totalAbsences,
          recentAbsences,
          groupsCount
        });
      } catch (error) {
        console.error('Error calculating dashboard stats:', error);
        
        // Set stats to defaults in case of overall failure
        setStats({
          teachersCount: 0,
          traineesCount: 0,
          totalAbsences: 0,
          recentAbsences: 0,
          groupsCount: 0
        });
      }
    };
    
    calculateDashboardStats();
  }, []);
  
  const calculateGroupStatistics = (groupName) => {
    try {
      // Load trainees data
      const traineesJson = localStorage.getItem('traineesData') || '[]';
      const trainees = JSON.parse(traineesJson);
      
      // Filter trainees by group
      const groupTrainees = trainees.filter(trainee => 
        (trainee.class || trainee.GROUPE) === groupName
      );
      
      // Load absences data
      const studentAbsencesJson = localStorage.getItem('studentAbsences') || '{}';
      const studentAbsences = JSON.parse(studentAbsencesJson);
      
      // Calculate total absences and disciplinary actions for the group
      let totalAbsenceHours = 0;
      const traineesWithAbsences = [];
      
      // Create counters for each disciplinary state
      const disciplinaryActions = {
        premiereMiseEnGarde: 0,
        deuxiemeMiseEnGarde: 0,
        premierAvertissement: 0,
        deuxiemeAvertissement: 0,
        blame: 0,
        exclusion2Jours: 0,
        exclusionTemp: 0
      };
      
      // Process each trainee in the group
      groupTrainees.forEach(trainee => {
        const cef = trainee.cef || trainee.CEF;
        const absences = studentAbsences[cef] || [];
        
        // Calculate total hours for this trainee using the same calculation as in ManageTrainees
        let traineeHours = calculateAbsenceHours(absences);
        totalAbsenceHours += traineeHours;
        
        if (traineeHours > 0) {
          // Get the disciplinary status using the same logic as ManageTrainees
          const status = getTraineeStatusForDashboard(traineeHours);
          
          // Add trainee to the list with absences
          traineesWithAbsences.push({
            ...trainee,
            absenceHours: traineeHours,
            status: status
          });
          
          // Increment the appropriate counter
          if (status === "1er AVERT (SC)") {
            disciplinaryActions.premiereMiseEnGarde++;
          } else if (status === "2ème AVERT (SC)") {
            disciplinaryActions.deuxiemeMiseEnGarde++;
          } else if (status === "1er MISE (CD)") {
            disciplinaryActions.premierAvertissement++;
          } else if (status === "2ème MISE (CD)") {
            disciplinaryActions.deuxiemeAvertissement++;
          } else if (status === "BLÂME (CD)") {
            disciplinaryActions.blame++;
          } else if (status === "SUSP 2J (CD)") {
            disciplinaryActions.exclusion2Jours++;
          } else if (status === "EXCL TEMP (CD)" || status === "EXCL DEF (CD)") {
            disciplinaryActions.exclusionTemp++;
          }
        }
      });
      
      // Sort trainees by absence hours (descending)
      traineesWithAbsences.sort((a, b) => b.absenceHours - a.absenceHours);
      
      // Save top absent trainees (top 5 or all if less than 5)
      setTopAbsentTrainees(traineesWithAbsences.slice(0, 5));
      
      // Calculate justified vs unjustified absences (simulated ratio that could be replaced with real data)
      // In a real app, each absence record would have a 'justified' flag
      const justifiedRatio = 0.3 + (Math.random() * 0.2); // Between 30-50% justified
      const justified = Math.floor(totalAbsenceHours * justifiedRatio);
      const unjustified = totalAbsenceHours - justified;
      
      // Update group stats
      setGroupStats({
        totalTrainees: groupTrainees.length,
        totalAbsenceHours,
        disciplinaryActions
      });
      
      // Update disciplinary chart
      setDisciplinaryChartData({
        labels: [
          'Première Mise en Garde', 
          'Deuxième Mise en Garde', 
          'Premier Avertissement',
          'Deuxième Avertissement',
          'Blâme',
          'Exclusion de 2 Jours',
          'Exclusion Temporaire/Définitive'
        ],
        datasets: [{
          data: [
            disciplinaryActions.premiereMiseEnGarde,
            disciplinaryActions.deuxiemeMiseEnGarde,
            disciplinaryActions.premierAvertissement,
            disciplinaryActions.deuxiemeAvertissement,
            disciplinaryActions.blame,
            disciplinaryActions.exclusion2Jours,
            disciplinaryActions.exclusionTemp
          ],
          backgroundColor: [
            '#235a8c', // Blue - matches ManageTrainees
            '#191E46', // Dark blue - matches ManageTrainees
            '#8784b6', // Purplish - matches ManageTrainees
            '#8784b6', // Same as 1er MISE - matches ManageTrainees
            '#8B4513', // RAL 050 50 60 - matches ManageTrainees
            '#FEAE00', // Light orange - matches ManageTrainees
            '#FF0000'  // Bright red - matches ManageTrainees
          ],
          borderWidth: 1
        }]
      });
      
      setAbsenceChartData({
        labels: ['Injustifiées', 'Justifiées'],
        datasets: [{
          data: [unjustified, justified],
          backgroundColor: ['#FF6384', '#36A2EB'],
          borderWidth: 1
        }]
      });
      
    } catch (error) {
      console.error('Error calculating group statistics:', error);
    }
  };
  
  // Calculate absence hours using the same logic as ManageTrainees.jsx
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
  
  // Use the exact same logic from ManageTrainees.jsx
  const getTraineeStatusForDashboard = (absenceHours) => {
    // Calculate discipline note based on absence hours (5 hours = -1 point from 20)
    const absencePoints = Math.floor(absenceHours / 5);
    const score = 20 - absencePoints;
    
    // Calculate points deducted (rounded to match getDisciplinaryAction)
    const deducted = Math.round(20 - score);
    
    // Return the text status using the same values as in ManageTrainees.jsx
    if (deducted === 0) {
      return "NORMAL";
    } 
    else if (deducted === 1) {
      return "1er AVERT (SC)";
    } 
    else if (deducted === 2) {
      return "2ème AVERT (SC)";
    } 
    else if (deducted === 3) {
      return "1er MISE (CD)";
    } 
    else if (deducted === 4) {
      return "2ème MISE (CD)";
    } 
    else if (deducted === 5) {
      return "BLÂME (CD)";
    } 
    else if (deducted === 6) {
      return "SUSP 2J (CD)";
    } 
    else if (deducted >= 7 && deducted <= 10) {
      return "EXCL TEMP (CD)";
    } 
    else {
      return "EXCL DEF (CD)";
    }
  };
  
  // Function to get disciplinary status based on hours - keep this for the UI display
  const getDisciplinaryStatus = (hours) => {
    const status = getTraineeStatusForDashboard(hours);
    
    // Map from internal status code to display status and color
    if (status === "NORMAL") return { status: 'Normal', color: '#2ecc71' };
    if (status === "1er AVERT (SC)") return { status: 'Première Mise en Garde', color: '#235a8c' };
    if (status === "2ème AVERT (SC)") return { status: 'Deuxième Mise en Garde', color: '#191E46' };
    if (status === "1er MISE (CD)") return { status: 'Premier Avertissement', color: '#8784b6' };
    if (status === "2ème MISE (CD)") return { status: 'Deuxième Avertissement', color: '#8784b6' };
    if (status === "BLÂME (CD)") return { status: 'Blâme', color: '#8B4513' };
    if (status === "SUSP 2J (CD)") return { status: 'Exclusion de 2 Jours', color: '#FEAE00' };
    if (status === "EXCL TEMP (CD)") return { status: 'Exclusion Temporaire/Définitive', color: '#FEAE00' };
    if (status === "EXCL DEF (CD)") return { status: 'Exclusion Temporaire/Définitive', color: '#FF0000' };
    return { status: 'Normal', color: '#2ecc71' };
  };
  
  const handleGroupChange = (e) => {
    setSelectedGroup(e.target.value);
  };
  
  return (
    <div className="statistics-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Tableau de Bord</h1>
      </div>
      
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-number">{stats.teachersCount}</div>
          <div className="stat-label">Formateurs</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-number">{stats.traineesCount}</div>
          <div className="stat-label">Stagiaires</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-number">{stats.groupsCount}</div>
          <div className="stat-label">Groupes</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🗓️</div>
          <div className="stat-number">{stats.totalAbsences}</div>
          <div className="stat-label">Absences totales</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-number">{stats.recentAbsences}</div>
          <div className="stat-label">Absences récentes (7 jours)</div>
        </div>
      </div>
      
      <div className="group-stats-section">
        <h2 className="section-title">Statistiques par Groupe</h2>
        
        <div className="group-selector">
          <label htmlFor="group-select">Sélectionner un groupe:</label>
          <select
            id="group-select"
            value={selectedGroup}
            onChange={handleGroupChange}
            className="group-select"
          >
            {availableGroups.map((group, index) => (
              <option key={index} value={group}>{group}</option>
            ))}
          </select>
        </div>
        
        {selectedGroup && (
          <div className="group-details">
            <div className="group-info-panel">
              <div className="group-info-card">
                <h3 className="info-title">Stagiaires</h3>
                <div className="info-value">{groupStats.totalTrainees}</div>
              </div>
              
              <div className="group-info-card">
                <h3 className="info-title">Heures d'absence</h3>
                <div className="info-value">{groupStats.totalAbsenceHours}</div>
              </div>
            </div>
            
            <div className="group-details-panels">
              <div className="disciplinary-panel">
                <h3 className="panel-title">États Disciplinaires</h3>
                
                <div className="disciplinary-stats">
                  <div className="disc-stat-item">
                    <div className="disc-stat-value">{groupStats.disciplinaryActions.premiereMiseEnGarde}</div>
                    <div className="disc-stat-label">Première Mise en Garde</div>
                  </div>
                  
                  <div className="disc-stat-item">
                    <div className="disc-stat-value">{groupStats.disciplinaryActions.deuxiemeMiseEnGarde}</div>
                    <div className="disc-stat-label">Deuxième Mise en Garde</div>
                  </div>
                  
                  <div className="disc-stat-item">
                    <div className="disc-stat-value">{groupStats.disciplinaryActions.premierAvertissement}</div>
                    <div className="disc-stat-label">Premier Avertissement</div>
                  </div>
                  
                  <div className="disc-stat-item">
                    <div className="disc-stat-value">{groupStats.disciplinaryActions.deuxiemeAvertissement}</div>
                    <div className="disc-stat-label">Deuxième Avertissement</div>
                  </div>
                  
                  <div className="disc-stat-item">
                    <div className="disc-stat-value">{groupStats.disciplinaryActions.blame}</div>
                    <div className="disc-stat-label">Blâme</div>
                  </div>
                  
                  <div className="disc-stat-item">
                    <div className="disc-stat-value">{groupStats.disciplinaryActions.exclusion2Jours}</div>
                    <div className="disc-stat-label">Exclusion de 2 Jours</div>
                  </div>
                  
                  <div className="disc-stat-item">
                    <div className="disc-stat-value">{groupStats.disciplinaryActions.exclusionTemp}</div>
                    <div className="disc-stat-label">Exclusion Temporaire ou Définitive</div>
                  </div>
                </div>
                
                <div className="chart-container">
                  <Pie 
                    data={disciplinaryChartData}
                    options={{
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            boxWidth: 15,
                            padding: 15,
                            font: {
                              size: 12
                            }
                          }
                        },
                        title: {
                          display: true,
                          text: 'Répartition des États Disciplinaires',
                          font: {
                            size: 16
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="absence-panel">
                <h3 className="panel-title">Répartition des Absences</h3>
                
                <div className="absence-info">
                  <div className="absence-stat">
                    <div className="absence-value">{groupStats.totalAbsenceHours}</div>
                    <div className="absence-label">Heures totales</div>
                  </div>
                  
                  <div className="absence-distribution">
                    <div className="absence-type unjustified">
                      <div className="absence-type-value">{absenceChartData.datasets[0].data[0]}</div>
                      <div className="absence-type-label">Injustifiées</div>
                    </div>
                    
                    <div className="absence-type justified">
                      <div className="absence-type-value">{absenceChartData.datasets[0].data[1]}</div>
                      <div className="absence-type-label">Justifiées</div>
                    </div>
                  </div>
                </div>
                
                <div className="chart-container">
                  <Pie 
                    data={absenceChartData}
                    options={{
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            boxWidth: 15,
                            padding: 15,
                            font: {
                              size: 12
                            }
                          }
                        },
                        title: {
                          display: true,
                          text: 'Absences Justifiées vs Injustifiées',
                          font: {
                            size: 16
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add the Top Absent Trainees section */}
      {selectedGroup && topAbsentTrainees.length > 0 && (
        <div className="top-absent-section">
          <h2 className="section-title">Stagiaires avec plus d'absences</h2>
          
          <div className="trainees-table-container">
            <table className="trainees-table">
              <thead>
                <tr>
                  <th>CEF</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Heures d'absence</th>
                  <th>Statut disciplinaire</th>
                </tr>
              </thead>
              <tbody>
                {topAbsentTrainees.map((trainee, index) => {
                  const disciplinaryStatus = getDisciplinaryStatus(trainee.absenceHours);
                  return (
                    <tr key={index}>
                      <td>{trainee.cef || trainee.CEF}</td>
                      <td>{trainee.name || trainee.NOM}</td>
                      <td>{trainee.first_name || trainee.PRENOM}</td>
                      <td className="hours-cell">{trainee.absenceHours}</td>
                      <td>
                        <span 
                          className="status-badge" 
                          style={{ backgroundColor: `${disciplinaryStatus.color}20`, color: disciplinaryStatus.color, borderColor: disciplinaryStatus.color }}
                        >
                          {disciplinaryStatus.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .statistics-dashboard {
          padding: 2rem;
          max-width: 1500px;
          margin: 0 auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .dashboard-header {
          margin-bottom: 2rem;
          text-align: center;
        }
        
        .dashboard-title {
          font-size: 2.2rem;
          color: #2c3e50;
          margin: 0;
          padding-bottom: 1rem;
          position: relative;
        }
        
        .dashboard-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 4px;
          background: linear-gradient(90deg, #3498db, #2c3e50);
          border-radius: 2px;
        }
        
        .stats-overview {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        
        .stat-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          padding: 1.5rem;
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          border-top: 5px solid #3498db;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.12);
        }
        
        .stat-icon {
          font-size: 2.5rem;
          margin-bottom: 0.8rem;
        }
        
        .stat-number {
          font-size: 2.2rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 0.4rem;
        }
        
        .stat-label {
          color: #7f8c8d;
          font-weight: 500;
        }
        
        .section-title {
          font-size: 1.6rem;
          color: #2c3e50;
          margin-top: 0;
          margin-bottom: 1.5rem;
          padding-bottom: 0.8rem;
          border-bottom: 2px solid #ecf0f1;
        }
        
        .group-selector {
          display: flex;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .group-selector label {
          margin-right: 1rem;
          font-weight: 500;
          color: #34495e;
        }
        
        .group-select {
          padding: 0.6rem 1rem;
          border-radius: 6px;
          border: 1px solid #dcdfe6;
          background-color: white;
          font-size: 1rem;
          min-width: 200px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .group-select:focus {
          border-color: #3498db;
          outline: none;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }
        
        .group-info-panel {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .group-info-card {
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          padding: 1.2rem;
          text-align: center;
          border-left: 5px solid #3498db;
        }
        
        .info-title {
          color: #7f8c8d;
          font-size: 1.1rem;
          font-weight: 500;
          margin-top: 0;
          margin-bottom: 0.6rem;
        }
        
        .info-value {
          font-size: 2rem;
          font-weight: 700;
          color: #2c3e50;
        }
        
        .group-details-panels {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 2rem;
        }
        
        .disciplinary-panel, .absence-panel {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
          padding: 1.5rem;
          overflow: hidden;
        }
        
        .panel-title {
          font-size: 1.3rem;
          color: #2c3e50;
          margin-top: 0;
          margin-bottom: 1.5rem;
          padding-bottom: 0.8rem;
          border-bottom: 1px solid #ecf0f1;
        }
        
        .disciplinary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .disc-stat-item {
          padding: 0.8rem;
          background: #f8f9fa;
          border-radius: 8px;
          text-align: center;
          border-left: 4px solid;
        }
        
        .disc-stat-item:nth-child(1) { border-color: #FFD700; }
        .disc-stat-item:nth-child(2) { border-color: #FFA500; }
        .disc-stat-item:nth-child(3) { border-color: #FF8C00; }
        .disc-stat-item:nth-child(4) { border-color: #FF4500; }
        .disc-stat-item:nth-child(5) { border-color: #FF0000; }
        .disc-stat-item:nth-child(6) { border-color: #8B0000; }
        .disc-stat-item:nth-child(7) { border-color: #000000; }
        
        .disc-stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 0.3rem;
        }
        
        .disc-stat-label {
          font-size: 0.85rem;
          color: #7f8c8d;
          line-height: 1.3;
        }
        
        .absence-info {
          display: flex;
          justify-content: space-around;
          margin-bottom: 2rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 10px;
        }
        
        .absence-stat {
          text-align: center;
        }
        
        .absence-value {
          font-size: 2rem;
          font-weight: 700;
          color: #2c3e50;
        }
        
        .absence-label {
          color: #7f8c8d;
          font-size: 0.9rem;
          margin-top: 0.3rem;
        }
        
        .absence-distribution {
          display: flex;
          gap: 1.5rem;
        }
        
        .absence-type {
          text-align: center;
          padding: 0.7rem 1.2rem;
          border-radius: 8px;
          min-width: 120px;
        }
        
        .absence-type.unjustified {
          background: rgba(255, 99, 132, 0.1);
          border: 1px solid rgba(255, 99, 132, 0.3);
        }
        
        .absence-type.justified {
          background: rgba(54, 162, 235, 0.1);
          border: 1px solid rgba(54, 162, 235, 0.3);
        }
        
        .absence-type-value {
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        .absence-type.unjustified .absence-type-value {
          color: #FF6384;
        }
        
        .absence-type.justified .absence-type-value {
          color: #36A2EB;
        }
        
        .absence-type-label {
          font-size: 0.85rem;
          color: #7f8c8d;
          margin-top: 0.3rem;
        }
        
        .chart-container {
          height: 300px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 1rem;
        }
        
        @media (max-width: 768px) {
          .statistics-dashboard {
            padding: 1rem;
          }
          
          .group-details-panels {
            grid-template-columns: 1fr;
          }
          
          .disciplinary-stats {
            grid-template-columns: 1fr 1fr;
          }
          
          .absence-info {
            flex-direction: column;
            gap: 1.5rem;
          }
          
          .absence-distribution {
            justify-content: center;
          }
          
          .chart-container {
            height: 250px;
          }
        }
        
        .top-absent-section {
          margin-top: 3rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          padding: 1.5rem;
        }
        
        .trainees-table-container {
          overflow-x: auto;
          margin-top: 1rem;
        }
        
        .trainees-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }
        
        .trainees-table th,
        .trainees-table td {
          padding: 0.9rem 1rem;
          text-align: left;
          border-bottom: 1px solid #ecf0f1;
        }
        
        .trainees-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #34495e;
          position: sticky;
          top: 0;
        }
        
        .trainees-table tr:hover {
          background-color: #f8f9fa;
        }
        
        .hours-cell {
          font-weight: 600;
          text-align: center;
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.4rem 0.8rem;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 500;
          border: 1px solid;
        }
      `}</style>
    </div>
  );
};

export default SGStatistics; 