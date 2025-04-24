import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../index.css";

const AbsenceSGPage = () => {
  const [absenceRecords, setAbsenceRecords] = useState([]);
  const [studentAbsences, setStudentAbsences] = useState({});
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [flattenedAbsences, setFlattenedAbsences] = useState([]);
  
  // Filter state
  const [filterDate, setFilterDate] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterStudent, setFilterStudent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "absent", "late", "present"
  const [bulkValidating, setBulkValidating] = useState(false);
  
  // Selected trainee for detail view
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [traineeAbsences, setTraineeAbsences] = useState([]);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  
  // New state for validation functionality
  const [validatingAbsence, setValidatingAbsence] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationComment, setValidationComment] = useState('');
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load absences from localStorage
    loadAbsenceData();
    
    // Load trainees data
    loadTraineesData();
    
    // Setup localStorage change detection
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  const handleStorageChange = (e) => {
    if (e.key === 'absenceRecords' || e.key === 'studentAbsences') {
      loadAbsenceData();
    }
    if (e.key === 'traineesData') {
      loadTraineesData();
    }
  };
  
  const loadAbsenceData = () => {
    try {
      // Load class-based absence records
      const recordsJson = localStorage.getItem('absenceRecords') || '[]';
      const records = JSON.parse(recordsJson);
      setAbsenceRecords(records);
      
      // Load student-specific absence records
      const studentAbsencesJson = localStorage.getItem('studentAbsences') || '{}';
      const studentAbs = JSON.parse(studentAbsencesJson);
      setStudentAbsences(studentAbs);
      
      // Create flattened view of all individual student absences
      const flattened = [];
      
      // Process each student's absences
      Object.keys(studentAbs).forEach(cef => {
        const studentAbsenceList = studentAbs[cef] || [];
        studentAbsenceList.forEach(absence => {
          flattened.push({
            ...absence,
            cef
          });
        });
      });
      
      // Sort by date (most recent first)
      flattened.sort((a, b) => new Date(b.date) - new Date(a.date));
      setFlattenedAbsences(flattened);
      
      // Initially show all records
      setFilteredRecords(records);
      
      // Extract all unique groups from records
      const groups = [...new Set(records.map(record => record.groupe))].filter(Boolean);
      setAvailableGroups(groups.sort());
      
      setLoading(false);
    } catch (e) {
      console.error('Error loading absence data:', e);
      setError('Une erreur est survenue lors du chargement des données d\'absence');
      setLoading(false);
    }
  };
  
  const loadTraineesData = () => {
    try {
      const traineesJson = localStorage.getItem('traineesData') || '[]';
      const parsedTrainees = JSON.parse(traineesJson);
      setTrainees(parsedTrainees);
    } catch (e) {
      console.error('Error loading trainees data:', e);
    }
  };
  
  // Function to find trainee data by CEF
  const getTraineeData = (cef) => {
    return trainees.find(t => t.cef === cef || t.CEF === cef) || { 
      name: 'Inconnu', 
      first_name: '', 
      class: 'Inconnu' 
    };
  };
  
  // Function to apply period filter to dates
  const isDateInSelectedPeriod = (dateStr) => {
    if (timePeriod === 'all') return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    
    if (timePeriod === 'today') {
      return date.getTime() === today.getTime();
    }
    
    if (timePeriod === 'week') {
      // Get start of current week (Monday)
      const startOfWeek = new Date(today);
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      return date >= startOfWeek && date <= today;
    }
    
    if (timePeriod === 'month') {
      // Get start of current month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return date >= startOfMonth && date <= today;
    }
    
    return true;
  };
  
  const filterAbsences = () => {
    // Start with all absences
    let filtered = flattenedAbsences;
    
    // Apply date filter if specified
    if (filterDate) {
      filtered = filtered.filter(absence => 
        absence.date === filterDate
      );
    }
    
    // Apply group filter if specified
    if (filterGroup) {
      filtered = filtered.filter(absence => 
        absence.groupe === filterGroup
      );
    }
    
    // Apply status filter if not "all"
    if (statusFilter !== "all") {
      filtered = filtered.filter(absence => 
        absence.status === statusFilter
      );
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(absence => {
        // Get trainee data
        const trainee = getTraineeData(absence.cef);
        
        // Search in different fields
        return (
          (trainee.name && trainee.name.toLowerCase().includes(term)) ||
          (trainee.first_name && trainee.first_name.toLowerCase().includes(term)) ||
          (absence.cef && absence.cef.toString().toLowerCase().includes(term)) ||
          (absence.teacher && absence.teacher.toLowerCase().includes(term)) ||
          (absence.groupe && absence.groupe.toLowerCase().includes(term))
        );
      });
    }
    
    return filtered;
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleDateFilter = (e) => {
    setFilterDate(e.target.value);
  };
  
  const handleGroupFilter = (e) => {
    setFilterGroup(e.target.value);
  };
  
  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };
  
  const handleClearFilters = () => {
    setFilterDate("");
    setFilterGroup("");
    setSearchTerm("");
    setStatusFilter("all");
  };
  
  const handleViewStudentAbsences = (trainee) => {
    // Get absences for this student
    const cef = trainee.cef || trainee.CEF;
    const absences = studentAbsences[cef] || [];
    
    // Sort by date (newest first)
    const sortedAbsences = [...absences].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    // Save data to localStorage for the details page to access
    localStorage.setItem('selectedTraineeDetails', JSON.stringify(trainee));
    localStorage.setItem('traineeAbsenceHistory', JSON.stringify(sortedAbsences));
    
    // Generate absence calendar
    const calendarData = generateAbsenceCalendar(sortedAbsences);
    localStorage.setItem('traineeAbsenceCalendar', JSON.stringify(calendarData));
    
    // Navigate to the details page
    navigate(`/sg/trainee-details/${cef}`);
  };
  
  // Generate absence calendar from absences (copied from ManageTrainees)
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
  
  const handleCloseModal = () => {
    setShowAbsenceModal(false);
    setSelectedTrainee(null);
    setTraineeAbsences([]);
  };
  
  const handleBack = () => {  
    navigate("/sg/gerer-stagiaires");
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };
  
  // Get counts of absences by status
  const getAbsenceStats = () => {
    // Always return zero for absence stats
    return { totalAbsent: 0, totalLate: 0 };
  };
  
  const { totalAbsent, totalLate } = getAbsenceStats();
  
  // Calculate total absence hours for a student
  const calculateTotalAbsenceHours = (absences) => {
    if (!absences || absences.length === 0) return 0;
    
    // Calculate actual hours instead of returning 0
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
    const absenceHours = calculateTotalAbsenceHours(
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
  
  // Add this new function to handle validation
  const handleValidateAbsence = (absence) => {
    setValidatingAbsence(absence);
    setShowValidationModal(true);
  };
  
  // Add this function to save the validated absence
  const saveValidatedAbsence = () => {
    if (!validatingAbsence) return;
    
    // Get all absences from localStorage
    const storedAbsences = JSON.parse(localStorage.getItem('absences') || '[]');
    
    // Find and update the specific absence
    const updatedAbsences = storedAbsences.map(abs => {
      if (abs.id === validatingAbsence.id || 
          (abs.studentCEF === validatingAbsence.studentCEF && 
           abs.date === validatingAbsence.date && 
           abs.startTime === validatingAbsence.startTime)) {
        return {
          ...abs,
          isValidated: true,
          validatedBy: 'SG', // Could be replaced with actual SG name/ID
          validationDate: new Date().toISOString(),
          validationComment: validationComment,
        };
      }
      return abs;
    });
    
    // Save back to localStorage
    localStorage.setItem('absences', JSON.stringify(updatedAbsences));
    
    // Update the state
    setAbsenceRecords(updatedAbsences);
    filterAbsences();
    
    // Close the modal
    setShowValidationModal(false);
    setValidatingAbsence(null);
    setValidationComment('');
  };
  
  // Add a special function to reset all absence data
  const resetAllAbsenceData = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir réinitialiser TOUTES les absences à zéro? Cette action est irréversible!')) {
      return;
    }
    
    try {
      // Show loading state
      setLoading(true);
      
      // Skip API call that's causing the error and directly reset localStorage
      
      // Clear all localStorage related to absences
      localStorage.removeItem('absenceRecords');
      localStorage.removeItem('studentAbsences');
      localStorage.removeItem('absences');
      localStorage.removeItem('traineeAbsenceHistory');
      localStorage.removeItem('traineeAbsenceCalendar');
      
      // Update traineesData to ensure all absence_count values are 0
      const traineesJSON = localStorage.getItem('traineesData') || '[]';
      try {
        const trainees = JSON.parse(traineesJSON);
        
        // Update all absence_count values to 0
        const updatedTrainees = trainees.map(trainee => ({
          ...trainee,
          absence_count: 0
        }));
        
        // Save back to localStorage
        localStorage.setItem('traineesData', JSON.stringify(updatedTrainees));
        localStorage.setItem('lastDataImport', new Date().toISOString());
      } catch (error) {
        console.error('Error updating trainees data:', error);
      }
      
      // Initialize new empty absence data
      const traineesData = JSON.parse(localStorage.getItem('traineesData') || '[]');
      const emptyAbsences = {};
      traineesData.forEach(trainee => {
        const cef = trainee.cef || trainee.CEF;
        if (cef) {
          emptyAbsences[cef] = [];
        }
      });
      localStorage.setItem('studentAbsences', JSON.stringify(emptyAbsences));
      
      // Show success message
      alert('Toutes les absences ont été réinitialisées à zéro avec succès!');
      
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error resetting absence data:', error);
      alert('Erreur lors de la réinitialisation des absences: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Add a new function to handle bulk validation of all absences
  const handleBulkValidation = () => {
    const confirmValidation = window.confirm(
      "Êtes-vous sûr de vouloir valider toutes les absences affichées? Cette action mettra à jour les heures totales et les notes de discipline pour tous les stagiaires concernés."
    );
    
    if (!confirmValidation) return;
    
    setBulkValidating(true);
    
    try {
      // Get filtered absences to validate
      const absencesToValidate = filterAbsences();
      
      // Get all trainees data
      const traineesJSON = localStorage.getItem('traineesData') || '[]';
      const trainees = JSON.parse(traineesJSON);
      
      // Create a map to track which trainees need updates
      const traineesToUpdate = new Map();
      
      // Process each absence
      absencesToValidate.forEach(absence => {
        const cef = absence.cef;
        if (!cef) return;
        
        // Find the trainee by CEF
        const traineeIndex = trainees.findIndex(t => (t.cef === cef || t.CEF === cef));
        if (traineeIndex === -1) return;
        
        // If we haven't processed this trainee yet, initialize their data
        if (!traineesToUpdate.has(cef)) {
          // Get all absences for this trainee
          const traineeAbsences = studentAbsences[cef] || [];
          
          // Calculate actual hours and disciplinary note
          const absenceHours = calculateTotalAbsenceHours(traineeAbsences);
          const disciplinaryNote = calculateDisciplinaryNote(traineeAbsences);
          
          traineesToUpdate.set(cef, {
            index: traineeIndex,
            absenceHours: absenceHours,
            disciplinaryNote: disciplinaryNote,
            formattedNote: `Note de discipline: ${disciplinaryNote}/20`
          });
        }
        
        // Mark the absence as validated
        absence.isValidated = true;
        absence.validatedBy = 'SG';
        absence.validationDate = new Date().toISOString();
      });
      
      // Update the trainees data with new absence hours and notes
      traineesToUpdate.forEach((data, cef) => {
        trainees[data.index].absence_hours = data.absenceHours;
        trainees[data.index].disciplinary_note = data.formattedNote;
      });
      
      // Save updated trainees data
      localStorage.setItem('traineesData', JSON.stringify(trainees));
      
      // Update the student absences in localStorage
      const studentAbsencesJSON = localStorage.getItem('studentAbsences') || '{}';
      const updatedStudentAbsences = JSON.parse(studentAbsencesJSON);
      
      // Update each trainee's absences with validation status
      absencesToValidate.forEach(absence => {
        const cef = absence.cef;
        if (!cef || !updatedStudentAbsences[cef]) return;
        
        // Find and update the specific absence
        updatedStudentAbsences[cef] = updatedStudentAbsences[cef].map(abs => {
          if (abs.date === absence.date && abs.startTime === absence.startTime) {
            return {
              ...abs,
              isValidated: true,
              validatedBy: 'SG',
              validationDate: new Date().toISOString()
            };
          }
          return abs;
        });
      });
      
      // Save updated absences
      localStorage.setItem('studentAbsences', JSON.stringify(updatedStudentAbsences));
      
      // Update state
      setStudentAbsences(updatedStudentAbsences);
      
      // Reload data
      loadAbsenceData();
      loadTraineesData();
      
      // Show success message
      alert('Toutes les absences ont été validées avec succès! Les heures totales et notes de discipline ont été mises à jour.');
    } catch (error) {
      console.error('Error validating absences:', error);
      alert('Une erreur est survenue lors de la validation des absences: ' + error.message);
    } finally {
      setBulkValidating(false);
    }
  };
  
  return (
    <div className="absence-sg-container">
      <h2 className="page-title">Gestion des Absences</h2>
      
      {/* Add the reset button */}
      <div className="reset-container">
        <button 
          className="reset-all-button"
          onClick={resetAllAbsenceData}
          disabled={loading}
        >
          {loading ? 'Réinitialisation en cours...' : 'Réinitialiser toutes les absences à zéro'}
        </button>
        
        <button 
          className="validate-all-button"
          onClick={handleBulkValidation}
          disabled={loading || bulkValidating}
        >
          {bulkValidating ? 'Validation en cours...' : 'Valider toutes les absences affichées'}
        </button>
      </div>
      
      <button className="back-button" onClick={handleBack}>
        ⬅ Retour
      </button>
      
      {/* Stats cards */}
      <div className="stats-container">
        <div className="stat-card absent">
          <h3>Total des Absences</h3>
          <div className="stat-value">{totalAbsent}</div>
        </div>
        <div className="stat-card late">
          <h3>Total des Retards</h3>
          <div className="stat-value">{totalLate}</div>
        </div>
      </div>
      
      {/* New table filters layout */}
      <div className="table-filters">
        <div className="filter-left">
          <label htmlFor="group-filter">Groupe:</label>
          <select 
            id="group-filter"
            value={filterGroup}
            onChange={handleGroupFilter}
            className="select-input"
          >
            <option value="">Tous les groupes</option>
            {availableGroups.map((group, index) => (
              <option key={index} value={group}>{group}</option>
            ))}
          </select>
          
          <label htmlFor="status-filter" className="status-label">Statut:</label>
          <select 
            id="status-filter"
            value={statusFilter}
            onChange={handleStatusFilter}
            className="select-input"
          >
            <option value="all">Tous les statuts</option>
            <option value="absent">Absents</option>
            <option value="late">Retards</option>
            <option value="present">Présents</option>
          </select>
        </div>
        
        <div className="filter-right">
          <label htmlFor="date-filter">Date:</label>
          <input 
            type="date" 
            id="date-filter"
            value={filterDate}
            onChange={handleDateFilter}
            className="date-input"
          />
          
          <label htmlFor="search-input" className="search-label">Recherche:</label>
          <input 
            type="text"
            id="search-input"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Nom, CEF, classe..."
            className="search-input"
          />
          
          <button className="clear-button" onClick={handleClearFilters}>
            Réinitialiser
          </button>
        </div>
      </div>
      
      {/* Absence records table - modify to combine name columns */}
      {loading ? (
        <div className="loading-message">Chargement des données d'absence...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="table-container">
          {filterAbsences().length === 0 ? (
            <div className="no-data-message">
              Aucun enregistrement d'absence trouvé
              {filterDate || filterGroup || searchTerm ? " avec les filtres sélectionnés" : ""}.
            </div>
          ) : (
            <table className="absence-table">
              <thead>
                <tr>
                  <th>CEF</th>
                  <th>Nom et Prénom</th>
                  <th>Groupe</th>
                  <th>Date</th>
                  <th>Horaire</th>
                  <th>Heures</th>
                  <th>Statut</th>
                  <th>Formateur</th>
                  <th>Validé</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterAbsences().map((absence, index) => {
                  const traineeData = getTraineeData(absence.cef);
                  const hoursValue = 0;
                  
                  return (
                    <tr
                      key={index}
                      className={`status-row-${absence.status}`}
                    >
                      <td>{absence.cef}</td>
                      <td>{traineeData?.name || 'N/A'} {traineeData?.first_name || ''}</td>
                      <td>{traineeData?.class || 'N/A'}</td>
                      <td>{formatDate(absence.date)}</td>
                      <td>{absence.startTime} - {absence.endTime}</td>
                      <td>{hoursValue}</td>
                      <td>
                        <span className={`status-badge ${absence.status}`}>
                          {absence.status === 'absent' && 'Absent'}
                          {absence.status === 'late' && 'Retard'}
                          {absence.status === 'present' && 'Présent'}
                        </span>
                      </td>
                      <td>{absence.teacher || 'Non spécifié'}</td>
                      <td>
                        <span className={`validation-badge ${absence.isValidated ? 'validated' : 'not-validated'}`}>
                          {absence.isValidated ? 'Validé' : 'Non validé'}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <button 
                          className="view-details-btn"
                          onClick={() => handleViewStudentAbsences(traineeData)}
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {/* Student absences modal */}
      {showAbsenceModal && selectedTrainee && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Absences de l'élève</h2>
              <button className="close-button" onClick={handleCloseModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="student-info">
                <div className="info-row">
                  <div className="info-item">
                    <strong>CEF:</strong> {selectedTrainee.cef || selectedTrainee.CEF}
                  </div>
                  <div className="info-item">
                    <strong>Groupe:</strong> {selectedTrainee.class || selectedTrainee.GROUPE}
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-item">
                    <strong>Nom:</strong> {selectedTrainee.name || selectedTrainee.NOM}
                  </div>
                  <div className="info-item">
                    <strong>Prénom:</strong> {selectedTrainee.first_name || selectedTrainee.PRENOM}
                  </div>
                </div>
              </div>
              
              <div className="absence-history">
                <h3>Historique des Absences</h3>
                
                {traineeAbsences.length > 0 ? (
                  <table className="student-absences-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Horaire</th>
                        <th>Statut</th>
                        <th>Formateur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {traineeAbsences.map((absence, index) => (
                        <tr key={index} className={`status-${absence.status}`}>
                          <td>{formatDate(absence.date)}</td>
                          <td>{absence.startTime} - {absence.endTime}</td>
                          <td>
                            <span className={`status-badge ${absence.status}`}>
                              {absence.status === 'absent' && 'Absent'}
                              {absence.status === 'late' && 'Retard'}
                              {absence.status === 'present' && 'Présent'}
                            </span>
                          </td>
                          <td>{absence.teacher || 'Non spécifié'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-absences-message">
                    Aucune absence enregistrée pour cet élève.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* New Validation Modal */}
      {showValidationModal && validatingAbsence && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Valider l'absence</h2>
              <button className="close-button" onClick={() => setShowValidationModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="validation-info">
                <h3>Informations de l'absence</h3>
                <div className="info-row">
                  <div className="info-item">
                    <strong>CEF:</strong> {validatingAbsence.cef}
                  </div>
                  <div className="info-item">
                    <strong>Étudiant:</strong> {getTraineeData(validatingAbsence.cef)?.name} {getTraineeData(validatingAbsence.cef)?.first_name}
                  </div>
                  <div className="info-item">
                    <strong>Groupe:</strong> {getTraineeData(validatingAbsence.cef)?.class}
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-item">
                    <strong>Date:</strong> {formatDate(validatingAbsence.date)}
                  </div>
                  <div className="info-item">
                    <strong>Horaire:</strong> {validatingAbsence.startTime} - {validatingAbsence.endTime}
                  </div>
                  <div className="info-item">
                    <strong>Statut:</strong> {validatingAbsence.status === 'absent' ? 'Absent' : validatingAbsence.status === 'late' ? 'Retard' : 'Présent'}
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-item">
                    <strong>Formateur:</strong> {validatingAbsence.teacher || 'Non spécifié'}
                  </div>
                </div>
                
                <div className="comment-section">
                  <label htmlFor="validation-comment">Commentaire de validation:</label>
                  <textarea
                    id="validation-comment"
                    className="validation-comment"
                    value={validationComment}
                    onChange={(e) => setValidationComment(e.target.value)}
                    placeholder="Ajoutez vos remarques ici..."
                    rows={3}
                  />
                </div>
                
                <div className="validation-actions">
                  <button
                    className="cancel-btn"
                    onClick={() => setShowValidationModal(false)}
                  >
                    Annuler
                  </button>
                  <button
                    className="confirm-btn"
                    onClick={saveValidatedAbsence}
                  >
                    Confirmer la validation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .absence-sg-container {
          padding: var(--space-5);
          max-width: 1300px;
          margin: 0 auto;
          background-color: var(--gray-100);
        }
        
        .page-title {
          font-size: var(--font-size-2xl);
          color: var(--primary-dark);
          margin-bottom: var(--space-5);
          text-align: center;
          font-weight: 600;
        }
        
        .back-button {
          background-color: var(--gray-200);
          border: none;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          cursor: pointer;
          margin-bottom: var(--space-5);
          display: flex;
          align-items: center;
          font-size: var(--font-size-sm);
          transition: var(--transition-fast);
        }
        
        .back-button:hover {
          background-color: var(--gray-300);
          transform: translateX(-3px);
        }
        
        .stats-container {
          display: flex;
          gap: var(--space-5);
          margin-bottom: var(--space-6);
        }
        
        .stat-card {
          flex: 1;
          background-color: var(--white);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          box-shadow: var(--shadow-md);
          text-align: center;
          transition: var(--transition-normal);
        }
        
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        
        .stat-card.absent {
          border-left: 5px solid var(--danger);
        }
        
        .stat-card.late {
          border-left: 5px solid var(--warning);
        }
        
        .stat-card h3 {
          font-size: var(--font-size-md);
          margin-bottom: var(--space-3);
          color: var(--gray-700);
          font-weight: 500;
        }
        
        .stat-value {
          font-size: var(--font-size-3xl);
          font-weight: bold;
          color: var(--gray-900);
        }
        
        .filters-container {
          background-color: var(--white);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          margin-bottom: var(--space-5);
          box-shadow: var(--shadow-md);
        }
        
        .filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-3);
          align-items: flex-end;
        }
        
        .filter-item {
          flex: 1;
          min-width: 150px;
        }
        
        .filter-item label {
          display: block;
          margin-bottom: var(--space-2);
          font-weight: 500;
          color: var(--gray-700);
          font-size: var(--font-size-sm);
        }
        
        .date-input, .select-input, .search-input {
          width: 100%;
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          transition: var(--transition-fast);
        }
        
        .date-input:focus, .select-input:focus, .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(57, 73, 171, 0.1);
        }
        
        .search-container {
          flex: 2;
        }
        
        .clear-button {
          background-color: var(--gray-200);
          border: 1px solid var(--gray-300);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--font-size-sm);
          height: 38px;
          display: flex;
          align-items: center;
          transition: var(--transition-fast);
        }
        
        .clear-button:hover {
          background-color: var(--gray-300);
        }
        
        .table-container {
          background-color: var(--white);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          box-shadow: var(--shadow-md);
          overflow-x: auto;
        }
        
        .absence-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .absence-table th, .absence-table td {
          padding: var(--space-3) var(--space-4);
          text-align: left;
          border-bottom: 1px solid var(--gray-200);
        }
        
        .absence-table th {
          background-color: var(--primary);
          color: var(--white);
          font-weight: 600;
          position: sticky;
          top: 0;
        }
        
        .absence-table th:first-child {
          border-top-left-radius: var(--radius-md);
        }
        
        .absence-table th:last-child {
          border-top-right-radius: var(--radius-md);
        }
        
        .absence-table tr:hover {
          background-color: var(--gray-100);
        }
        
        .status-row-absent {
          background-color: var(--danger-bg);
        }
        
        .status-row-late {
          background-color: var(--warning-bg);
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
          border: 1px solid var(--danger-light);
        }
        
        .status-badge.late {
          background-color: var(--warning-bg);
          color: var(--warning);
          border: 1px solid var(--warning-light);
        }
        
        .status-badge.present {
          background-color: var(--success-bg);
          color: var(--success);
          border: 1px solid var(--success-light);
        }
        
        .view-details-btn {
          background-color: var(--primary);
          color: var(--white);
          border: none;
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--font-size-xs);
          transition: var(--transition-fast);
        }
        
        .view-details-btn:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
        }
        
        .loading-message, .error-message, .no-data-message {
          padding: var(--space-6);
          text-align: center;
          color: var(--gray-600);
          background-color: var(--gray-100);
          border-radius: var(--radius-lg);
        }
        
        .error-message {
          color: var(--danger);
        }
        
        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-content {
          background-color: var(--white);
          border-radius: var(--radius-lg);
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-xl);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--gray-200);
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: var(--font-size-xl);
          color: var(--primary-dark);
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: var(--font-size-2xl);
          cursor: pointer;
          color: var(--gray-500);
          transition: var(--transition-fast);
        }
        
        .close-button:hover {
          color: var(--danger);
        }
        
        .modal-body {
          padding: var(--space-5);
        }
        
        .student-info {
          margin-bottom: var(--space-5);
          background-color: var(--gray-100);
          padding: var(--space-4);
          border-radius: var(--radius-md);
        }
        
        .info-row {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-5);
          margin-bottom: var(--space-3);
        }
        
        .info-item {
          flex: 1;
          min-width: 200px;
        }
        
        .info-item strong {
          color: var(--gray-700);
          margin-right: var(--space-2);
        }
        
        .absence-history h3 {
          margin-bottom: var(--space-4);
          font-size: var(--font-size-lg);
          color: var(--primary-dark);
        }
        
        .student-absences-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .student-absences-table th {
          background-color: var(--gray-200);
          padding: var(--space-3);
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid var(--gray-300);
          color: var(--gray-800);
        }
        
        .student-absences-table td {
          padding: var(--space-2) var(--space-3);
          border-bottom: 1px solid var(--gray-200);
        }
        
        .no-absences-message {
          padding: var(--space-4);
          background-color: var(--gray-100);
          border-radius: var(--radius-md);
          color: var(--gray-600);
          text-align: center;
        }
        
        .action-buttons {
          display: flex;
          gap: var(--space-2);
        }
        
        .validate-btn {
          background-color: var(--success);
          color: var(--white);
          border: none;
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--font-size-xs);
          transition: var(--transition-fast);
        }
        
        .validate-btn:hover {
          background-color: var(--success-dark);
          transform: translateY(-2px);
        }
        
        .validation-badge {
          display: inline-block;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-md);
          font-size: var(--font-size-xs);
          font-weight: 500;
        }
        
        .validation-badge.validated {
          background-color: var(--success-bg);
          color: var(--success);
          border: 1px solid var(--success-light);
        }
        
        .validation-badge.not-validated {
          background-color: var(--gray-100);
          color: var(--gray-600);
          border: 1px solid var(--gray-300);
        }
        
        .validation-info {
          margin-bottom: var(--space-5);
        }
        
        .validation-info h3 {
          margin-bottom: var(--space-4);
          font-size: var(--font-size-lg);
          color: var(--primary-dark);
        }
        
        .comment-section {
          margin-top: var(--space-4);
        }
        
        .comment-section label {
          display: block;
          margin-bottom: var(--space-2);
          font-weight: 500;
          color: var(--gray-700);
        }
        
        .validation-comment {
          width: 100%;
          padding: var(--space-3);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          resize: vertical;
          margin-bottom: var(--space-4);
          transition: var(--transition-fast);
        }
        
        .validation-comment:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(57, 73, 171, 0.1);
        }
        
        .validation-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-3);
        }
        
        .cancel-btn {
          background-color: var(--gray-200);
          border: 1px solid var(--gray-300);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--font-size-sm);
          transition: var(--transition-fast);
        }
        
        .cancel-btn:hover {
          background-color: var(--gray-300);
        }
        
        .confirm-btn {
          background-color: var(--success);
          color: var(--white);
          border: none;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--font-size-sm);
          transition: var(--transition-fast);
        }
        
        .confirm-btn:hover {
          background-color: var(--success-dark);
        }
        
        .reset-container {
          margin-bottom: 20px;
          text-align: center;
          display: flex;
          justify-content: center;
          gap: 16px;
        }
        
        .reset-all-button {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .reset-all-button:hover {
          background-color: #c82333;
        }
        
        .reset-all-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        .validate-all-button {
          background-color: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .validate-all-button:hover {
          background-color: #218838;
        }
        
        .validate-all-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .stats-container {
            flex-direction: column;
            gap: var(--space-3);
          }
          
          .filter-item {
            flex: 100%;
            min-width: 100%;
          }
          
          .clear-button {
            width: 100%;
          }
          
          .absence-table {
            font-size: var(--font-size-xs);
          }
          
          .absence-table th, .absence-table td {
            padding: var(--space-2);
          }
          
          .view-details-btn {
            width: 100%;
          }
          
          .action-buttons {
            flex-direction: column;
            gap: var(--space-1);
          }
          
          .validation-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AbsenceSGPage;
