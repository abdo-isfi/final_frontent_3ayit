import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../index.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const SGStatistics = () => {
  const [stats, setStats] = useState({
    teachersCount: 0,
    traineesCount: 0,
    totalAbsences: 0,
    recentAbsences: 0,
    groupsCount: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  
  // Group-specific statistics
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groupStats, setGroupStats] = useState({
    totalTrainees: 0,
    totalAbsenceHours: 0,
    absentTrainees: 0,
    disciplinaryActions: {
      normal: 0,
      attention: 0,
      alerte: 0,
      critique: 0
    }
  });
  
  useEffect(() => {
    // Load data from localStorage
    const loadStatistics = () => {
      try {
        // Get teachers count
        const formateursJson = localStorage.getItem('formateurs') || '[]';
        const formateurs = JSON.parse(formateursJson);
        
        // Get trainees count and groups
        const traineesJson = localStorage.getItem('traineesData') || '[]';
        const trainees = JSON.parse(traineesJson);
        
        // Get unique groups
        const uniqueGroups = [...new Set(trainees.map(t => t.class || t.GROUPE).filter(Boolean))];
        setAvailableGroups(uniqueGroups);
        
        // Get absence data
        const studentAbsencesJson = localStorage.getItem('studentAbsences') || '{}';
        const studentAbsences = JSON.parse(studentAbsencesJson);
        
        // Count total absences
        let totalAbsences = 0;
        let recentAbsences = 0;
        
        // Get today's date and 7 days ago
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        
        // Process all absences
        Object.values(studentAbsences).forEach(absences => {
          totalAbsences += absences.length;
          
          // Count recent absences (last 7 days)
          recentAbsences += absences.filter(absence => {
            if (!absence.date) return false;
            const absenceDate = new Date(absence.date);
            return absenceDate >= oneWeekAgo;
          }).length;
        });
        
        // Update stats
        setStats({
          teachersCount: formateurs.length,
          traineesCount: trainees.length,
          totalAbsences,
          recentAbsences,
          groupsCount: uniqueGroups.length
        });
        
        // Generate recent activity (most recent absences)
        const recentActivityItems = [];
        
        // Collect all absences with student info
        const allAbsences = [];
        Object.entries(studentAbsences).forEach(([cef, absences]) => {
          const student = trainees.find(t => (t.cef === cef || t.CEF === cef));
          if (student) {
            absences.forEach(absence => {
              allAbsences.push({
                ...absence,
                studentName: `${student.name || student.NOM || ''} ${student.first_name || student.PRENOM || ''}`.trim(),
                group: student.class || student.GROUPE || '',
                cef
              });
            });
          }
        });
        
        // Sort by date (most recent first)
        allAbsences.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Take first 5 items
        setRecentActivity(allAbsences.slice(0, 5));
        
        // Generate chart data for absences by group
        prepareChartData(allAbsences, uniqueGroups);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };
    
    loadStatistics();
  }, []);
  
  useEffect(() => {
    // Calculate statistics when a group is selected
    if (selectedGroup) {
      calculateGroupStatistics(selectedGroup);
    }
  }, [selectedGroup]);
  
  // Prepare chart data for absence distribution by group
  const prepareChartData = (allAbsences, uniqueGroups) => {
    // Count absences by group
    const absenceCountByGroup = {};
    const absencesCountByGroupType = {};
    
    // Get list of teacher-marked absences by group
    const teacherMarkedGroups = new Set();
    
    // Count absences for each group
    allAbsences.forEach(absence => {
      if (absence.group && uniqueGroups.includes(absence.group)) {
        // Only count if there is a recorded absence or late
        if (absence.status === 'absent' || absence.status === 'late') {
          // Track this group as having absences
          teacherMarkedGroups.add(absence.group);
          
          // Initialize the group counts if not already done
          if (!absenceCountByGroup[absence.group]) {
            absenceCountByGroup[absence.group] = 0;
            absencesCountByGroupType[absence.group] = {
              absents: 0,
              retards: 0
            };
          }
          
          absenceCountByGroup[absence.group] += 1;
          
          if (absence.status === 'absent') {
            absencesCountByGroupType[absence.group].absents += 1;
          } else if (absence.status === 'late') {
            absencesCountByGroupType[absence.group].retards += 1;
          }
        }
      }
    });
    
    // Get array of groups with absences
    const groupsWithAbsences = Array.from(teacherMarkedGroups);
    
    console.log("Groups with teacher-marked absences:", groupsWithAbsences);
    
    // Create chart data for pie chart (only include groups with absences)
    const pieData = {
      labels: groupsWithAbsences,
      datasets: [
        {
          data: groupsWithAbsences.map(group => absenceCountByGroup[group]),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#8AC249', '#EA5F89', '#5DA5DA', '#FAA43A'
          ],
          borderWidth: 1
        }
      ]
    };
    
    // Create chart data for bar chart (only include groups with absences)
    const barData = {
      labels: groupsWithAbsences,
      datasets: [
        {
          label: 'Absences',
          data: groupsWithAbsences.map(group => absencesCountByGroupType[group].absents),
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        },
        {
          label: 'Retards',
          data: groupsWithAbsences.map(group => absencesCountByGroupType[group].retards),
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        }
      ]
    };
    
    setChartData({
      pie: pieData,
      bar: barData
    });
  };
  
  const calculateGroupStatistics = (groupName) => {
    try {
      // Load trainees and absences data
      const traineesJson = localStorage.getItem('stagiaires') || '[]';
      const trainees = JSON.parse(traineesJson);
      
      const studentAbsencesJson = localStorage.getItem('studentAbsences') || '{}';
      const studentAbsences = JSON.parse(studentAbsencesJson);

      // Filter trainees by group
      const groupTrainees = trainees.filter(trainee => trainee.class === groupName);
      
      // Calculate stats
      const stats = {
        totalTrainees: groupTrainees.length,
        totalAbsenceHours: 0,
        absentTrainees: 0,
        disciplinaryActions: {
          normal: 0,
          attention: 0,
          alerte: 0,
          critique: 0
        }
      };

      // Count trainees with absences and calculate total hours
      const traineesWithAbsences = new Set();
      
      groupTrainees.forEach(trainee => {
        const cef = trainee.cef;
        const absences = studentAbsences[cef] || [];
        
        if (absences.length > 0) {
          traineesWithAbsences.add(cef);
          
          // Calculate total absence hours for this trainee
          const absenceHours = calculateAbsenceHours(absences);
          stats.totalAbsenceHours += absenceHours;
          
          // Determine status based on absence hours
          const status = getTraineeStatus(absenceHours);
          stats.disciplinaryActions[status.toLowerCase()]++;
        }
      });
      
      // Set normal status for trainees without absences
      stats.disciplinaryActions.normal = groupTrainees.length - 
        (stats.disciplinaryActions.attention + 
         stats.disciplinaryActions.alerte + 
         stats.disciplinaryActions.critique);
      
      stats.absentTrainees = traineesWithAbsences.size;
      setGroupStats(stats);
      
    } catch (error) {
      console.error('Error calculating group statistics:', error);
    }
  };

  // Helper functions
  const calculateAbsenceHours = (absences) => {
    let totalHours = 0;
    
    absences.forEach(absence => {
      if (absence.status === 'absent') {
        // Calculate hours based on start and end time
        if (absence.startTime && absence.endTime) {
          const [startHour, startMinute] = absence.startTime.split(':').map(Number);
          const [endHour, endMinute] = absence.endTime.split(':').map(Number);
          
          const durationHours = endHour - startHour + (endMinute - startMinute) / 60;
          totalHours += durationHours;
        } else {
          // Default to 4 hours if no specific time
          totalHours += 4;
        }
      } else if (absence.status === 'late') {
        // Count lateness as 1 hour
        totalHours += 1;
      }
    });
    
    return Math.round(totalHours * 10) / 10; // Round to 1 decimal place
  };

  const getTraineeStatus = (absenceHours) => {
    if (absenceHours < 5) {
      return 'normal';
    } else if (absenceHours < 10) {
      return 'attention';
    } else if (absenceHours < 15) {
      return 'alerte';
    } else {
      return 'critique';
    }
  };

  const handleGroupChange = (e) => {
    setSelectedGroup(e.target.value);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };
  
  // Chart options
  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          font: {
            size: 11
          }
        }
      },
      title: {
        display: true,
        text: 'Répartition des absences par groupe',
        font: {
          size: 16
        }
      }
    }
  };
  
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Types d\'absences par groupe',
        font: {
          size: 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nombre'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Groupes'
        }
      }
    }
  };
  
  return (
    <div className="statistics-layout">
      <div className="statistics-content">
        <h1 className="page-title">Tableau de Bord - Statistiques</h1>
        <p className="page-subtitle">Aperçu et statistiques de l'établissement</p>
        
        {/* Group Selection and Statistics */}
        <div className="group-stats-section">
          <div className="group-selector">
            <h2>Statistiques par Groupe</h2>
            <div className="select-container">
              <select 
                value={selectedGroup} 
                onChange={handleGroupChange}
                className="group-select"
              >
                <option value="">Sélectionner un groupe</option>
                {availableGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
          </div>
          
          {selectedGroup && (
            <div className="statistics-container">
              <div className="stat-card">
                <h3>Effectif Total</h3>
                <span className="stat-value">{groupStats.totalTrainees}</span>
              </div>
              <div className="stat-card">
                <h3>Absents</h3>
                <span className="stat-value">{groupStats.absentTrainees}</span>
                <span className="stat-percentage">
                  {groupStats.totalTrainees 
                    ? `${Math.round((groupStats.absentTrainees / groupStats.totalTrainees) * 100)}%` 
                    : '0%'}
                </span>
              </div>
              <div className="stat-card">
                <h3>Heures d'Absence</h3>
                <span className="stat-value">{groupStats.totalAbsenceHours}h</span>
              </div>
              <div className="stat-card disciplinary-card">
                <h3>États Disciplinaires</h3>
                <div className="status-bars">
                  <div className="status-bar">
                    <span className="status-label normal">Normal</span>
                    <div className="bar-container">
                      <div 
                        className="bar normal" 
                        style={{width: `${(groupStats.disciplinaryActions.normal / groupStats.totalTrainees) * 100}%`}}
                      ></div>
                    </div>
                    <span className="status-count">{groupStats.disciplinaryActions.normal}</span>
                  </div>
                  <div className="status-bar">
                    <span className="status-label attention">Attention</span>
                    <div className="bar-container">
                      <div 
                        className="bar attention" 
                        style={{width: `${(groupStats.disciplinaryActions.attention / groupStats.totalTrainees) * 100}%`}}
                      ></div>
                    </div>
                    <span className="status-count">{groupStats.disciplinaryActions.attention}</span>
                  </div>
                  <div className="status-bar">
                    <span className="status-label alerte">Alerte</span>
                    <div className="bar-container">
                      <div 
                        className="bar alerte" 
                        style={{width: `${(groupStats.disciplinaryActions.alerte / groupStats.totalTrainees) * 100}%`}}
                      ></div>
                    </div>
                    <span className="status-count">{groupStats.disciplinaryActions.alerte}</span>
                  </div>
                  <div className="status-bar">
                    <span className="status-label critique">Critique</span>
                    <div className="bar-container">
                      <div 
                        className="bar critique" 
                        style={{width: `${(groupStats.disciplinaryActions.critique / groupStats.totalTrainees) * 100}%`}}
                      ></div>
                    </div>
                    <span className="status-count">{groupStats.disciplinaryActions.critique}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="loading-section">Chargement des données...</div>
        ) : (
          <>
            {/* Statistics Section */}
            <div className="stats-section">
              <div className="stat-card">
                <div className="stat-icon teacher">👨‍🏫</div>
                <div className="stat-value">{stats.teachersCount}</div>
                <div className="stat-label">Formateurs</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon trainee">👨‍🎓</div>
                <div className="stat-value">{stats.traineesCount}</div>
                <div className="stat-label">Stagiaires</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon group">👥</div>
                <div className="stat-value">{stats.groupsCount}</div>
                <div className="stat-label">Groupes</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon absence">🗓️</div>
                <div className="stat-value">{stats.totalAbsences}</div>
                <div className="stat-label">Absences totales</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon recent">📊</div>
                <div className="stat-value">{stats.recentAbsences}</div>
                <div className="stat-label">Absences récentes (7 jours)</div>
              </div>
            </div>
            
            {/* Absences by Group Summary */}
            <h2 className="section-title">Répartition des Absences</h2>
            <div className="charts-container">
              <div className="chart-box">
                {chartData.pie && chartData.pie.labels.length > 0 ? (
                  <Pie data={chartData.pie} options={pieOptions} />
                ) : (
                  <div className="no-data-message">
                    Aucune donnée d'absence disponible
                  </div>
                )}
              </div>
              
              <div className="chart-box bar-chart">
                {chartData.bar && chartData.bar.labels.length > 0 ? (
                  <Bar data={chartData.bar} options={barOptions} />
                ) : (
                  <div className="no-data-message">
                    Aucune donnée d'absence disponible
                </div>
                )}
              </div>
            </div>
            
            {/* Recent Activity Section */}
            <h2 className="section-title">Activité récente</h2>
            <div className="recent-activity-section">
              {recentActivity.length === 0 ? (
                <div className="no-activity">Aucune activité récente enregistrée</div>
              ) : (
                <table className="activity-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Stagiaire</th>
                      <th>Groupe</th>
                      <th>Statut</th>
                      <th>Formateur</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((activity, index) => (
                      <tr key={index}>
                        <td>{formatDate(activity.date)}</td>
                        <td>{activity.studentName}</td>
                        <td>{activity.group}</td>
                        <td>
                          <span className={`status-badge ${activity.status}`}>
                            {activity.status === 'absent' && 'Absent'}
                            {activity.status === 'late' && 'Retard'}
                            {activity.status === 'present' && 'Présent'}
                          </span>
                        </td>
                        <td>{activity.teacher || 'Import Excel'}</td>
                        <td>
                          <Link 
                            to={`/sg/trainee-details/${activity.cef}`}
                            className="view-details-link"
                          >
                            Voir détails
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              
              {recentActivity.length > 0 && (
                <div className="view-all-container">
                  <Link to="/sg/absence" className="view-all-button">
                    Voir toutes les absences
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .statistics-layout {
          padding: var(--space-5);
          background-color: var(--gray-100);
          min-height: calc(100vh - 90px);
        }
        
        .statistics-content {
          max-width: 1300px;
          margin: 0 auto;
        }
        
        .page-title {
          font-size: var(--font-size-2xl);
          color: var(--primary-dark);
          margin-bottom: var(--space-1);
          text-align: center;
          font-weight: 700;
        }
        
        .page-subtitle {
          font-size: var(--font-size-md);
          color: var(--gray-600);
          margin-bottom: var(--space-5);
          text-align: center;
        }
        
        /* Stats Section */
        .stats-section {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-5);
        }
        
        .stat-card {
          background-color: var(--white);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: var(--transition-normal);
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }
        
        .stat-icon {
          font-size: 24px;
          margin-bottom: var(--space-2);
        }
        
        .stat-icon.teacher {
          color: var(--primary);
        }
        
        .stat-icon.trainee {
          color: var(--success);
        }
        
        .stat-icon.group {
          color: var(--info);
        }
        
        .stat-icon.absence {
          color: var(--danger);
        }
        
        .stat-icon.recent {
          color: var(--warning);
        }
        
        .stat-value {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: var(--space-1);
        }
        
        .stat-label {
          color: var(--gray-600);
          font-size: var(--font-size-sm);
          text-align: center;
        }
        
        /* Chart Section */
        .section-title {
          font-size: var(--font-size-xl);
          color: var(--primary-dark);
          margin: var(--space-5) 0 var(--space-3) 0;
          font-weight: 600;
        }
        
        .charts-container {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-5);
          margin-bottom: var(--space-5);
        }
        
        .chart-box {
          flex: 1;
          min-width: 300px;
          background-color: var(--white);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          box-shadow: var(--shadow-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .bar-chart {
          min-height: 350px;
        }
        
        .no-data-message {
          text-align: center;
          color: var(--gray-600);
          font-size: var(--font-size-lg);
          padding: var(--space-5);
        }
        
        /* Recent Activity Section */
        .recent-activity-section {
          background-color: var(--white);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          box-shadow: var(--shadow-md);
          margin-bottom: var(--space-5);
        }
        
        .activity-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .activity-table th,
        .activity-table td {
          padding: var(--space-3);
          text-align: left;
          border-bottom: 1px solid var(--gray-200);
        }
        
        .activity-table th {
          font-weight: 600;
          color: var(--gray-700);
          background-color: var(--gray-100);
        }
        
        .status-badge {
          display: inline-block;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          font-weight: 500;
        }
        
        .status-badge.absent {
          background-color: var(--danger-bg);
          color: var(--danger);
        }
        
        .status-badge.late {
          background-color: var(--warning-bg);
          color: var(--warning);
        }
        
        .status-badge.present {
          background-color: var(--success-bg);
          color: var(--success);
        }
        
        .view-details-link {
          background-color: var(--primary);
          color: var(--white);
          text-decoration: none;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          display: inline-block;
          transition: var(--transition-fast);
        }
        
        .view-details-link:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
        }
        
        .no-activity {
          padding: var(--space-5);
          text-align: center;
          color: var(--gray-600);
          background-color: var(--gray-100);
          border-radius: var(--radius-md);
        }
        
        .view-all-container {
          margin-top: var(--space-4);
          text-align: center;
        }
        
        .view-all-button {
          display: inline-block;
          background-color: var(--primary);
          color: var(--white);
          text-decoration: none;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          font-weight: 500;
          transition: var(--transition-fast);
        }
        
        .view-all-button:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        
        .loading-section {
          padding: var(--space-6);
          text-align: center;
          color: var(--gray-600);
        }
        
        @media (max-width: 768px) {
          .stats-section {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .activity-table th, 
          .activity-table td {
            padding: var(--space-2);
            font-size: var(--font-size-xs);
          }
          
          .view-details-link {
            padding: var(--space-1) var(--space-2);
          }
        }
        
        @media (max-width: 480px) {
          .stats-section {
            grid-template-columns: 1fr;
          }
        }
        
        .group-stats-section {
          background-color: white;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          padding: var(--space-6);
          margin-bottom: var(--space-8);
        }
        
        .group-selector {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
          flex-wrap: wrap;
        }
        
        .group-selector h2 {
          font-size: var(--font-size-xl);
          color: var(--primary-dark);
          margin: 0;
        }
        
        .select-container {
          min-width: 250px;
        }
        
        .group-select {
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px;
          border: 1px solid var(--gray-300);
          background-color: white;
          font-size: var(--font-size-md);
          color: var(--gray-700);
          cursor: pointer;
        }
        
        .statistics-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-4);
        }
        
        .stat-card {
          background-color: white;
          border-radius: 8px;
          border: 1px solid var(--gray-200);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .disciplinary-card {
          grid-column: 1 / -1;
        }
        
        .stat-card h3 {
          font-size: var(--font-size-md);
          color: var(--gray-600);
          margin-top: 0;
          margin-bottom: var(--space-2);
        }
        
        .stat-value {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          color: var(--primary-dark);
        }
        
        .stat-percentage {
          font-size: var(--font-size-sm);
          color: var(--gray-500);
          margin-top: var(--space-1);
        }
        
        .status-bars {
          width: 100%;
          margin-top: var(--space-2);
        }
        
        .status-bar {
          display: flex;
          align-items: center;
          margin-bottom: var(--space-2);
        }
        
        .status-label {
          width: 90px;
          font-size: var(--font-size-sm);
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
          margin-right: var(--space-2);
          text-align: center;
        }
        
        .status-label.normal {
          background-color: #e6f7ed;
          color: #2d9e62;
        }
        
        .status-label.attention {
          background-color: #fff7e6;
          color: #d99a2a;
        }
        
        .status-label.alerte {
          background-color: #fff1f0;
          color: #d14b45;
        }
        
        .status-label.critique {
          background-color: #f5222d20;
          color: #cf1322;
        }
        
        .bar-container {
          flex: 1;
          height: 12px;
          background-color: var(--gray-200);
          border-radius: 6px;
          overflow: hidden;
        }
        
        .bar {
          height: 100%;
          transition: width 0.5s ease;
        }
        
        .bar.normal {
          background-color: #52c41a;
        }
        
        .bar.attention {
          background-color: #faad14;
        }
        
        .bar.alerte {
          background-color: #f5222d;
        }
        
        .bar.critique {
          background-color: #cf1322;
        }
        
        .status-count {
          width: 30px;
          font-size: var(--font-size-sm);
          color: var(--gray-700);
          margin-left: var(--space-2);
          text-align: right;
        }
        
        @media (max-width: 768px) {
          .group-selector {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .group-selector h2 {
            margin-bottom: var(--space-3);
          }
          
          .select-container {
            width: 100%;
          }
          
          .statistics-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SGStatistics; 