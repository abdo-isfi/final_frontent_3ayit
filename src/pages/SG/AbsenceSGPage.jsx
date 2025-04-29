import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../images/Logo-OFPPT.jpg"
import "../../index.css";
import "../../styles/Absence.css";
import { Modal } from "react-bootstrap";

// Add custom styles with media queries for action buttons
const actionButtonsStyles = `
  @media (max-width: 768px) {
    .action-buttons {
      min-width: 250px !important;
    }
    
    .action-buttons button {
      padding: 5px 6px !important;
      font-size: 0.75rem !important;
      min-width: 75px !important;
    }
  }

  @media (max-width: 576px) {
    .action-buttons {
      min-width: 220px !important;
    }
    
    .action-buttons button {
      padding: 4px 5px !important;
      font-size: 0.7rem !important;
      min-width: 65px !important;
    }
  }
`;

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
  
  // Add day of week state
  const [dayOfWeek, setDayOfWeek] = useState("");
  
  // Selected trainee for detail view
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [traineeAbsences, setTraineeAbsences] = useState([]);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  
  // New state for validation functionality
  const [validatingAbsence, setValidatingAbsence] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationComment, setValidationComment] = useState('');
  // Add justified state
  const [isJustified, setIsJustified] = useState(false);
  const [justificationComment, setJustificationComment] = useState('');
  
  // Add filter for justified status
  const [justifiedFilter, setJustifiedFilter] = useState("all"); // "all", "justified", "not_justified"
  
  // Add new state for editing functionality
  const [editingAbsence, setEditingAbsence] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  
  // Add state for billet d'entrée
  const [showBilletEntreeFilter, setShowBilletEntreeFilter] = useState(false);
  const [hasBilletEntree, setHasBilletEntree] = useState(false);
  
  // First, add state for toast notifications at the top with other state variables
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Add state for validation confirmation modal
  const [showValidationConfirm, setShowValidationConfirm] = useState(false);
  
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
  
  useEffect(() => {
    const handleFocus = () => {
      loadAbsenceData();
      loadTraineesData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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
          // Ensure all required fields exist
          const processedAbsence = {
            ...absence,
            cef,
            isValidated: absence.isValidated !== undefined ? absence.isValidated : false,
            isJustified: absence.isJustified !== undefined ? absence.isJustified : false,
            hasBilletEntree: absence.hasBilletEntree !== undefined ? absence.hasBilletEntree : false
          };
          flattened.push(processedAbsence);
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
  
  // Simplified filtering function - no period filter
  const filterAbsences = () => {
    // Start with all absences
    let filtered = flattenedAbsences;
    
    // Require group selection - show empty table if no group selected
    if (!filterGroup) {
      return [];
    }
    
    // Apply group filter
    filtered = filtered.filter(absence => 
      absence.groupe === filterGroup
    );
    
    // Apply date filter if specified
    if (filterDate) {
      filtered = filtered.filter(absence => 
        absence.date === filterDate
      );
    }
    
    // Apply status filter if not "all"
    if (statusFilter !== "all") {
      filtered = filtered.filter(absence => 
        absence.status === statusFilter
      );
    }
    
    // Apply justified status filter if not "all"
    if (justifiedFilter !== "all") {
      if (justifiedFilter === "justified") {
        filtered = filtered.filter(absence => absence.isJustified === true);
      } else if (justifiedFilter === "not_justified") {
        filtered = filtered.filter(absence => 
          (absence.status === 'absent') && 
          (absence.isJustified === false || absence.isJustified === undefined)
        );
      }
    }
    
    // Apply billet d'entrée filter if enabled
    if (showBilletEntreeFilter) {
      filtered = filtered.filter(absence => 
        (absence.status === 'absent') && 
        (!absence.hasBilletEntree || absence.hasBilletEntree === false)
      );
    }
    
    // Apply search filter - only search by name and CEF
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(absence => {
        // Get trainee data
        const trainee = getTraineeData(absence.cef);
        
        // Search only in name and CEF fields
        return (
          (trainee.name && trainee.name.toLowerCase().includes(term)) ||
          (trainee.first_name && trainee.first_name.toLowerCase().includes(term)) ||
          (absence.cef && absence.cef.toString().toLowerCase().includes(term))
        );
      });
    }
    
    // If date filter is not applied, only show one entry per trainee (the most recent)
    if (!filterDate) {
      // Group absences by trainee CEF
      const traineeAbsences = {};
      
      filtered.forEach(absence => {
        if (!traineeAbsences[absence.cef] || 
            new Date(absence.date) > new Date(traineeAbsences[absence.cef].date)) {
          traineeAbsences[absence.cef] = absence;
        }
      });
      
      // Convert back to array
      filtered = Object.values(traineeAbsences);
    } else {
      // If date filter is applied, just remove exact duplicates (same cef, date, status)
      const uniqueMap = new Map();
      
      filtered.forEach(absence => {
        const key = `${absence.cef}_${absence.date}_${absence.status}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, absence);
        }
      });
      
      filtered = Array.from(uniqueMap.values());
    }
    
    return filtered;
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleDateFilter = (e) => {
    const date = e.target.value;
    setFilterDate(date);
    
    // Update day of week when date changes
    if (date) {
      setDayOfWeek(getDayOfWeek(date));
    } else {
      setDayOfWeek("");
    }
  };
  
  const handleGroupFilter = (e) => {
    const group = e.target.value;
    setFilterGroup(group);
    
    // Just set the group in state, but don't actually filter yet
    // This will wait for the user to click the filter button
    
    // Show toast indicating the group selection
    if (group) {
      setToast({
        show: true,
        message: `Groupe "${group}" sélectionné. Cliquez sur Filtrer pour afficher les résultats.`,
        type: 'info'
      });
    }
  };
  
  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };
  
  const handleClearFilters = () => {
    setFilterDate("");
    setFilterGroup("");
    setSearchTerm("");
    setStatusFilter("all");
    setJustifiedFilter("all");
    
    // Reset billet filter if it's active
    if (showBilletEntreeFilter) {
      setShowBilletEntreeFilter(false);
    }
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
  
  // Update the getAbsenceStats function to calculate actual absences for the selected group
  const getAbsenceStats = () => {
    // If no group is selected, return zeros
    if (!filterGroup) {
      return { totalAbsent: 0, totalLate: 0 };
    }
    
    // Get all absences for the selected group
    const groupAbsences = flattenedAbsences.filter(absence => absence.groupe === filterGroup);
    
    // Count absent and late statuses
    const totalAbsent = groupAbsences.filter(absence => absence.status === 'absent').length;
    const totalLate = groupAbsences.filter(absence => absence.status === 'late').length;
    
    return { totalAbsent, totalLate };
  };
  
  // Recalculate stats when the filter group changes
  useEffect(() => {
    // This will trigger a re-render with updated stats when group filter changes
    const stats = getAbsenceStats();
    // We don't need to store this in state, the function will recalculate when needed
  }, [filterGroup, flattenedAbsences]);
  
  const { totalAbsent, totalLate } = getAbsenceStats();
  
  // Calculate total absence hours for a student
  const calculateTotalAbsenceHours = (absences) => {
    if (!absences || absences.length === 0) return 0;
    
    // Calculate actual hours instead of returning 0
    let totalHours = 0;
    
    // Count lateness occurrences
    const lateArrivals = absences.filter(absence => absence.status === 'late').length;
    
    absences.forEach(absence => {
      if (absence.status === 'absent') {
        // Skip counting hours if the absence is justified
        if (absence.isJustified) {
          return;
        }
        
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
        // Only count lateness hours if the student has been late 4 or more times
        if (lateArrivals >= 4) {
          totalHours += 1; // Count as 1 hour after 4 lateness occurrences
        }
        // Otherwise, lateness doesn't add to total hours (0 hours)
      }
    });
    
    return Math.round(totalHours * 10) / 10; // Round to 1 decimal place
  };
  
  // Calculate hours for a single absence record
  const calculateAbsenceHours = (absence) => {
    if (!absence) return 0;
    
    if (absence.status === 'present') {
      return 0; // Present students have 0 hours
    }
    
    if (absence.status === 'absent') {
      // Return 0 hours if the absence is justified
      if (absence.isJustified) {
        return 0;
      }
      
      // Check if we have start and end times
      if (absence.startTime && absence.endTime) {
        // Check for half-day absences based on time range
        const start = absence.startTime.split(':').map(Number);
        const end = absence.endTime.split(':').map(Number);
        
        if (start.length >= 2 && end.length >= 2) {
          const startHour = start[0];
          const endHour = end[0];
          const hoursDiff = endHour - startHour;
          
          // Determine if it's a half-day or full-day absence
          if (hoursDiff <= 3) {
            return 2.5; // Half-day absence (2.5 hours)
          } else {
            return 5; // Full-day absence (5 hours)
          }
        }
      }
      
      // Default to full-day if no time information
      return 5;
    } else if (absence.status === 'late') {
      // Count lateness instances for this student
      const cef = absence.cef;
      if (cef) {
        // Get all absences for this student
        const studentAbs = studentAbsences[cef] || [];
        // Count lateness occurrences
        const lateCount = studentAbs.filter(a => a.status === 'late').length;
        
        // Only count hours if student has been late 4 or more times
        if (lateCount >= 4) {
          return lateCount; // Return the number of lateness occurrences as a tally mark
        } else {
          return 0; // No hours counted for fewer than 4 lateness occurrences
        }
      }
      return 0; // Default to 0 if no student info available
    }
    
    return 0; // Default case
  };
  
  // Calculate disciplinary note based on absences and lateness
  const calculateDisciplinaryNote = (absences) => {
    if (!absences || absences.length === 0) return 20; // Start with 20 points
    
    // Count total absence hours - only for unjustified absences
    const absenceHours = calculateTotalAbsenceHours(
      absences.filter(a => a.status === 'absent' && !a.isJustified)
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
  
  // Modify handleValidateAbsence to only be used for absences
  const handleValidateAbsence = (absence) => {
    // Only allow justification for absences
    if (absence.status !== 'absent') {
      setToast({
        show: true,
        message: "Seules les absences peuvent être justifiées",
        type: 'error'
      });
      return;
    }
    
    setValidatingAbsence(absence);
    setShowValidationModal(true);
    // Initialize justified status from the absence if it exists
    setIsJustified(absence.isJustified || false);
    setJustificationComment(absence.justificationComment || '');
    setHasBilletEntree(absence.hasBilletEntree || false);
  };
  
  // Rename saveValidatedAbsence to saveJustification to better reflect its purpose
  const saveJustification = () => {
    if (!validatingAbsence) return;
    
    try {
      // Get student absences from localStorage
      const studentAbsencesJSON = localStorage.getItem('studentAbsences') || '{}';
      const updatedStudentAbsences = JSON.parse(studentAbsencesJSON);
      
      const cef = validatingAbsence.cef;
      if (!cef || !updatedStudentAbsences[cef]) {
        throw new Error("Absence introuvable dans le système");
      }
      
      // Update the specific absence in the student's absence array
      let absenceUpdated = false;
      updatedStudentAbsences[cef] = updatedStudentAbsences[cef].map(abs => {
        if (abs.date === validatingAbsence.date && 
            abs.startTime === validatingAbsence.startTime && 
            abs.status === 'absent') {
          absenceUpdated = true;
          return {
            ...abs,
            isJustified: isJustified,
            justificationComment: justificationComment,
            justifiedDate: new Date().toISOString(),
            justifiedBy: 'SG',
            hasBilletEntree: hasBilletEntree
          };
        }
        return abs;
      });
      
      if (!absenceUpdated) {
        throw new Error("Impossible de trouver l'absence spécifique à justifier");
      }
      
      // Save updated absences back to localStorage
      localStorage.setItem('studentAbsences', JSON.stringify(updatedStudentAbsences));
      
      // Also update the absenceRecords to keep data consistent
      const absenceRecordsJSON = localStorage.getItem('absenceRecords') || '[]';
      const absenceRecords = JSON.parse(absenceRecordsJSON);
      
      // Find and update the absence record
      for (let i = 0; i < absenceRecords.length; i++) {
        const record = absenceRecords[i];
        if (record.date === validatingAbsence.date &&
            record.startTime === validatingAbsence.startTime &&
            record.groupe === validatingAbsence.groupe) {
          
          // Update the student status in the students array
          record.students = record.students.map(student => {
            if (student.cef === cef) {
              return {
                ...student,
                isJustified: isJustified,
                justificationComment: justificationComment,
                justifiedDate: new Date().toISOString(),
                justifiedBy: 'SG',
                hasBilletEntree: hasBilletEntree
              };
            }
            return student;
          });
          
          break;
        }
      }
      
      // Save updated records back to localStorage
      localStorage.setItem('absenceRecords', JSON.stringify(absenceRecords));
      
      // Update state
      setStudentAbsences(updatedStudentAbsences);
      
      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('storage'));
      
      // Reload data to reflect changes
      loadAbsenceData();
      
      // Show success toast
      setToast({
        show: true,
        message: `Absence ${isJustified ? 'justifiée' : 'non justifiée'} avec succès!`,
        type: 'success'
      });
      
      // Close the modal
      setShowValidationModal(false);
      setValidatingAbsence(null);
      setValidationComment('');
      setIsJustified(false);
      setJustificationComment('');
      setHasBilletEntree(false);
    } catch (error) {
      console.error("Erreur lors de la justification de l'absence:", error);
      setToast({
        show: true,
        message: "Une erreur est survenue lors de la justification: " + error.message,
        type: 'error'
      });
    }
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
      
      // Show success toast
      setToast({
        show: true,
        message: 'Toutes les absences ont été réinitialisées à zéro avec succès!',
        type: 'success'
      });
      
      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error resetting absence data:', error);
      setToast({
        show: true,
        message: 'Erreur lors de la réinitialisation des absences: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Modify handleBulkValidation to handleBulkJustification
  const handleBulkJustification = () => {
    // First ask whether absences are justified or not
    const isJustified = window.confirm(
      "Ces absences sont-elles justifiées? Cliquez sur OK pour les marquer comme justifiées, ou Annuler pour les marquer comme non justifiées."
    );
    
    const confirmValidation = window.confirm(
      `Êtes-vous sûr de vouloir marquer toutes les absences affichées comme ${isJustified ? 'justifiées' : 'non justifiées'}?`
    );
    
    if (!confirmValidation) return;
    
    setBulkValidating(true);
    
    try {
      // Get filtered absences to justify - ONLY ABSENCES
      const absencesToJustify = filterAbsences().filter(absence => absence.status === 'absent');
      
      if (absencesToJustify.length === 0) {
        setToast({
          show: true,
          message: "Aucune absence à justifier dans les résultats filtrés.",
          type: 'warning'
        });
        setBulkValidating(false);
        return;
      }
      
      // Get student absences from localStorage
      const studentAbsencesJSON = localStorage.getItem('studentAbsences') || '{}';
      const updatedStudentAbsences = JSON.parse(studentAbsencesJSON);
      
      // Get absence records to update them as well
      const absenceRecordsJSON = localStorage.getItem('absenceRecords') || '[]';
      const absenceRecords = JSON.parse(absenceRecordsJSON);
      
      // Track how many absences were updated
      let updatedCount = 0;
      
      // Process each absence
      absencesToJustify.forEach(absence => {
        const cef = absence.cef;
        if (!cef || !updatedStudentAbsences[cef]) return;
        
        // Update absence in the student's absence array
        updatedStudentAbsences[cef] = updatedStudentAbsences[cef].map(abs => {
          if (abs.date === absence.date && abs.startTime === absence.startTime && abs.status === 'absent') {
            updatedCount++;
            return {
              ...abs,
              isJustified: isJustified,
              justificationComment: isJustified ? 'Justification en masse' : 'Non justifiée',
              justifiedDate: new Date().toISOString(),
              justifiedBy: 'SG',
              hasBilletEntree: absence.hasBilletEntree || false
            };
          }
          return abs;
        });
        
        // Also update the corresponding absence record
        for (let i = 0; i < absenceRecords.length; i++) {
          const record = absenceRecords[i];
          if (record.date === absence.date && 
              record.startTime === absence.startTime &&
              record.groupe === absence.groupe) {
            
            // Update the student status in the students array
            record.students = record.students.map(student => {
              if (student.cef === cef) {
                return {
                  ...student,
                  isJustified: isJustified,
                  justificationComment: isJustified ? 'Justification en masse' : 'Non justifiée',
                  justifiedDate: new Date().toISOString(),
                  justifiedBy: 'SG',
                  hasBilletEntree: absence.hasBilletEntree || false
                };
              }
              return student;
            });
            
            break;
          }
        }
      });
      
      // Save updated absences back to localStorage
      localStorage.setItem('studentAbsences', JSON.stringify(updatedStudentAbsences));
      localStorage.setItem('absenceRecords', JSON.stringify(absenceRecords));
      
      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('storage'));
      
      // Reload data to reflect changes
      loadAbsenceData();
      
      // Show success toast
      setToast({
        show: true,
        message: `${updatedCount} absence(s) ${isJustified ? 'justifiées' : 'non justifiées'} avec succès!`,
        type: 'success'
      });
      
      setBulkValidating(false);
    } catch (error) {
      console.error('Error during bulk justification:', error);
      setToast({
        show: true,
        message: 'Une erreur est survenue lors de la justification en masse: ' + error.message,
        type: 'error'
      });
      setBulkValidating(false);
    }
  };
  
  // Update handleBulkValidation to use the modal and validate all absences for the selected group/session
  const handleBulkValidation = () => {
    setShowValidationConfirm(true);
  };
  
  const confirmBulkValidation = () => {
    setBulkValidating(true);
    setShowValidationConfirm(false);
    try {
      // Get all absences currently displayed in the table based on the filters
      const filteredResults = filterAbsences();
      
      if (filteredResults.length === 0) {
        setToast({
          show: true,
          message: "Aucune absence à valider dans les résultats filtrés.",
          type: 'warning'
        });
        setBulkValidating(false);
        return;
      }
      
      // Get student absences from localStorage
      const studentAbsencesJSON = localStorage.getItem('studentAbsences') || '{}';
      const updatedStudentAbsences = JSON.parse(studentAbsencesJSON);
      
      // Track how many absences were updated
      let validatedCount = 0;
      
      // Process all filtered absences
      for (const absence of filteredResults) {
        const cef = absence.cef;
        if (!cef || !updatedStudentAbsences[cef]) continue;
        
        // Update the specific absence record
        updatedStudentAbsences[cef] = updatedStudentAbsences[cef].map(abs => {
          if (abs.date === absence.date && abs.startTime === absence.startTime) {
            validatedCount++;
            // Calculate hours based on status
            let absenceHours = '-';
            if (abs.status === 'absent') {
              // For absent students, calculate hours using the utility function or default to 4
              absenceHours = calculateAbsenceHours(abs) || 4;
            } else if (abs.status === 'late') {
              // For late students, check if they have excessive latenesses
              const lateCount = countStudentLatenesses(cef);
              if (lateCount >= 3) {
                absenceHours = 2; // Convert excessive latenesses to absence hours
              } else {
                absenceHours = '-';
              }
            }
            
            return {
              ...abs,
              isValidated: true, // Mark as validated
              validatedDate: new Date().toISOString(),
              validatedBy: 'SG',
              absenceHours: absenceHours
            };
          }
          return abs;
        });
      }
      
      // Save updated absences back to localStorage
      localStorage.setItem('studentAbsences', JSON.stringify(updatedStudentAbsences));
      
      // Now also update the absenceRecords for consistency
      const absenceRecordsJSON = localStorage.getItem('absenceRecords') || '[]';
      const absenceRecords = JSON.parse(absenceRecordsJSON);
      
      // Update the relevant absence records with validation status
      for (const record of absenceRecords) {
        // If a date filter is applied, only update records for that date
        if (filterDate && record.date !== filterDate) continue;
        
        // Otherwise, only update records for the selected group
        if (record.groupe === filterGroup) {
          record.isValidated = true;
          record.validatedDate = new Date().toISOString();
          record.validatedBy = 'SG';
          
          // Also update individual student statuses
          if (record.students && Array.isArray(record.students)) {
            record.students = record.students.map(student => {
              const cef = student.cef;
              if (!cef) return student;
              
              // Find matching student absence
              const studentAbs = filteredResults.find(abs => abs.cef === cef && abs.date === record.date);
              if (studentAbs) {
                let absenceHours = '-';
                if (student.status === 'absent') {
                  absenceHours = 4; // Default absent hours
                } else if (student.status === 'late') {
                  const lateCount = countStudentLatenesses(cef);
                  if (lateCount >= 3) {
                    absenceHours = 2;
                  }
                }
                
                return {
                  ...student,
                  isValidated: true,
                  validatedDate: new Date().toISOString(),
                  validatedBy: 'SG',
                  absenceHours: absenceHours
                };
              }
              return student;
            });
          }
        }
      }
      
      localStorage.setItem('absenceRecords', JSON.stringify(absenceRecords));
      
      // Trigger storage event for other tabs
      window.dispatchEvent(new Event('storage'));
      
      // Reload data to reflect changes
      loadAbsenceData();
      
      // Show success toast
      setToast({
        show: true,
        message: `${validatedCount} absence(s) validée(s) avec succès!`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error during bulk validation:', error);
      setToast({
        show: true,
        message: "Une erreur est survenue lors de la validation en masse: " + error.message,
        type: 'error'
      });
    } finally {
      setBulkValidating(false);
    }
  };
  
  // Function to get day of week in French
  const getDayOfWeek = (dateString) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    const days = [
      "Dimanche", "Lundi", "Mardi", "Mercredi", 
      "Jeudi", "Vendredi", "Samedi"
    ];
    
    return days[date.getDay()];
  };
  
  // Update day of week when date changes
  useEffect(() => {
    setDayOfWeek(getDayOfWeek(filterDate));
  }, [filterDate]);
  
  // Add a function to get the teacher name for the current group
  const getTeacherForGroup = () => {
    const filtered = filterAbsences();
    
    // If no absences or no group selected, return default
    if (filtered.length === 0 || !filterGroup) {
      return "Non spécifié";
    }
    
    // Find the most common teacher for this group
    const teacherCount = {};
    
    filtered.forEach(absence => {
      if (absence.teacher) {
        teacherCount[absence.teacher] = (teacherCount[absence.teacher] || 0) + 1;
      }
    });
    
    // Find the most frequent teacher
    let mostCommonTeacher = "Non spécifié";
    let maxCount = 0;
    
    Object.entries(teacherCount).forEach(([teacher, count]) => {
      if (count > maxCount) {
        mostCommonTeacher = teacher;
        maxCount = count;
      }
    });
    
    return mostCommonTeacher;
  };
  
  // Add a function to extract horaires from filtered absences
  const getHorairesFromAbsences = () => {
    const filtered = filterAbsences();
    
    // If no absences or no group selected, return default
    if (filtered.length === 0 || !filterGroup) {
      return "8:30 - 13:30";
    }
    
    // Find the most common start and end times
    const timeRanges = {};
    
    filtered.forEach(absence => {
      if (absence.startTime && absence.endTime) {
        const timeKey = `${absence.startTime} - ${absence.endTime}`;
        timeRanges[timeKey] = (timeRanges[timeKey] || 0) + 1;
      }
    });
    
    // Find the most frequent time range
    let mostCommonRange = "8:30 - 13:30"; // Default
    let maxCount = 0;
    
    Object.entries(timeRanges).forEach(([range, count]) => {
      if (count > maxCount) {
        mostCommonRange = range;
        maxCount = count;
      }
    });
    
    return mostCommonRange;
  };
  
  // Add a function to get the start and end dates of the current week
  const getWeekDates = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate the date of Monday (first day of week)
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    
    // Calculate the date of Saturday (last day of week)
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    
    return {
      start: monday,
      end: saturday,
      formattedStart: monday.toLocaleDateString('fr-FR'),
      formattedEnd: saturday.toLocaleDateString('fr-FR')
    };
  };
  
  // Add a function to prepare absence data for the weekly report
  const prepareWeeklyReport = (groupName) => {
    // If no group is selected, return empty data
    if (!groupName) return { trainees: [], weekDays: [] };
    
    // Get week dates
    const weekDates = getWeekDates();
    
    // Get all trainees for the selected group
    const groupTrainees = trainees.filter(trainee => 
      trainee.class === groupName
    ).sort((a, b) => a.name.localeCompare(b.name));
    
    // Create array of weekdays with dates (Monday to Saturday)
    const weekDays = [];
    
    // Fixed day names - Always starting with Monday as "LUN" regardless of current day
    const dayNames = ["LUN", "MAR", "MERC", "JEU", "VEN", "SAM"];
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(weekDates.start);
      date.setDate(weekDates.start.getDate() + i);
      
      weekDays.push({
        name: dayNames[i],
        date: date,
        formattedDate: date.toLocaleDateString('fr-FR')
      });
    }
    
    // Prepare data for each trainee with their absences for each day
    const traineesWithAbsences = groupTrainees.map(trainee => {
      const cef = trainee.cef || trainee.CEF;
      const absences = studentAbsences[cef] || [];
      
      // Organize absences by date
      const absencesByDate = {};
      absences.forEach(absence => {
        if (!absence.date) return;
        
        const absenceDate = new Date(absence.date);
        // Format date as string key
        const dateKey = absenceDate.toISOString().split('T')[0];
        
        if (!absencesByDate[dateKey]) {
          absencesByDate[dateKey] = [];
        }
        
        absencesByDate[dateKey].push(absence);
      });
      
      // For each weekday, check if trainee was absent
      const dailyAbsences = weekDays.map(day => {
        const dateKey = day.date.toISOString().split('T')[0];
        const dayAbsences = absencesByDate[dateKey] || [];
        
        return {
          date: dateKey,
          absences: dayAbsences,
          isAbsent: dayAbsences.some(abs => abs.status === 'absent'),
          isLate: dayAbsences.some(abs => abs.status === 'late')
        };
      });
      
      return {
        ...trainee,
        weekAbsences: dailyAbsences
      };
    });
    
    return {
      trainees: traineesWithAbsences,
      weekDays,
      groupName,
      weekDates
    };
  };
  
  // Add a function to get full filière name based on code
  const getFullFiliereName = (codeFiliere) => {
    if (!codeFiliere) return '-';
    
    // Extract the base code (before any dash)
    const baseCode = codeFiliere.split('-')[0].toLowerCase();
    
    switch(baseCode) {
      case 'dev':
        return 'Développement Digital';
      case 'devowfs':
        return 'Développement Digital Option Web Full Stack';
      case 'id':
        return 'Infrastructure Digital';
      case 'idosr':
        return 'Infrastructure Digital Option Système Réseau';
      default:
        return codeFiliere;
    }
  };
  
  // Update the HTML generation to more closely match the example document
  const generateWeeklyReport = () => {
    if (!filterGroup) {
      alert('Veuillez sélectionner un groupe pour générer le rapport');
      return;
    }
    
    const reportData = prepareWeeklyReport(filterGroup);
    
    // Create HTML content for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres pop-up pour l'impression");
      return;
    }
    
    // Get the week date information
    const weekInfo = getWeekDates();
    
    // Get the full filière name
    const filiereCode = reportData.trainees[0]?.class?.split('-')[0] || '-';
    const filiereName = getFullFiliereName(filiereCode);
    
    // Get the current academic year
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    
    // Generate HTML content optimized for A4 paper in portrait mode
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Feuille d'Absence - ${reportData.groupName}</title>
        <style>
          /* A4 optimization - PORTRAIT MODE */
          @page {
            size: A4 portrait;
            margin: 0.5cm;
          }
          
          html, body {
            width: 210mm;  /* A4 width in portrait */
            height: 297mm; /* A4 height in portrait */
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 11px;
          }
          
          .page {
            width: 100%;
            box-sizing: border-box;
            padding: 0.5cm;
            page-break-after: always;
          }
          
          /* Table styles */
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          
          table.main-table {
            border: 1px solid #000;
            margin-top: 10px;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 4px 2px;
            text-align: center;
            font-size: 10px;
            height: 20px;
          }
          
          th {
            background-color: #ffffff;
            font-weight: bold;
          }
          
          /* Header styles with left-aligned logo */
          .header {
            position: relative;
            text-align: center;
            margin-bottom: 15px;
          }
          
          .logo-container {
            position: absolute;
            top: 0;
            left: 0;
          }
          
          .logo-container img {
            height: 45px;
          }
          
          .header-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .header-subtitle {
            font-size: 14px;
            font-weight: bold;
          }
          
          /* Info section */
          .info-section {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
          }
          
          .info-left, .info-right {
            width: 48%;
          }
          
          .info-item {
            display: flex;
            margin-bottom: 5px;
          }
          
          .info-label {
            font-weight: bold;
            margin-right: 5px;
          }
          
          .info-value {
            text-decoration: underline;
          }
          
          /* Content styles */
          .name-cell {
            text-align: left;
            padding-left: 5px;
          }
          
          .num-cell {
            width: 30px;
          }
          
          .name-column {
            width: 180px;
          }
          
          .day-cell {
            width: auto;
            font-weight: bold;
          }
          
          /* Signature area */
          .signatures {
            margin-top: 15px;
          }
          
          .signatures table {
            margin-top: 10px;
            border: 1px solid #000;
          }
          
          .signature-row td {
            height: 30px;
          }
          
          .signature-line {
            margin-top: 20px;
          }
          
          /* Print optimization */
          @media print {
            html, body {
              width: 210mm;
              height: 297mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="logo-container">
              <img src="${logo}" alt="OFPPT Logo">
            </div>
            <div class="header-title">FEUILLE D'ABSENCE HEBDOMADAIRE</div>
            <div class="header-subtitle">INSTITUT SPECIALISE DE TECHNOLOGIE APPLIQUEE NTIC BENI MELLAL</div>
          </div>
          
          <div class="info-section">
            <div class="info-left">
              <div class="info-item">
                <div class="info-label">Filière :</div>
                <div class="info-value">${filiereName} (${filiereCode})</div>
              </div>
              <div class="info-item">
                <div class="info-label">Groupe :</div>
                <div class="info-value">${reportData.groupName}</div>
              </div>
            </div>
            <div class="info-right">
              <div class="info-item">
                <div class="info-label">Année de Formation :</div>
                <div class="info-value">${academicYear}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Semaine du :</div>
                <div class="info-value">${weekInfo.formattedStart} au ${weekInfo.formattedEnd}</div>
              </div>
            </div>
          </div>
          
          <table class="main-table">
            <thead>
              <tr>
                <th rowspan="2" class="num-cell">N°</th>
                <th rowspan="2" class="name-column">Nom & Prénom</th>
                ${reportData.weekDays.map(day => `
                  <th colspan="4" class="day-cell">${day.name}</th>
                `).join('')}
              </tr>
              <tr>
                ${reportData.weekDays.map(() => `
                  <th>M1</th><th>M2</th><th>S1</th><th>S2</th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${reportData.trainees.map((trainee, index) => {
                const fullName = `${trainee.name || trainee.NOM || ''} ${trainee.first_name || trainee.PRENOM || ''}`;
                
                return `
                  <tr>
                    <td class="num-cell">${index + 1}</td>
                    <td class="name-cell">${fullName}</td>
                    ${reportData.weekDays.map(day => {
                      // Find absences for this day
                      const dayAbsence = trainee.weekAbsences.find(abs => abs.date === day.date.toISOString().split('T')[0]);
                      
                      // Generate cells for M1, M2, S1, S2
                      let cells = '';
                      for (let i = 0; i < 4; i++) {
                        const period = i === 0 ? 'M1' : i === 1 ? 'M2' : i === 2 ? 'S1' : 'S2';
                        let marker = '';
                        
                        // If there are absences for this day, check if any match this period
                        if (dayAbsence) {
                          const dayAbsencesList = dayAbsence.absences;
                          
                          // Check for 5-hour morning absence (should mark both M1 and M2)
                          const morningAbsence = dayAbsencesList.find(a => 
                            a.status === 'absent' && 
                            !a.isJustified &&
                            (a.absenceHours === 5 || a.absenceHours === '5' || a.absenceHours >= 4) &&
                            a.startTime === '08:30'
                          );
                          
                          // Check for 5-hour afternoon absence (should mark both S1 and S2)
                          const afternoonAbsence = dayAbsencesList.find(a => 
                            a.status === 'absent' && 
                            !a.isJustified &&
                            (a.absenceHours === 5 || a.absenceHours === '5' || a.absenceHours >= 4) &&
                            a.startTime === '13:30'
                          );
                          
                          // Check for 2.5-hour morning absence (should mark only M1)
                          const halfMorningAbsence = dayAbsencesList.find(a => 
                            a.status === 'absent' && 
                            !a.isJustified &&
                            (a.absenceHours === 2.5 || a.absenceHours === '2.5') &&
                            a.startTime === '08:30'
                          );
                          
                          // Check for 2.5-hour afternoon absence (should mark only S1)
                          const halfAfternoonAbsence = dayAbsencesList.find(a => 
                            a.status === 'absent' && 
                            !a.isJustified &&
                            (a.absenceHours === 2.5 || a.absenceHours === '2.5') &&
                            a.startTime === '13:30'
                          );
                          
                          // Check for lateness
                          const latenessRecord = dayAbsencesList.find(a => 
                            a.status === 'late'
                          );
                          
                          // Apply the proper marker based on the period and absence type
                          if ((period === 'M1' || period === 'M2') && morningAbsence) {
                            // 5-hour morning absence marks both M1 and M2
                            marker = 'X';
                          } else if ((period === 'S1' || period === 'S2') && afternoonAbsence) {
                            // 5-hour afternoon absence marks both S1 and S2
                            marker = 'X';
                          } else if (period === 'M1' && halfMorningAbsence) {
                            // 2.5-hour morning absence marks only M1
                            marker = 'X';
                          } else if (period === 'S1' && halfAfternoonAbsence) {
                            // 2.5-hour afternoon absence marks only S1
                            marker = 'X';
                          } else if (period === 'M1' && latenessRecord && latenessRecord.startTime === '08:30') {
                            // Lateness in morning
                            marker = 'R';
                          } else if (period === 'S1' && latenessRecord && latenessRecord.startTime === '13:30') {
                            // Lateness in afternoon
                            marker = 'R';
                          }
                        }
                        
                        cells += `<td>${marker}</td>`;
                      }
                      
                      return cells;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 20px;">
            <div style="display: flex;">
              <div style="margin-right: 5px; font-weight: bold;">Surveillant Général:</div>
              <div style="flex-grow: 1; border-bottom: 1px solid #000;">&nbsp;</div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Imprimer</button>
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
    }, 300);
  };
  
  // Add function to count lateness for a specific student
  const countStudentLatenesses = (cef) => {
    if (!cef || !studentAbsences[cef]) return 0;
    return studentAbsences[cef].filter(a => a.status === 'late').length;
  };
  
  // Add new function to handle edit absence
  const handleEditAbsence = (absence) => {
    setEditingAbsence(absence);
    setEditStatus(absence.status);
    setShowEditModal(true);
  };
  
  // Function to save edited absence
  const saveEditedAbsence = () => {
    if (!editingAbsence) return;
    
    try {
      // Get all student absences from localStorage
      const studentAbsencesJSON = localStorage.getItem('studentAbsences') || '{}';
      const updatedStudentAbsences = JSON.parse(studentAbsencesJSON);
      
      const cef = editingAbsence.cef;
      if (!cef || !updatedStudentAbsences[cef]) {
        throw new Error("Impossible de trouver les données d'absence pour cet étudiant");
      }
      
      // Find and update the specific absence
      updatedStudentAbsences[cef] = updatedStudentAbsences[cef].map(abs => {
        if (abs.date === editingAbsence.date && 
            abs.startTime === editingAbsence.startTime &&
            abs.endTime === editingAbsence.endTime) {
          return {
            ...abs,
            status: editStatus,
            editedBy: 'SG',
            editDate: new Date().toISOString(),
            originalStatus: abs.originalStatus || abs.status // Keep track of original status
          };
        }
        return abs;
      });
      
      // Get all class-based absence records
      const recordsJson = localStorage.getItem('absenceRecords') || '[]';
      const records = JSON.parse(recordsJson);
      
      // Find and update the specific class record if it exists
      const updatedRecords = records.map(record => {
        if (record.date === editingAbsence.date && record.groupe === editingAbsence.groupe) {
          // Find and update the specific student in the students array
          if (record.students) {
            record.students = record.students.map(student => {
              if (student.cef === cef || student.CEF === cef) {
                return { 
                  ...student, 
                  status: editStatus,
                  editedBy: 'SG',
                  editDate: new Date().toISOString(),
                  originalStatus: student.originalStatus || student.status
                };
              }
              return student;
            });
          }
        }
        return record;
      });
      
      // Save updated absences back to localStorage
      localStorage.setItem('studentAbsences', JSON.stringify(updatedStudentAbsences));
      localStorage.setItem('absenceRecords', JSON.stringify(updatedRecords));
      
      // Update state
      setStudentAbsences(updatedStudentAbsences);
      setAbsenceRecords(updatedRecords);
      
      // Reload data to reflect changes
      loadAbsenceData();
      
      // Show success toast instead of alert
      setToast({
        show: true,
        message: `Le statut a été modifié de "${editingAbsence.status}" à "${editStatus}" avec succès!`,
        type: 'success'
      });
      
      // Close the modal
      setShowEditModal(false);
      setEditingAbsence(null);
      setEditStatus('');
    } catch (error) {
      console.error("Erreur lors de la modification de l'absence:", error);
      setToast({
        show: true,
        message: "Une erreur est survenue lors de la modification de l'absence: " + error.message,
        type: 'error'
      });
    }
  };
  
  // Add a function to hide the toast after a delay
  const hideToast = () => {
    setToast({ ...toast, show: false });
  };
  
  // Use useEffect to automatically hide the toast after a delay
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        hideToast();
      }, 5000); // Hide after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [toast.show]);
  
  // Add handler for justified filter
  const handleJustifiedFilter = (e) => {
    setJustifiedFilter(e.target.value);
  };
  
  // Add handler for billet d'entrée filter toggle
  const handleBilletFilterToggle = () => {
    setShowBilletEntreeFilter(!showBilletEntreeFilter);
    
    // If turning on the filter, make sure we're showing only absent status
    if (!showBilletEntreeFilter) {
      setStatusFilter("absent");
    }
    
    // Show toast notification about filter change
    setToast({
      show: true,
      message: !showBilletEntreeFilter 
        ? "Affichage des stagiaires sans billet d'entrée uniquement" 
        : "Filtre de billet d'entrée désactivé",
      type: 'success'
    });
  };
  
  // Add new function to apply filters when button is clicked
  const applyFilters = () => {
    // Do the filtering here
    const filtered = filterAbsences();
    
    // Show a toast message with the results
    setToast({
      show: true,
      message: filtered.length > 0 
        ? `${filtered.length} résultats trouvés avec les filtres appliqués.` 
        : "Aucun résultat ne correspond aux filtres sélectionnés.",
      type: filtered.length > 0 ? 'success' : 'warning'
    });
  };
  
  return (
    <div className="absence-sg-container">
      {/* Add the style tag to inject the CSS */}
      <style dangerouslySetInnerHTML={{ __html: actionButtonsStyles }} />
      
      <h2 className="page-title">Gestion des Absences</h2>
      
      {/* Add the reset button */}
      <div className="reset-container">
        <button 
          className="bulk-action-button"
          onClick={resetAllAbsenceData}
          disabled={loading}
        >
          {loading ? 'Réinitialisation en cours...' : 'Réinitialiser toutes les absences à zéro'}
        </button>
        
        <button 
          className="bulk-action-button bulk-validate-button"
          onClick={handleBulkValidation}
          disabled={!filterGroup || bulkValidating}
        >
          {bulkValidating ? 'Validation en cours...' : 'Valider toutes les absences affichées'}
        </button>
        
        <button 
          className="bulk-action-button"
          onClick={generateWeeklyReport}
          disabled={!filterGroup}
        >
          Télécharger feuille d'absence hebdomadaire
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
          <div className="stat-subtitle">{filterGroup ? `Groupe: ${filterGroup}` : 'Aucun groupe sélectionné'}</div>
        </div>
        <div className="stat-card late">
          <h3>Total des Retards</h3>
          <div className="stat-value">{totalLate}</div>
          <div className="stat-subtitle">{filterGroup ? `Groupe: ${filterGroup}` : 'Aucun groupe sélectionné'}</div>
        </div>
      </div>
      
      {/* Filters - redesigned to a single horizontal row */}
      <div className="table-filters">
        <div className="filter-row">
          <div className="filter-group">
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
          </div>
          
          <div className="filter-group">
            <label htmlFor="date-filter">Date:</label>
            <input 
              type="date" 
              id="date-filter"
              value={filterDate}
              onChange={handleDateFilter}
              className="date-input"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="status-filter">Statut:</label>
            <select 
              id="status-filter"
              value={statusFilter}
              onChange={handleStatusFilter}
              className="select-input"
            >
              <option value="all">Tous les statuts</option>
              <option value="absent">Absent</option>
              <option value="late">Retard</option>
              <option value="present">Présent</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="justified-filter">Justification:</label>
            <select 
              id="justified-filter"
              value={justifiedFilter}
              onChange={handleJustifiedFilter}
              className="select-input"
            >
              <option value="all">Toutes</option>
              <option value="justified">Justifiées</option>
              <option value="not_justified">Non justifiées</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="search-input">Recherche:</label>
            <input 
              type="text"
              id="search-input"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Recherche par nom ou CEF..."
              className="search-input"
            />
          </div>
          
          {/* Day of week display */}
          <div className="filter-group day-of-week">
            <label>Jour:</label>
            <div className="day-display">
              {dayOfWeek || "---"}
            </div>
          </div>
          
          {/* Keep only the Filter button, remove Réinitialiser and Sans billet d'entrée */}
          <div className="filter-actions">
            <button 
              className="filter-button" 
              onClick={applyFilters}
              style={{
                backgroundColor: '#2196F3',
                color: 'white',
                fontWeight: 'bold',
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
            >
              <i className="fas fa-filter" style={{ marginRight: '5px' }}></i> Filtrer
            </button>
          </div>
        </div>
      </div>
      
      {/* Add selected filters display above table */}
      {loading ? (
        <div className="loading-message">Chargement des données d'absence...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div>
          <div className="selected-filters">
            <div className="filter-display">
              <span className="filter-label">Groupe sélectionné:</span>
              <span className="filter-value">{filterGroup || 'Veuillez sélectionner un groupe'}</span>
            </div>
            <div className="filter-display">
              <span className="filter-label">Formateur:</span>
              <span className="filter-value">{getTeacherForGroup()}</span>
            </div>
            <div className="filter-display">
              <span className="filter-label">Horaires:</span>
              <span className="filter-value">{getHorairesFromAbsences()}</span>
            </div>
          </div>
          
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
                    <th>Heures</th>
                    <th>Statut</th>
                    <th>Validé</th>
                    <th>Justifié</th>
                    <th>Billet</th>
                    <th style={{ minWidth: '220px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Use the filtered absences directly instead of trying to recreate the list
                    const filteredResults = filterAbsences();
                    
                    if (filteredResults.length === 0) {
                      return null;
                    }
                    
                    return filteredResults.map((absence, index) => {
                      const trainee = getTraineeData(absence.cef);
                      
                      return (
                        <tr key={`${absence.cef}-${absence.date}-${index}`}>
                          <td>{absence.cef}</td>
                          <td>{trainee.name} {trainee.first_name}</td>
                          <td>
                            {absence.status === 'present' ? '0h' :
                             absence.status === 'late' ? 
                              (calculateAbsenceHours(absence) > 0 ? `${calculateAbsenceHours(absence)}` : '0h') :
                             absence.status === 'absent' ? 
                              (absence.isJustified ? '0h' : `${calculateAbsenceHours(absence)}h`) : 
                              '-'}
                          </td>
                          <td>
                            <span className={`status-badge ${absence.status}`}>
                              {absence.status === 'absent' && 'Absent'}
                              {absence.status === 'late' && 'Retard'}
                              {absence.status === 'present' && 'Présent'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`validation-status ${absence.isValidated ? 'validated' : 'not-validated'}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: absence.isValidated ? '#27ae60' : '#999',
                                color: 'white',
                                fontSize: '16px'
                              }}
                            >
                              {absence.isValidated ? '✓' : '✗'}
                            </span>
                          </td>
                          <td>
                            <span 
                              className={`validation-status ${absence.isJustified ? 'justified' : 'not-justified'}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: absence.isJustified ? '#27ae60' : (absence.status === 'absent' ? '#e74c3c' : '#999'),
                                color: 'white',
                                fontSize: '16px'
                              }}
                            >
                              {absence.isJustified ? '✓' : '✗'}
                            </span>
                          </td>
                          <td>
                            <span 
                              className={`validation-status ${absence.hasBilletEntree ? 'has-billet' : 'no-billet'}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: absence.hasBilletEntree ? '#27ae60' : (absence.status === 'absent' ? '#f39c12' : '#999'),
                                color: 'white',
                                fontSize: '16px'
                              }}
                            >
                              {absence.hasBilletEntree ? '✓' : '✗'}
                            </span>
                          </td>
                          <td className="action-buttons" style={{ 
                            display: 'flex', 
                            flexDirection: 'row', 
                            flexWrap: 'nowrap',
                            gap: '4px', 
                            justifyContent: 'flex-start',
                            minWidth: '280px'
                          }}>
                            {absence.status === 'absent' && 
                              <button 
                                className="validate-button"
                                onClick={() => handleValidateAbsence(absence)}
                                title="Justifier l'absence"
                                style={{
                                  backgroundColor: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '6px 8px',
                                  fontWeight: 'bold',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                  flex: '1',
                                  minWidth: '85px',
                                  textTransform: 'uppercase',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {absence.isJustified ? 'Modifier' : 'Justifier'}
                              </button>
                            }
                            <button 
                              className="view-button"
                              onClick={() => handleViewStudentAbsences(trainee)}
                              title="Voir les détails"
                              style={{
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 8px',
                                fontWeight: 'bold',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                flex: '1',
                                minWidth: '85px',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Détails
                            </button>
                            <button 
                              className="edit-button"
                              onClick={() => handleEditAbsence(absence)}
                              title="Modifier le statut"
                              style={{
                                backgroundColor: '#9C27B0',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 8px',
                                fontWeight: 'bold',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                flex: '1',
                                minWidth: '85px',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Modifier
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>            )}
          </div>
        </div>
      )}
      
      {showValidationModal && validatingAbsence && (
        <Modal show={showValidationModal} onHide={() => setShowValidationModal(false)} centered dialogClassName="justify-modal-dialog">
          <Modal.Header closeButton style={{ borderBottom: '1px solid #e5e5e5', background: '#f8f9fa' }}>
            <Modal.Title style={{ fontWeight: 'bold', fontSize: '1.3rem', color: '#2c3e50' }}>Validation de l'absence</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '28px 32px 20px 32px', background: '#fcfcfc', borderRadius: '0 0 8px 8px', boxShadow: '0 2px 16px rgba(44,62,80,0.07)', fontSize: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
            <div className="validation-details" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: 16 }}>
                <h3 style={{ fontSize: '1.15rem', color: '#2980b9', marginBottom: 12 }}>Informations de l'absence</h3>
                <div className="info-row" style={{ display: 'flex', gap: 24, marginBottom: 8, fontSize: '1rem' }}>
                  <div className="info-item"><strong>CEF:</strong> {validatingAbsence.cef}</div>
                  <div className="info-item"><strong>Étudiant:</strong> {getTraineeData(validatingAbsence.cef)?.name} {getTraineeData(validatingAbsence.cef)?.first_name}</div>
                </div>
                <div className="info-row" style={{ display: 'flex', gap: 24, fontSize: '1rem' }}>
                  <div className="info-item"><strong>Date:</strong> {formatDate(validatingAbsence.date)}</div>
                  <div className="info-item"><strong>Statut:</strong> <span className={`status-badge ${validatingAbsence.status}`}>{validatingAbsence.status === 'absent' && 'Absent'}{validatingAbsence.status === 'late' && 'Retard'}{validatingAbsence.status === 'present' && 'Présent'}</span></div>
                </div>
              </div>
              <div className="justification-section" style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: 16 }}>
                <h3 style={{ fontSize: '1.08rem', color: '#16a085', marginBottom: 10 }}>Justification</h3>
                <div className="justify-options" style={{ display: 'flex', gap: 32, marginBottom: 10 }}>
                  <label className="justify-option" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
                    <input type="radio" name="justifiedStatus" checked={isJustified === true} onChange={() => setIsJustified(true)} />
                    <span className="justify-label">Absence justifiée</span>
                  </label>
                  <label className="justify-option" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
                    <input type="radio" name="justifiedStatus" checked={isJustified === false} onChange={() => setIsJustified(false)} />
                    <span className="justify-label">Absence non justifiée</span>
                  </label>
                </div>
                {isJustified && (
                  <div className="justification-comment-section" style={{ marginTop: 10 }}>
                    <label htmlFor="justification-comment" style={{ fontWeight: 500, color: '#555', fontSize: '1rem' }}>Raison de la justification:</label>
                    <textarea id="justification-comment" className="justification-comment" value={justificationComment} onChange={(e) => setJustificationComment(e.target.value)} placeholder="Précisez la raison de la justification (certificat médical, etc.)" rows={2} style={{ width: '100%', marginTop: 6, borderRadius: 4, border: '1px solid #d1d5db', padding: 8, fontSize: '1rem' }} />
                  </div>
                )}
              </div>
              <div className="billet-entree-section" style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: 16, background: '#f6fafd', borderRadius: 6, padding: '12px 10px', marginTop: 8 }}>
                <label className="billet-option" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
                  <input type="checkbox" checked={hasBilletEntree} onChange={(e) => setHasBilletEntree(e.target.checked)} />
                  <span className="billet-label">Billet d'entrée fourni</span>
                </label>
                <p className="billet-info" style={{ color: '#888', fontSize: '0.97rem', marginTop: 4, marginBottom: 0 }}>
                  Cochez si l'élève a présenté un billet d'entrée à l'enseignant
                </p>
              </div>
              <div className="comment-section" style={{ marginBottom: 0, marginTop: 8 }}>
                <label htmlFor="validation-comment" style={{ fontWeight: 500, color: '#555', fontSize: '1rem' }}>Commentaire de validation:</label>
                <textarea id="validation-comment" className="validation-comment" value={validationComment} onChange={(e) => setValidationComment(e.target.value)} placeholder="Ajoutez vos remarques ici..." rows={3} style={{ width: '100%', marginTop: 6, borderRadius: 4, border: '1px solid #d1d5db', padding: 8, fontSize: '1rem' }} />
              </div>
            </div>
          </Modal.Body>
          <div style={{ background: '#f8f9fa', borderTop: '1px solid #e5e5e5', padding: '16px 32px', display: 'flex', justifyContent: 'flex-end', gap: 14, borderRadius: '0 0 8px 8px', position: 'sticky', bottom: 0, zIndex: 10 }}>
            <button className="cancel-btn" style={{ background: '#e0e0e0', color: '#333', border: 'none', borderRadius: 4, padding: '8px 24px', fontWeight: 500, height: '44px' }} onClick={() => setShowValidationModal(false)}>
              Annuler
            </button>
            <button className="confirm-btn" style={{ background: '#16a085', color: 'white', border: 'none', borderRadius: 4, padding: '8px 24px', fontWeight: 500, height: '44px' }} onClick={saveJustification}>
              Enregistrer
            </button>
          </div>
        </Modal>
      )}
      
      {/* Edit modal */}
      {showEditModal && editingAbsence && (
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered dialogClassName="edit-modal-dialog">
          <Modal.Header closeButton style={{ borderBottom: '1px solid #e5e5e5', background: '#f8f9fa' }}>
            <Modal.Title style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#2c3e50' }}>Modifier le statut de présence</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '28px 32px 20px 32px', background: '#fcfcfc', borderRadius: '0 0 8px 8px', fontSize: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
            <div className="edit-info" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: 16 }}>
                <h3 style={{ fontSize: '1.12rem', color: '#2980b9', marginBottom: 12 }}>Informations du stagiaire</h3>
                <div className="info-row" style={{ display: 'flex', gap: 24, marginBottom: 8, fontSize: '1rem' }}>
                  <div className="info-item"><strong>CEF:</strong> {editingAbsence.cef}</div>
                  <div className="info-item"><strong>Étudiant:</strong> {getTraineeData(editingAbsence.cef)?.name} {getTraineeData(editingAbsence.cef)?.first_name}</div>
                </div>
                <div className="info-row" style={{ display: 'flex', gap: 24, fontSize: '1rem' }}>
                  <div className="info-item"><strong>Groupe:</strong> {editingAbsence.groupe}</div>
                  <div className="info-item"><strong>Date:</strong> {formatDate(editingAbsence.date)}</div>
                </div>
                <div className="info-row" style={{ display: 'flex', gap: 24, fontSize: '1rem', marginTop: 8 }}>
                  <div className="info-item"><strong>Formateur:</strong> {editingAbsence.teacher || 'Non spécifié'}</div>
                  <div className="info-item"><strong>Statut actuel:</strong> <span className={`status-badge ${editingAbsence.status}`} style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: editingAbsence.status === 'absent' ? '#e74c3c' : 
                               editingAbsence.status === 'late' ? '#f39c12' : '#27ae60',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>{editingAbsence.status === 'absent' && 'Absent'}{editingAbsence.status === 'late' && 'Retard'}{editingAbsence.status === 'present' && 'Présent'}</span></div>
                </div>
              </div>
              <div className="edit-status-section" style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: 24 }}>
                <h3 style={{ fontSize: '1.08rem', color: '#16a085', marginBottom: 16 }}>Nouveau statut</h3>
                <div className="status-options" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <label className={`status-option ${editStatus === 'absent' ? 'selected' : ''}`} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10, 
                    fontSize: '1rem',
                    padding: '10px 16px',
                    border: '2px solid',
                    borderColor: editStatus === 'absent' ? '#e74c3c' : '#ddd',
                    borderRadius: '6px',
                    background: editStatus === 'absent' ? 'rgba(231, 76, 60, 0.1)' : '#fff',
                    cursor: 'pointer',
                    fontWeight: editStatus === 'absent' ? 'bold' : 'normal',
                    flex: 1,
                    minWidth: '120px',
                    justifyContent: 'center'
                  }}>
                    <input type="radio" name="editStatus" value="absent" checked={editStatus === 'absent'} onChange={() => setEditStatus('absent')} style={{ marginRight: '5px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span className="status-icon" style={{ fontSize: '1.4rem', color: '#e74c3c', marginBottom: '4px' }}>✖</span>
                      <span className="status-label">Absent</span>
                    </div>
                  </label>
                  <label className={`status-option ${editStatus === 'late' ? 'selected' : ''}`} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10, 
                    fontSize: '1rem',
                    padding: '10px 16px',
                    border: '2px solid',
                    borderColor: editStatus === 'late' ? '#f39c12' : '#ddd',
                    borderRadius: '6px',
                    background: editStatus === 'late' ? 'rgba(243, 156, 18, 0.1)' : '#fff',
                    cursor: 'pointer',
                    fontWeight: editStatus === 'late' ? 'bold' : 'normal',
                    flex: 1,
                    minWidth: '120px',
                    justifyContent: 'center'
                  }}>
                    <input type="radio" name="editStatus" value="late" checked={editStatus === 'late'} onChange={() => setEditStatus('late')} style={{ marginRight: '5px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span className="status-icon" style={{ fontSize: '1.4rem', color: '#f39c12', marginBottom: '4px' }}>🕒</span>
                      <span className="status-label">Retard</span>
                    </div>
                  </label>
                  <label className={`status-option ${editStatus === 'present' ? 'selected' : ''}`} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 10, 
                    fontSize: '1rem',
                    padding: '10px 16px',
                    border: '2px solid',
                    borderColor: editStatus === 'present' ? '#27ae60' : '#ddd',
                    borderRadius: '6px',
                    background: editStatus === 'present' ? 'rgba(39, 174, 96, 0.1)' : '#fff',
                    cursor: 'pointer',
                    fontWeight: editStatus === 'present' ? 'bold' : 'normal',
                    flex: 1,
                    minWidth: '120px',
                    justifyContent: 'center'
                  }}>
                    <input type="radio" name="editStatus" value="present" checked={editStatus === 'present'} onChange={() => setEditStatus('present')} style={{ marginRight: '5px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span className="status-icon" style={{ fontSize: '1.4rem', color: '#27ae60', marginBottom: '4px' }}>✓</span>
                      <span className="status-label">Présent</span>
                    </div>
                  </label>
                </div>
              </div>
              <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '6px', borderLeft: '4px solid #3498db' }}>
                <p style={{ margin: '0', fontSize: '0.9rem', color: '#555' }}>
                  <strong>Note:</strong> La modification du statut de présence impactera le calcul des heures d'absence et des notes disciplinaires du stagiaire.
                </p>
              </div>
            </div>
          </Modal.Body>
          <div style={{ background: '#f8f9fa', borderTop: '1px solid #e5e5e5', padding: '16px 32px', display: 'flex', justifyContent: 'flex-end', gap: 14, borderRadius: '0 0 8px 8px', position: 'sticky', bottom: 0, zIndex: 10 }}>
            <button className="cancel-btn" style={{ background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', padding: '8px 24px', fontWeight: '500', height: '44px' }} onClick={() => setShowEditModal(false)}>
              Annuler
            </button>
            <button 
              className="confirm-btn" 
              style={{ 
                background: editStatus === 'absent' ? '#e74c3c' : 
                         editStatus === 'late' ? '#f39c12' : 
                         editStatus === 'present' ? '#27ae60' : '#16a085', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                padding: '8px 24px', 
                fontWeight: '500', 
                height: '44px',
                opacity: editStatus === editingAbsence.status ? 0.6 : 1,
                cursor: editStatus === editingAbsence.status ? 'not-allowed' : 'pointer'
              }} 
              onClick={saveEditedAbsence} 
              disabled={editStatus === editingAbsence.status}
            >
              Enregistrer les modifications
            </button>
          </div>
        </Modal>
      )}
      
      {/* Validation confirmation modal */}
      {showValidationConfirm && (
        <Modal show={showValidationConfirm} onHide={() => setShowValidationConfirm(false)} centered>
          <Modal.Header closeButton style={{ borderBottom: '1px solid #e5e5e5', background: '#f8f9fa' }}>
            <Modal.Title style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#2c3e50' }}>Confirmer la validation</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '24px 32px 20px 32px', background: '#fcfcfc', borderRadius: '0 0 8px 8px' }}>
            <div style={{ fontSize: '1.05rem', color: '#333', marginBottom: 18 }}>
              Voulez-vous vraiment valider toutes les absences du groupe <b>{filterGroup}</b> pour cette session ?
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="cancel-btn" style={{ background: '#e0e0e0', color: '#333', border: 'none', borderRadius: 4, padding: '8px 18px', fontWeight: 500 }} onClick={() => setShowValidationConfirm(false)}>
                Annuler
              </button>
              <button className="confirm-btn" style={{ background: '#16a085', color: 'white', border: 'none', borderRadius: 4, padding: '8px 18px', fontWeight: 500 }} onClick={confirmBulkValidation}>
                Valider
              </button>
            </div>
          </Modal.Body>
        </Modal>
      )}
      
      {/* Toast notification */}
      {toast.show && (
        <div 
          className={`toast-notification ${toast.type}`}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '4px',
            backgroundColor: toast.type === 'success' ? '#4caf50' : 
                             toast.type === 'warning' ? '#ff9800' : '#f44336',
            color: 'white',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <span>{toast.message}</span>
          <button 
            onClick={hideToast}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              marginLeft: '10px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default AbsenceSGPage;
