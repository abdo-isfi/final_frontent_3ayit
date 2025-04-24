import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../images/Logo-OFPPT.jpg"
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
  
  // Calculate hours for a single absence record
  const calculateAbsenceHours = (absence) => {
    if (!absence) return 0;
    
    let hours = 0;
    
    if (absence.status === 'absent') {
      // Check if we have start and end times
      if (absence.startTime && absence.endTime) {
        const start = absence.startTime.split(':').map(Number);
        const end = absence.endTime.split(':').map(Number);
        
        if (start.length >= 2 && end.length >= 2) {
          const startHour = start[0] + start[1] / 60;
          const endHour = end[0] + end[1] / 60;
          hours = (endHour - startHour);
        } else {
          // Default to 4 hours if time format is invalid
          hours = 4;
        }
      } else {
        // Default to 4 hours if no specific time provided
        hours = 4;
      }
    } else if (absence.status === 'late') {
      // Late arrivals count as 1 hour
      hours = 1;
    }
    
    return Math.round(hours * 10) / 10; // Round to 1 decimal place
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
    for (let i = 0; i < 6; i++) {
      const date = new Date(weekDates.start);
      date.setDate(weekDates.start.getDate() + i);
      
      const dayNames = ["LUN", "MAR", "MERC", "JEU", "VEN", "SAM"];
      
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
      const weekAbsences = weekDays.map(day => {
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
        weekAbsences
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
              ${reportData.trainees.map((trainee, index) => `
                <tr>
                  <td class="num-cell">${index + 1}</td>
                  <td class="name-cell">${trainee.name} ${trainee.first_name}</td>
                  ${trainee.weekAbsences.map(dayAbsence => {
                    // For each day, create 4 time slots (Morning 1-2, Afternoon 1-2)
                    return Array(4).fill()
                      .map((_, timeSlot) => {
                        let cellContent = '';
                        
                        // If absent during this time slot
                        if (dayAbsence.isAbsent) {
                          cellContent = '<span class="absence-mark">A</span>';
                        } 
                        // If late during this time slot
                        else if (dayAbsence.isLate && timeSlot === 0) {
                          cellContent = '<span class="late-mark">R</span>';
                        }
                        
                        return `<td>${cellContent}</td>`;
                      })
                      .join('');
                  }).join('')}
                </tr>
              `).join('')}
              <tr class="signature-row">
                <td colspan="2" style="text-align: center; font-weight: bold;">Emargements des Formateurs</td>
                ${reportData.weekDays.map(() => `
                  <td colspan="4">&nbsp;</td>
                `).join('')}
              </tr>
              <tr class="signature-row">
                <td colspan="2" style="text-align: center; font-weight: bold;">Assistants</td>
                ${reportData.weekDays.map(() => `
                  <td colspan="4">&nbsp;</td>
                `).join('')}
              </tr>
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
        
        <button 
          className="report-button"
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
        </div>
        <div className="stat-card late">
          <h3>Total des Retards</h3>
          <div className="stat-value">{totalLate}</div>
        </div>
      </div>
      
      {/* Filters */}
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
          
          {/* Add day of week display */}
          <div className="day-of-week">
            <label>Jour:</label>
            <div className="day-display">
              {dayOfWeek || "---"}
            </div>
          </div>
          
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
            placeholder="Recherche par nom ou CEF..."
              className="search-input"
            />
          
          <button className="clear-button" onClick={handleClearFilters}>
            Réinitialiser
          </button>
        </div>
      </div>
      
      {/* Add selected filters display above table */}
      {loading ? (
        <div className="loading-message">Chargement des données d'absence...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
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
                  <th>Date</th>
                    <th>Heures</th>
                    <th>Statut</th>
                  <th>Validé</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                  {filterAbsences().map((absence, index) => {
                    const traineeData = getTraineeData(absence.cef);
                    const hoursValue = calculateAbsenceHours(absence);
                  
                  return (
                      <tr
                        key={index}
                        className={`status-row-${absence.status}`}
                      >
                        <td>{absence.cef}</td>
                        <td>{traineeData?.name || 'N/A'} {traineeData?.first_name || ''}</td>
                        <td>{formatDate(absence.date)}</td>
                        <td>{hoursValue}h</td>
                        <td>
                          <span className={`status-badge ${absence.status}`}>
                            {absence.status === 'absent' && 'Absent'}
                            {absence.status === 'late' && 'Retard'}
                            {absence.status === 'present' && 'Présent'}
                          </span>
                        </td>
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
        </>
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
                        <th>Statut</th>
                        <th>Formateur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {traineeAbsences.map((absence, index) => (
                        <tr key={index} className={`status-${absence.status}`}>
                          <td>{formatDate(absence.date)}</td>
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
        
        .table-filters {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          background-color: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .filter-left, .filter-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .filter-left label, .filter-right label {
          font-weight: 500;
          white-space: nowrap;
        }
        
        .status-label, .search-label {
          margin-left: 15px;
        }
        
        .select-input, .date-input, .search-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .search-input {
          width: 200px;
        }
        
        .clear-button {
          background-color: #f0f0f0;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
        }
        
        .clear-button:hover {
          background-color: #e0e0e0;
        }
        
        .selected-filters {
          display: flex;
          justify-content: space-between;
          background-color: var(--white);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-4);
          box-shadow: var(--shadow-md);
        }
        
        .filter-display {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        
        .filter-label {
          font-weight: 600;
          color: var(--gray-700);
        }
        
        .filter-value {
          background-color: var(--primary);
          color: white;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          font-size: var(--font-size-md);
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 1px solid var(--primary-dark);
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
        
        .day-of-week {
          display: flex;
          align-items: center;
          margin: 0 10px;
        }
        
        .day-of-week label {
          margin-right: 8px;
        }
        
        .day-display {
          background-color: #f1f8ff;
          padding: 8px 12px;
          border-radius: 4px;
          font-weight: 600;
          color: #2c3e50;
          border: 1px solid #ddd;
          min-width: 100px;
          text-align: center;
        }
        
        .report-button {
          background-color: #2196F3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .report-button:hover {
          background-color: #0d8bf2;
        }
        
        .report-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .stats-container {
            flex-direction: column;
            gap: var(--space-3);
          }
          
          .selected-filters {
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
          
          .day-of-week {
            margin: 5px 0;
            width: 100%;
            justify-content: flex-start;
          }
          
          .day-display {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default AbsenceSGPage;
