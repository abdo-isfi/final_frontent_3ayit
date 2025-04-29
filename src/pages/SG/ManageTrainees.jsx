import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../index.css";
import "../../styles/TraineesList.css";
// Add SheetJS imports if available - if not, we'll handle the Excel file on server side
let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  // XLSX not available, will use server-side processing
  console.log('XLSX library not available, Excel files will be sent to server');
}

const ManagerTrainees = () => {
  const [stagiaires, setStagiaires] = useState([]);
  const [filteredStagiaires, setFilteredStagiaires] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroupe, setSelectedGroupe] = useState("");
  const [availableGroups, setAvailableGroups] = useState(() => {
    // Initialize from localStorage if available
    const savedGroups = localStorage.getItem('availableGroups');
    return savedGroups ? JSON.parse(savedGroups) : [];
  });
  
  // Add state for disciplinary state filter
  const [selectedDisciplinaryState, setSelectedDisciplinaryState] = useState("");
  
  // Define all possible disciplinary states
  const disciplinaryStates = [
    { value: "", label: "Tous les états" },
    { value: "NORMAL", label: "Normal" },
    { value: "1er AVERT (SC)", label: "Première Mise en Garde" },
    { value: "2ème AVERT (SC)", label: "Deuxième Mise en Garde" },
    { value: "1er MISE (CD)", label: "Premier Avertissement" },
    { value: "2ème MISE (CD)", label: "Deuxième Avertissement" },
    { value: "BLÂME (CD)", label: "Blâme" },
    { value: "SUSP 2J (CD)", label: "Exclusion de 2 Jours" },
    { value: "EXCL TEMP (CD)", label: "Exclusion Temporaire" },
    { value: "EXCL DEF (CD)", label: "Exclusion Définitive" }
  ];

  // Get userRole from localStorage 
  const userRole = localStorage.getItem("userRole");

  // State to manage the modal visibility and selected stagiaire
  const [selectedStagiaire, setSelectedStagiaire] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  // Add state for history modal
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  // Excel file upload states
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState({ message: '', type: '' });
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const fileInputRef = useRef(null);

  // API filters for the imported trainees
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiFilters, setApiFilters] = useState({
    cef: '',
    name: '',
    firstName: '',
    class: ''
  });

  // Add state for trainee absence history
  const [absenceHistory, setAbsenceHistory] = useState([]);

  // Add state for absence calendar
  const [absenceCalendar, setAbsenceCalendar] = useState(null);

  useEffect(() => {
    // Initialize with empty arrays instead of default trainees data
    setStagiaires([]);
    setFilteredStagiaires([]);
  }, []);
  
  useEffect(() => {
    // Load trainees data from API
    const fetchTraineesData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/trainees');
        if (response.data.success && response.data.data) {
          const traineesData = response.data.data;
          
          // Filter out unwanted names
          const unwantedNames = ['Alaoui', 'Benani', 'Chaoui', 'Doukkali', 'El Fassi'];
          const filteredData = traineesData.filter(trainee => 
            !unwantedNames.some(name => trainee.name && trainee.name.includes(name))
          );
          
          setStagiaires(filteredData);
          setFilteredStagiaires(filteredData);
          
          // Extract unique class/group values from the data
          const uniqueGroups = [...new Set(filteredData.map(trainee => trainee.class).filter(Boolean))];
          setAvailableGroups(uniqueGroups.sort());
          localStorage.setItem('availableGroups', JSON.stringify(uniqueGroups.sort()));
          
          // Also update localStorage for offline access
          localStorage.setItem('stagiaires', JSON.stringify(filteredData));
        } else {
          // If API fails, try to fall back to localStorage
          const savedStagiaires = localStorage.getItem('stagiaires');
          if (savedStagiaires) {
            try {
              const parsedData = JSON.parse(savedStagiaires);
              setStagiaires(parsedData);
              setFilteredStagiaires(parsedData);
            } catch (error) {
              console.error('Error parsing saved stagiaires:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching trainees data:', error);
        // Fall back to localStorage if API fails
        const savedStagiaires = localStorage.getItem('stagiaires');
        if (savedStagiaires) {
          try {
            const parsedData = JSON.parse(savedStagiaires);
            setStagiaires(parsedData);
            setFilteredStagiaires(parsedData);
          } catch (error) {
            console.error('Error parsing saved stagiaires:', error);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTraineesData();
  }, []);
  
  const handleFilter = () => {
    // Return empty table if no group is selected
    if (!selectedGroupe) {
      setFilteredStagiaires([]);
      return;
    }
    
    let filtered = stagiaires;
    
    // Apply search term filter if present
    if (searchTerm) {
      const lowercaseTerm = searchTerm.toLowerCase().trim();
      
      filtered = filtered.filter(trainee => {
        const fullName = `${trainee.name} ${trainee.first_name}`.toLowerCase();
        const cef = String(trainee.cef).toLowerCase();
        const name = String(trainee.name).toLowerCase();
        const firstName = String(trainee.first_name).toLowerCase();
        
        return (
          fullName.includes(lowercaseTerm) || 
          cef.includes(lowercaseTerm) ||
          name.includes(lowercaseTerm) ||
          firstName.includes(lowercaseTerm)
        );
      });
    }
    
    // Apply class filter (always required now)
    filtered = filtered.filter(trainee => trainee.class === selectedGroupe);
    
    // Apply disciplinary state filter if selected
    if (selectedDisciplinaryState) {
      filtered = filtered.filter(trainee => {
        const traineeAbsences = getTraineeAbsences(trainee);
        const absenceHours = calculateAbsenceHours(traineeAbsences);
        const status = getTraineeStatus(absenceHours);
        return status.text === selectedDisciplinaryState;
      });
    }

    setFilteredStagiaires(filtered);
  };

  const handleGroupeChange = (e) => {
    setSelectedGroupe(e.target.value);
    // We'll apply the filter when the "Filtrer" button is clicked
  };
  
  // Handler for disciplinary state filter change
  const handleDisciplinaryStateChange = (e) => {
    setSelectedDisciplinaryState(e.target.value);
    // We'll apply the filter when the "Filtrer" button is clicked
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Apply the filter immediately when search term changes
    applySearchFilter(e.target.value);
  };

  // New function to apply search filter
  const applySearchFilter = (term) => {
    // Return empty table if no group is selected
    if (!selectedGroupe) {
      setFilteredStagiaires([]);
      return;
    }
    
    if (!term || term.trim() === '') {
      // If search is empty, reset to current filters or all data
      handleFilter();
      return;
    }

    const lowercaseTerm = term.toLowerCase().trim();
    
    // Filter stagiaires based on search term across multiple fields
    const filtered = stagiaires.filter(trainee => {
      const fullName = `${trainee.name} ${trainee.first_name}`.toLowerCase();
      const cef = String(trainee.cef).toLowerCase();
      const name = String(trainee.name).toLowerCase();
      const firstName = String(trainee.first_name).toLowerCase();
      
      return (
        fullName.includes(lowercaseTerm) || 
        cef.includes(lowercaseTerm) ||
        name.includes(lowercaseTerm) ||
        firstName.includes(lowercaseTerm)
      );
    });
    
    // Apply group filter (always required now)
    let result = filtered.filter(trainee => trainee.class === selectedGroupe);
    
    // Apply disciplinary state filter if selected
    if (selectedDisciplinaryState) {
      result = result.filter(trainee => {
        const traineeAbsences = getTraineeAbsences(trainee);
        const absenceHours = calculateAbsenceHours(traineeAbsences);
        const status = getTraineeStatus(absenceHours);
        return status.text === selectedDisciplinaryState;
      });
    }
    
    setFilteredStagiaires(result);
  };

  // Function to get absence history for a trainee
  const getTraineeAbsences = (trainee) => {
    try {
      // Get absence records from localStorage
      const absencesJson = localStorage.getItem('studentAbsences') || '{}';
      const absences = JSON.parse(absencesJson);
      
      // Find absences for this student (by CEF)
      const studentCEF = trainee.cef || trainee.CEF;
      const studentAbsences = absences[studentCEF] || [];
      
      // Sort by date (most recent first)
      return studentAbsences.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
      console.error('Error loading absence data:', e);
      return [];
    }
  };

  // Function to generate calendar data from absences
  const generateAbsenceCalendar = (absences) => {
    if (!absences || absences.length === 0) return null;
    
    // Group absences by month
    const absencesByMonth = {};
    
    absences.forEach(absence => {
      if (!absence.date) return;
      
      const date = new Date(absence.date);
      if (isNaN(date.getTime())) return;
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!absencesByMonth[monthKey]) {
        absencesByMonth[monthKey] = [];
      }
      
      absencesByMonth[monthKey].push({
        day: date.getDate(),
        status: absence.status || 'absent'
      });
    });
    
    return absencesByMonth;
  };

  // Update calculateAbsenceHours to calculate the actual hours
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

  // Updated function to determine trainee status based on absence hours
  const getTraineeStatus = (absenceHours) => {
    // Calculate discipline note based on absence hours (5 hours = -1 point from 20)
    const absencePoints = Math.floor(absenceHours / 5);
    const score = 20 - absencePoints;
    
    // Calculate points deducted (rounded to match getDisciplinaryAction)
    const deducted = Math.round(20 - score);
    
    // Apply specific color codes for each sanction level
    if (deducted === 0) {
      return { text: "NORMAL", color: "#9FE855" }; // Light green
    } 
    else if (deducted === 1) {
      return { text: "1er AVERT (SC)", color: "#235a8c" }; // Blue
    } 
    else if (deducted === 2) {
      return { text: "2ème AVERT (SC)", color: "#191E46" }; // RAL 5022 - Dark blue
    } 
    else if (deducted === 3) {
      return { text: "1er MISE (CD)", color: "#8784b6" }; // Purplish
    } 
    else if (deducted === 4) {
      return { text: "2ème MISE (CD)", color: "#8784b6" }; // Same as 1er MISE
    } 
    else if (deducted === 5) {
      return { text: "BLÂME (CD)", color: "#8B4513" }; // RAL 050 50 60 approximated
    } 
    else if (deducted === 6) {
      return { text: "SUSP 2J (CD)", color: "#FEAE00" }; // Light orange
    } 
    else if (deducted >= 7 && deducted <= 10) {
      return { text: "EXCL TEMP (CD)", color: "#FEAE00" }; // Light orange
    } 
    else {
      return { text: "EXCL DEF (CD)", color: "#FF0000" }; // RAL 3026 - Bright red
    }
  };

  // Function to calculate total attended hours
  const calculateTotalHours = (absences) => {
    // Calculate absence hours
    const absenceHours = calculateAbsenceHours(absences);
    
    // Assuming a full course is 400 hours
    const totalCourseHours = 400;
    
    // Calculate attended hours
    return totalCourseHours - absenceHours;
  };
  
  // Calculate disciplinary note based on absences and lateness
  const calculateDisciplinaryNote = (absences) => {
    if (!absences || absences.length === 0) return 20; // Start with 20 points (full attendance)
    
    // Count late arrivals
    const lateArrivals = absences.filter(a => a.status === 'late').length;
    
    // Calculate absence hours
    const absenceHours = calculateAbsenceHours(
      absences.filter(a => a.status === 'absent')
    );
    
    // Calculate deductions
    // -1 point per 5 hours (two sessions) of absence
    const absenceDeduction = Math.min(20, Math.floor(absenceHours / 5) * 1);
    
    // -1 point per 4 late arrivals
    const latenessDeduction = Math.min(20, Math.floor(lateArrivals / 4) * 1);
    
    // Calculate total deduction (maximum 20 points)
    const totalDeduction = Math.min(20, absenceDeduction + latenessDeduction);
    
    // Calculate final score (minimum 0)
    const finalScore = Math.max(0, 20 - totalDeduction);
    
    // Round to 1 decimal place
    return Math.round(finalScore * 10) / 10;
  };

  // New function to get disciplinary action based on points deducted
  const getDisciplinaryAction = (points) => {
    // Calculate points deducted from full score (on 20-point scale)
    const deducted = Math.round(20 - points);
    
    // Use exact point values for each sanction
    if (deducted === 0) return { action: "Aucune action", authority: "—" };
    if (deducted === 1) return { action: "1er avertissement", authority: "SC" };
    if (deducted === 2) return { action: "2ème avertissement", authority: "SC" };
    if (deducted === 3) return { action: "1er blâme officiel", authority: "CD" };
    if (deducted === 4) return { action: "2ème blâme officiel", authority: "CD" };
    if (deducted === 5) return { action: "Blâme", authority: "CD" };
    if (deducted === 6) return { action: "Suspension de 2 jours", authority: "CD" };
    if (deducted >= 7 && deducted <= 10) return { action: "Exclusion temporaire ou définitive", authority: "CD" };
    
    // For extreme cases (more than 10 points deducted)
    return { action: "Exclusion définitive", authority: "CD" };
  };

  const handleViewDetails = (trainee) => {
    // Get absence history for this student
    const history = getTraineeAbsences(trainee);
    
    // Set the selected trainee and show modal
    setSelectedStagiaire(trainee);
    setModalVisible(true);
    
    // Generate absence calendar
    const calendarData = generateAbsenceCalendar(history);
    setAbsenceCalendar(calendarData);
    
    // Set absence history
    setAbsenceHistory(history);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedStagiaire(null);
  };

  // Handle showing history
  const handleShowHistory = () => {
    setModalVisible(false);
    setHistoryModalVisible(true);
  };

  // Handle closing history modal
  const handleCloseHistoryModal = () => {
    setHistoryModalVisible(false);
    setModalVisible(true);
  };

  // Handle click outside the modal to close it
  const handleOutsideClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      handleCloseModal();
    }
  };

  // Handle click outside the history modal to close it
  const handleHistoryOutsideClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      handleCloseHistoryModal();
    }
  };

  const navigate = useNavigate();
  const handleBack = () => {
    navigate("/sg");
  };

  // Function to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Excel file upload handlers
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validExtensions = ['.xlsx', '.xls', '.csv', '.txt'];
    const fileName = selectedFile.name.toLowerCase();
    const isValidType = validExtensions.some(ext => fileName.endsWith(ext));
    
    // Accept all file types with size under 10MB to give the parser a chance
    if (isValidType || selectedFile.size < 10 * 1024 * 1024) {
      setFile(selectedFile);
      setUploadFeedback({ message: `Fichier sélectionné: ${selectedFile.name}`, type: 'info' });
    } else {
      setUploadFeedback({ 
        message: 'Format de fichier non valide ou trop volumineux. Veuillez sélectionner un fichier texte (CSV recommandé).',
        type: 'error' 
      });
      setFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  // Function to check if file can be parsed
  const tryParseFile = (content) => {
    // Check if content has any of the expected delimiters
    const hasCommas = content.includes(',');
    const hasTabs = content.includes('\t');
    const hasSemicolons = content.includes(';');
    
    // Check if content has multiple lines
    const lines = content.split(/\r\n|\n/).filter(line => line.trim());
    const hasMultipleLines = lines.length > 1;
    
    // Check if lines have consistent structure that could indicate tabular data
    let hasConsistentStructure = false;
    if (hasMultipleLines && lines.length > 2) {
      // Look for consistent number of values per line (indicative of tabular data)
      const delimiter = hasTabs ? '\t' : (hasSemicolons ? ';' : ',');
      const valueCounts = lines.slice(0, Math.min(5, lines.length)).map(line => 
        line.split(delimiter).length
      );
      
      // If at least 2 lines have the same number of elements, consider it valid tabular data
      const uniqueCounts = new Set(valueCounts);
      hasConsistentStructure = uniqueCounts.size <= 3; // Allow some variation
      
      console.log('Value counts per line:', valueCounts);
      console.log('Consistent structure detected:', hasConsistentStructure);
    }
    
    // Check if any line has a common delimiter
    const hasDelimiters = hasCommas || hasTabs || hasSemicolons;
    
    // Look for data patterns that might indicate usable content (numbers, words that look like names)
    const hasDataPatterns = lines.some(line => {
      return /\d{3,}/.test(line) || // Has numbers (like IDs)
             /\b[A-Z][a-z]{2,}\b/.test(line); // Has capitalized words (like names)
    });
    
    console.log('File analysis:', {
      hasCommas, hasTabs, hasSemicolons, 
      hasMultipleLines, hasConsistentStructure,
      hasDataPatterns
    });
    
    return (hasMultipleLines && (hasDelimiters || hasConsistentStructure || hasDataPatterns));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadFeedback({ message: 'Veuillez sélectionner un fichier', type: 'error' });
      return;
    }

    setIsLoading(true);
    setUploadFeedback({ message: 'Importation en cours...', type: 'info' });
    
    // Add a function to filter out unwanted names
    const filterUnwantedNames = (data) => {
      const unwantedNames = ['Alaoui', 'Benani', 'Chaoui', 'Doukkali', 'El Fassi'];
      return data.filter(trainee => 
        !unwantedNames.some(name => trainee.name && trainee.name.includes(name))
      );
    };

    try {
      // Check if user requested sample data generation
      if (file.name.toLowerCase().includes('sample') || file.name.toLowerCase().includes('exemple')) {
        // Generate sample data for demonstration
        const sampleSize = 15; // Default sample size
        const sampleMatch = file.name.match(/\d+/);
        const requestedSize = sampleMatch ? parseInt(sampleMatch[0], 10) : sampleSize;
        
        const testData = generateSampleData(
          Math.min(100, Math.max(5, requestedSize)), // Between 5 and 100 samples
          file.name
        );
        
        // Filter data and update state
        const cleanedData = filterUnwantedNames(testData);
        setStagiaires(cleanedData);
        setFilteredStagiaires(cleanedData);
        
        // Extract unique class values
        const uniqueGroups = [...new Set(cleanedData.map(trainee => trainee.class).filter(Boolean))];
        setAvailableGroups(uniqueGroups.sort());
        localStorage.setItem('availableGroups', JSON.stringify(uniqueGroups.sort()));
        
        // Also save to 'traineesData' localStorage key for sharing with AbsencePage
        localStorage.setItem('traineesData', JSON.stringify(cleanedData));
        // Mark data as updated for AbsencePage to detect
        localStorage.setItem('lastDataImport', new Date().toISOString());
        
        setIsLoading(false);
        setUploadFeedback({
          message: `${cleanedData.length} stagiaires importés pour démonstration.`,
          type: 'success'
        });
        
        // Clear the file input and hide the upload section
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setShowUploadSection(false);
        return;
      }
      
      // Check if file has Excel extension
      const fileExt = file.name.split('.').pop().toLowerCase();
      
      // For Excel files, we'll try to process them directly if XLSX is available
      if ((fileExt === 'xlsx' || fileExt === 'xls') && typeof XLSX !== 'undefined') {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Get cell references based on user requirements
            // Column B (index 1) = CEF, starting from row 5
            // Column C (index 2) = Nom (Name), starting from row 5
            // Column D (index 3) = Prénom (First Name), starting from row 5
            // Column E (index 4) = Classe (Class), starting from row 5
            // Column F (index 5) = Téléphone (Telephone), starting from row 5
            // Column O (index 14) = Absence count, starting from row 5
            
            // Convert to array with specific options to get all rows
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1,  // Use array of arrays format
              blankRows: false, // Skip blank rows
              defval: '' // Default empty string for empty cells
            });
            
            console.log('Excel data parsed:', jsonData);
            
            // Process the Excel data
            if (jsonData && jsonData.length > 0) {
              // Skip the first 4 rows per user requirement (start from row 5)
              // Create trainees from rows 5 and beyond
              const trainees = [];
              
              // Map the columns explicitly as specified by the user
              const columnMapping = {
                cef: 1,     // Column B (index 1)
                name: 2,    // Column C (index 2)
                firstName: 3, // Column D (index 3)
                class: 4,     // Column E (index 4)
                telephone: 5, // Column F (index 5) - Added for phone number
                absence: 14   // Column O (index 14)
              };
              
              // Start processing from row 5 (index 4 in 0-based array)
              const startRow = 4; 
              
              for (let i = startRow; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue;
                
                // Map the data based on the explicit column mappings
                const trainee = {
                  id: i - startRow + 1, // Start IDs from 1
                  cef: row[columnMapping.cef] ? String(row[columnMapping.cef]) : `CEF${i - startRow + 1}`,
                  name: row[columnMapping.name] ? String(row[columnMapping.name]) : '',
                  first_name: row[columnMapping.firstName] ? String(row[columnMapping.firstName]) : '',
                  class: row[columnMapping.class] ? String(row[columnMapping.class]) : '',
                  phone: row[columnMapping.telephone] ? String(row[columnMapping.telephone]) : '',
                  absence_count: row[columnMapping.absence] ? parseInt(row[columnMapping.absence], 10) || 0 : 0,
                  registration_date: new Date().toISOString().split('T')[0],
                  import_source: file.name,
                  imported_at: new Date().toISOString()
                };
                
                // Skip completely empty rows
                if (!trainee.cef && !trainee.name && !trainee.first_name && !trainee.class) {
                  continue;
                }
                
                // Ensure we don't show 'undefined' for any fields
                if (trainee.cef === 'undefined') trainee.cef = '';
                if (trainee.name === 'undefined') trainee.name = '';
                if (trainee.first_name === 'undefined') trainee.first_name = '';
                if (trainee.class === 'undefined') trainee.class = '';
                
                trainees.push(trainee);
              }
              
              if (trainees.length > 0) {
                // Filter data and update state
                const cleanedData = filterUnwantedNames(trainees);
                setStagiaires(cleanedData);
                setFilteredStagiaires(cleanedData);
                
                // Extract unique class values
                const uniqueGroups = [...new Set(cleanedData.map(trainee => trainee.class).filter(Boolean))];
                setAvailableGroups(uniqueGroups.sort());
                localStorage.setItem('availableGroups', JSON.stringify(uniqueGroups.sort()));
                
                // Also save to 'traineesData' localStorage key for sharing with AbsencePage
                localStorage.setItem('traineesData', JSON.stringify(cleanedData));
                // Mark data as updated for AbsencePage to detect
                localStorage.setItem('lastDataImport', new Date().toISOString());
                
                // Save trainees to localStorage for persistence
                localStorage.setItem('stagiaires', JSON.stringify(cleanedData));
                
                setIsLoading(false);
                setUploadFeedback({
                  message: `${cleanedData.length} stagiaires importés depuis Excel avec succès! Données lues à partir de la ligne 5.`,
                  type: 'success'
                });
                
                // Clear the file input and hide the upload section
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
                setShowUploadSection(false);
              } else {
                setIsLoading(false);
                setUploadFeedback({
                  message: 'Aucune donnée valide trouvée dans le fichier Excel. Vérifiez que vos données commencent bien à la ligne 5 et dans les colonnes B, C, D et E.',
                  type: 'error'
                });
              }
            } else {
              setIsLoading(false);
              setUploadFeedback({
                message: 'Le fichier Excel est vide ou corrompu.',
                type: 'error'
              });
            }
          } catch (error) {
            console.error('Error parsing Excel file:', error);
            setIsLoading(false);
            setUploadFeedback({
              message: `Erreur lors de l'analyse du fichier Excel: ${error.message}`,
              type: 'error'
            });
          }
        };
        
        reader.onerror = (error) => {
          console.error('Error reading Excel file:', error);
          setIsLoading(false);
          setUploadFeedback({
            message: 'Erreur lors de la lecture du fichier Excel.',
            type: 'error'
          });
        };
        
        reader.readAsArrayBuffer(file);
        return;
      }
      
      // For CSV and text files, use the existing approach
      const fileReader = new FileReader();
      
      fileReader.onload = (event) => {
        try {
          // Convert tab-delimited or similar content to CSV format for easier processing
          let content = event.target.result;
          
          // Check for binary content
          if (content.indexOf('\ufffd') > -1 || /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(content)) {
            console.error("Binary content detected - file may be Excel format");
            
            // Try to upload to server instead
            if (fileExt === 'xlsx' || fileExt === 'xls') {
              setUploadFeedback({
                message: `Tentative d'envoi du fichier Excel au serveur...`,
                type: 'info'
              });
              
              // Create form data to send file to server
              const formData = new FormData();
              formData.append('file', file);
              
              // Send file to server
              axios.post('/api/trainees/import', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              })
              .then(response => {
                console.log('Server response:', response);
                if (response.data && response.data.success) {
                  // Import successful
                  const cleanedData = filterUnwantedNames(response.data.trainees || []);
                  setStagiaires(cleanedData);
                  setFilteredStagiaires(cleanedData);
                  setIsLoading(false);
                  setUploadFeedback({
                    message: `${cleanedData.length} stagiaires importés depuis le serveur avec succès!`,
                    type: 'success'
                  });
                  
                  // Also save to 'traineesData' localStorage key for sharing with AbsencePage
                  localStorage.setItem('traineesData', JSON.stringify(cleanedData));
                  // Mark data as updated for AbsencePage to detect
                  localStorage.setItem('lastDataImport', new Date().toISOString());
                  
                  // Clear the file input and hide the upload section
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                  setShowUploadSection(false);
                } else {
                  // Import failed
                  setIsLoading(false);
                  setUploadFeedback({
                    message: response.data.message || 'Erreur lors de l\'importation côté serveur.',
                    type: 'error'
                  });
                }
              })
              .catch(error => {
                console.error('Server import error:', error);
                // Create test data if server import fails
                const testData = generateSampleData(10, file.name);
                const cleanedTestData = filterUnwantedNames(testData);
                setStagiaires(cleanedTestData);
                setFilteredStagiaires(cleanedTestData);
                setIsLoading(false);
                setUploadFeedback({
                  message: `Erreur lors de l'envoi au serveur. Des données de démonstration ont été générées à la place.`,
                  type: 'error'
                });
              });
              return;
            }
            
            // If not Excel, create test data
            const testData = generateSampleData(10, file.name);
            const cleanedTestData = filterUnwantedNames(testData);
            setStagiaires(cleanedTestData);
            setFilteredStagiaires(cleanedTestData);
            setIsLoading(false);
            setUploadFeedback({
              message: `Erreur: Format de fichier non reconnu. Des données de démonstration ont été générées.`,
              type: 'error'
            });
            
            return;
          }
          
          // Create simple test data if parsing fails
          if (!tryParseFile(content)) {
            // Create test data using file name as a marker
            const fileName = file.name;
            console.log("Creating test data for file: " + fileName);
            
            // Generate sample data (this is a fallback)
            const testData = generateSampleData(10, fileName);
            const cleanedTestData = filterUnwantedNames(testData);
            setStagiaires(cleanedTestData);
            setFilteredStagiaires(cleanedTestData);
            setIsLoading(false);
            setUploadFeedback({
              message: `${cleanedTestData.length} stagiaires importés pour démonstration. Remarque: Le format de fichier original n'a pas pu être traité.`,
              type: 'success'
            });
            
            // Also save to 'traineesData' localStorage key for sharing with AbsencePage
            localStorage.setItem('traineesData', JSON.stringify(cleanedTestData));
            // Mark data as updated for AbsencePage to detect
            localStorage.setItem('lastDataImport', new Date().toISOString());
            
            // Clear the file input and hide the upload section
            setFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            setShowUploadSection(false);
            return;
          }
          
          // Try to detect delimiters and parse the file
          const data = parseFileContent(content);
          
          if (data && data.length > 0) {
            // Filter data and update state
            const cleanedData = filterUnwantedNames(data);
            setStagiaires(cleanedData);
            setFilteredStagiaires(cleanedData);
            
            // Extract unique class values
            const uniqueGroups = [...new Set(cleanedData.map(trainee => trainee.class).filter(Boolean))];
            setAvailableGroups(uniqueGroups.sort());
            localStorage.setItem('availableGroups', JSON.stringify(uniqueGroups.sort()));
            
            // Also save to 'traineesData' localStorage key for sharing with AbsencePage
            localStorage.setItem('traineesData', JSON.stringify(cleanedData));
            // Mark data as updated for AbsencePage to detect
            localStorage.setItem('lastDataImport', new Date().toISOString());
            
            // Save to localStorage for persistence
            localStorage.setItem('stagiaires', JSON.stringify(cleanedData));
            
            setIsLoading(false);
            setUploadFeedback({
              message: `${cleanedData.length} stagiaires importés avec succès!`,
              type: 'success'
            });
            
            // Clear the file input and hide the upload section
            setFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            setShowUploadSection(false);
          } else {
            setIsLoading(false);
            setUploadFeedback({
              message: 'Aucune donnée trouvée dans le fichier ou format incorrect.',
              type: 'error'
            });
          }
        } catch (error) {
          console.error('Error parsing file:', error);
          setIsLoading(false);
          setUploadFeedback({
            message: `Erreur lors de l'analyse du fichier: ${error.message}`,
            type: 'error'
          });
        }
      };
      
      fileReader.onerror = () => {
        setIsLoading(false);
        setUploadFeedback({
          message: 'Erreur lors de la lecture du fichier.',
          type: 'error'
        });
      };
      
      // Use readAsText for both CSV and Excel files for consistency
      fileReader.readAsText(file);
      
    } catch (error) {
      console.error('Error handling file:', error);
      setIsLoading(false);
      setUploadFeedback({
        message: 'Erreur lors du traitement du fichier.',
        type: 'error'
      });
    }
  };

  // Generate sample data for demonstration
  const generateSampleData = (count, fileName) => {
    const classes = ["DEV101", "DEV102", "DEVOWFS201", "DEVOWFS202", "IDOSR201", "IDOSR202"];
    const data = [];
    
    // Use alternative names instead of the unwanted ones
    const sampleNames = ["Martin", "Durand", "Dubois", "Moreau", "Lambert", "Robert"];
    const sampleFirstNames = ["Thomas", "Léa", "Nicolas", "Emma", "Lucas", "Julie"];
    
    for (let i = 1; i <= count; i++) {
      const nameIndex = Math.floor(Math.random() * sampleNames.length);
      const firstNameIndex = Math.floor(Math.random() * sampleFirstNames.length);
      
      data.push({
        id: i,
        cef: `CEF${100000 + i}`,
        name: `${sampleNames[nameIndex]}_${i}`,
        first_name: `${sampleFirstNames[firstNameIndex]}_${i}`,
        class: classes[Math.floor(Math.random() * classes.length)],
        absence_count: Math.floor(Math.random() * 10),
        registration_date: new Date().toISOString().split('T')[0],
        import_source: fileName,
        imported_at: new Date().toISOString()
      });
    }
    
    return data;
  };

  // Function to parse file content
  const parseFileContent = (content) => {
    try {
      // Try to detect the most common delimiter in the file
      const delimiter = detectDelimiter(content);
      console.log('Detected delimiter:', delimiter === '\t' ? 'TAB' : delimiter);
      
      // Split content into lines
      const lines = content.split(/\r\n|\n/).filter(line => line.trim());
      
      if (lines.length <= 1) {
        throw new Error('Le fichier ne contient pas de données');
      }
      
      // Log the first few lines for debugging
      console.log('First line:', lines[0]);
      console.log('Second line (if available):', lines.length > 1 ? lines[1] : 'N/A');
      
      // Parse header line to get column names
      const headers = parseDelimitedLine(lines[0], delimiter);
      console.log('Parsed headers:', headers);
      
      // Try to automatically generate column mappings even if headers don't match expected names
      const columnIndices = detectColumns(headers);
      console.log('Mapped column indices:', columnIndices);
      
      // If no columns were identified, try to guess positions based on common patterns
      if (columnIndices.cef === -1 && columnIndices.name === -1 && columnIndices.firstName === -1) {
        // If headers don't help, check if we have a typical data pattern in first row
        // This handles files without headers or with non-standard headers
        if (lines.length > 1) {
          const firstDataRow = parseDelimitedLine(lines[1], delimiter);
          console.log('First data row for guessing:', firstDataRow);
          
          // Try to guess which columns might contain what based on data patterns
          columnIndices.cef = guessColumnType(firstDataRow, 'cef');
          columnIndices.name = guessColumnType(firstDataRow, 'name');
          columnIndices.firstName = guessColumnType(firstDataRow, 'firstName');
          
          console.log('Guessed column indices:', columnIndices);
        }
        
        // If we still can't find columns, create a structure mapping
        if (columnIndices.cef === -1 && columnIndices.name === -1 && columnIndices.firstName === -1) {
          // As a last resort, just map the first few columns to our expected structure
          if (headers.length >= 3) {
            columnIndices.cef = 0;      // First column as CEF
            columnIndices.name = 1;     // Second column as Name
            columnIndices.firstName = 2; // Third column as FirstName
            console.log('Using default column mapping as last resort');
          }
        }
      }
      
      // Check if we have at least some minimal mapping
      if (columnIndices.cef === -1 && columnIndices.name === -1 && columnIndices.firstName === -1) {
        // Show details about what was found to help diagnose the issue
        const headerInfo = headers.map((h, i) => `Col ${i+1}: "${h}"`).join(', ');
        throw new Error(`Colonnes requises non trouvées. Entêtes détectées: ${headerInfo}`);
      }
      
      // Parse data rows
      const trainees = [];
      // Start from the correct row (skip header if present)
      const startRow = 1;
      
      for (let i = startRow; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        const values = parseDelimitedLine(line, delimiter);
        
        // Only process rows that have enough values
        if (values.length < 2) continue;
        
        // Create a trainee object with data from the row
        const trainee = {
          id: i,
          cef: columnIndices.idIndex !== -1 && columnIndices.idIndex < values.length 
            ? values[columnIndices.idIndex] || `CEF${i}` 
            : `CEF${i}`,
          name: columnIndices.lastNameIndex !== -1 && columnIndices.lastNameIndex < values.length 
            ? values[columnIndices.lastNameIndex] || 'Inconnu' 
            : 'Inconnu',
          first_name: columnIndices.firstNameIndex !== -1 && columnIndices.firstNameIndex < values.length 
            ? values[columnIndices.firstNameIndex] || 'Inconnu' 
            : 'Inconnu',
          class: columnIndices.groupIndex !== -1 && columnIndices.groupIndex < values.length 
            ? values[columnIndices.groupIndex] || 'Inconnue' 
            : 'Inconnue',
          phone: columnIndices.phoneIndex !== -1 && columnIndices.phoneIndex < values.length 
            ? values[columnIndices.phoneIndex] || '' 
            : '',
          absence_count: 0, // Absence count may not be available in the Excel file
          registration_date: new Date().toISOString().split('T')[0],
          import_source: file.name,
          imported_at: new Date().toISOString()
        };
        
        // Debug output for the created trainee (only for the first few)
        if (i < 5) {
          console.log(`Created trainee from row ${i}:`, trainee);
          console.log(`Raw values:`, values);
          console.log(`Using column indices:`, columnIndices);
        }
        
        // Only add trainees with at least some data
        if (trainee.name !== 'Inconnu' || trainee.first_name !== 'Inconnu' || trainee.cef !== `CEF${i}`) {
          trainees.push(trainee);
        } else {
          console.warn(`Skipping empty trainee at row ${i}`);
        }
      }
      
      return trainees;
    } catch (error) {
      console.error('Error in parseFileContent:', error);
      throw error;
    }
  };

  // Helper function to detect the most likely delimiter in the file
  const detectDelimiter = (content) => {
    const firstLines = content.split(/\r\n|\n/).slice(0, 5).join('\n');
    
    const commaCount = (firstLines.match(/,/g) || []).length;
    const tabCount = (firstLines.match(/\t/g) || []).length;
    const semicolonCount = (firstLines.match(/;/g) || []).length;
    
    console.log('Delimiter counts:', { comma: commaCount, tab: tabCount, semicolon: semicolonCount });
    
    if (tabCount > commaCount && tabCount > semicolonCount) {
      return '\t';
    } else if (semicolonCount > commaCount) {
      return ';';
    } else {
      return ',';
    }
  };

  // Helper function to parse a line with the given delimiter
  const parseDelimitedLine = (line, delimiter) => {
    // Simple split by delimiter (doesn't handle quotes properly but works for basic cases)
    return line.split(delimiter).map(v => v.trim());
  };

  const detectColumns = (headers) => {
    console.log('Detecting columns from headers:', headers);
    const lowerCaseHeaders = headers.map(h => h.toLowerCase().trim());
    console.log('Lowercase headers:', lowerCaseHeaders);

    // Define possible column names for each field with more alternatives
    const idAlternatives = ['id', 'cef', 'cef/id', 'cef id', 'code', 'matricule', 'identifiant', 'num', 'numero', 'numéro', '#', 'stagiaire id', 'num stagiaire'];
    const firstNameAlternatives = ['prénom', 'prenom', 'first name', 'firstname', 'first_name', 'given name', 'givenname', 'prénoms', 'prenoms'];
    const lastNameAlternatives = ['nom', 'lastname', 'last name', 'last_name', 'family name', 'surname', 'nom de famille', 'noms'];
    const yearAlternatives = ['année', 'annee', 'an', 'year', 'academic year', 'année académique', 'annee academique', 'niveau', 'level'];
    const fieldAlternatives = ['filière', 'filiere', 'field', 'speciality', 'spécialité', 'specialite', 'formation', 'program', 'programme'];
    const groupAlternatives = ['groupe', 'group', 'grp', 'class', 'classe', 'section', 'gr'];
    const phoneAlternatives = ['téléphone', 'telephone', 'tel', 'phone', 'mobile', 'gsm', 'portable', 'contact', 'num tel', 'numéro tel']; 
    
    // Add debug info to see what's happening with column detection
    for (let i = 0; i < lowerCaseHeaders.length; i++) {
      const header = lowerCaseHeaders[i];
      console.log(`Analyzing header[${i}]: "${header}"`);
      
      // Check for each type of field
      console.log(`  - ID match: ${idAlternatives.some(alt => header.includes(alt))}`);
      console.log(`  - FirstName match: ${firstNameAlternatives.some(alt => header.includes(alt))}`);
      console.log(`  - LastName match: ${lastNameAlternatives.some(alt => header.includes(alt))}`);
      console.log(`  - Group/Class match: ${groupAlternatives.some(alt => header.includes(alt))}`);
      console.log(`  - Phone match: ${phoneAlternatives.some(alt => header.includes(alt))}`);
    }

    // Find column indices
    let idIndex = lowerCaseHeaders.findIndex(h => idAlternatives.some(alt => h.includes(alt)));
    let firstNameIndex = lowerCaseHeaders.findIndex(h => firstNameAlternatives.some(alt => h.includes(alt)));
    let lastNameIndex = lowerCaseHeaders.findIndex(h => lastNameAlternatives.some(alt => h.includes(alt)));
    let yearIndex = lowerCaseHeaders.findIndex(h => yearAlternatives.some(alt => h.includes(alt)));
    let fieldIndex = lowerCaseHeaders.findIndex(h => fieldAlternatives.some(alt => h.includes(alt)));
    let groupIndex = lowerCaseHeaders.findIndex(h => groupAlternatives.some(alt => h.includes(alt)));
    let phoneIndex = lowerCaseHeaders.findIndex(h => phoneAlternatives.some(alt => h.includes(alt)));

    // Log detected indices for debugging
    console.log('Detected column indices:', {
      idIndex, firstNameIndex, lastNameIndex, yearIndex, fieldIndex, groupIndex, phoneIndex
    });

    // Check if any of the required columns (ID, first name, last name) are missing
    const missing = [];
    if (idIndex === -1) missing.push('CEF/ID');
    if (firstNameIndex === -1) missing.push('Prénom');
    if (lastNameIndex === -1) missing.push('Nom');

    // Display an alert with information about the headers if columns can't be detected
    if (missing.length > 0) {
      console.warn(`Missing columns: ${missing.join(', ')}`);
      // Create a detailed message about the headers we found
      const headerDetails = lowerCaseHeaders.map((h, i) => `Column ${i+1}: "${h}"`).join('\n');
      console.warn(`Headers found in file:\n${headerDetails}`);
      
      // Add alert to help user troubleshoot
      alert(`Problème de détection de colonnes: ${missing.join(', ')} non trouvé(s).\n\nEn-têtes détectés:\n${headerDetails}\n\nAssurez-vous que votre fichier Excel contient les en-têtes appropriés.`);
    }

    // Handle case where no required columns were found
    if (missing.length === 3) {
      console.log('No required columns detected. Attempting fuzzy matching...');
      
      // Detailed log of what we're looking for
      console.log('Looking for ID alternatives:', idAlternatives);
      console.log('Looking for FirstName alternatives:', firstNameAlternatives);
      console.log('Looking for LastName alternatives:', lastNameAlternatives);
      
      // Try to guess columns based on the server-side interpretation (ExcelImportService.php)
      // The server expects: lastName at index 2, firstName at index 3, class at index 4
      if (headers.length >= 5) {
        console.log('Trying to match server-side column structure');
        lastNameIndex = 2;
        firstNameIndex = 3;
        groupIndex = 4;
        idIndex = 0; // Usually first column in Excel is ID
        
        console.log('Using server-side structure fallback: LastName=2, FirstName=3, Class=4, ID=0');
        
        // No need to check for missing columns again as we've assigned them manually
        return {
          idIndex, 
          firstNameIndex,
          lastNameIndex,
          yearIndex,
          fieldIndex,
          groupIndex,
          phoneIndex
        };
      }
      
      // If we can't match server structure, try positional detection
      if (headers.length >= 3) {
        console.log('Trying positional detection with headers:', headers);
        // Assume first column is ID, second is first name, third is last name
        idIndex = 0;
        firstNameIndex = 1;
        lastNameIndex = 2;
        if (headers.length >= 6) {
          phoneIndex = 5; // Assume phone is in column F (index 5)
        }
        
        console.log('Using positional fallback: ID=0, FirstName=1, LastName=2, Phone=5');
      }
      
      // If we still don't have the required columns, show warning and return null
      if (idIndex === -1 || firstNameIndex === -1 || lastNameIndex === -1) {
        console.error('Required columns not found even after fallback attempts');
        return null;
      }
    }

    // Return the mapping of column indices
    return {
      idIndex,
      firstNameIndex,
      lastNameIndex,
      yearIndex,
      fieldIndex,
      groupIndex,
      phoneIndex
    };
  };

  // Helper function to guess column types based on data patterns
  const guessColumnType = (row, type) => {
    // For now, implement basic guesses based on common patterns
    switch (type) {
      case 'cef':
        // Look for something that resembles an ID (alphanumeric with possible prefix)
        return row.findIndex(val => 
          /^[A-Za-z]?[0-9]{3,}$/.test(val.replace(/\s/g, '')) || // Number with possible letter prefix
          /^[A-Za-z]{2,}[0-9]{3,}$/.test(val.replace(/\s/g, ''))  // Letter prefix + numbers
        );
      case 'name':
        // Look for something that likely contains a name (all uppercase is often a surname)
        return row.findIndex(val => 
          val.toUpperCase() === val && // All uppercase is often a surname
          val.length > 2 &&
          /^[A-Za-z\s-]+$/.test(val)   // Only letters, spaces, hyphens
        );
      case 'firstName':
        // Look for something that likely contains a first name (mixed case is often a first name)
        return row.findIndex(val => 
          val !== val.toUpperCase() && // Not all uppercase
          val !== val.toLowerCase() && // Not all lowercase
          val.length > 2 &&
          /^[A-Za-z\s-]+$/.test(val)   // Only letters, spaces, hyphens
        );
      default:
        return -1;
    }
  };

  const toggleUploadSection = () => {
    setShowUploadSection(!showUploadSection);
    if (!showUploadSection) {
      // Reset upload state when opening the section
      setFile(null);
      setUploadFeedback({ message: '', type: '' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Add a function to clear stored data
  const clearStoredData = () => {
    localStorage.removeItem('stagiaires');
    localStorage.removeItem('availableGroups');
    localStorage.removeItem('traineesData');
    localStorage.removeItem('filteredTrainees');
    localStorage.removeItem('lastFilterGroup');
    localStorage.removeItem('lastFilterTimestamp');
    localStorage.removeItem('lastDataImport');
    setStagiaires([]);
    setFilteredStagiaires([]);
    setAvailableGroups([]);
  };

  // Clear all localStorage related to absences
  const clearAllStorage = () => {
    // Clear all absence-related data
    localStorage.removeItem('absenceRecords');
    localStorage.removeItem('studentAbsences');
    localStorage.removeItem('absences');
    localStorage.removeItem('traineeAbsenceHistory');
    localStorage.removeItem('traineeAbsenceCalendar');
  };

  // Add this function at the end of existing functions to ensure it runs when data is uploaded
  // This will be executed when a file is processed, regardless of the source
  useEffect(() => {
    // Subscribe to the lastDataImport value in localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'lastDataImport') {
        // Get the trainees data from localStorage
        const traineesJSON = localStorage.getItem('traineesData') || '[]';
        try {
          const trainees = JSON.parse(traineesJSON);
          
          // Ensure all trainees have absence_count set to 0
          const updatedTrainees = trainees.map(trainee => ({
            ...trainee,
            absence_count: 0
          }));
          
          // Save back to localStorage
          localStorage.setItem('traineesData', JSON.stringify(updatedTrainees));
          
          // Also initialize empty absence records if none exist
          if (!localStorage.getItem('studentAbsences')) {
            const emptyAbsences = {};
            updatedTrainees.forEach(trainee => {
              const cef = trainee.cef || trainee.CEF;
              if (cef) {
                emptyAbsences[cef] = [];
              }
            });
            localStorage.setItem('studentAbsences', JSON.stringify(emptyAbsences));
          }
        } catch (error) {
          console.error('Error processing trainees data:', error);
        }
      }
    };
    
    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div className="absence-container">
      <h1>Gérer les stagiaires</h1>
      <div className="action-buttons-container">
      <button className="back-button" onClick={handleBack}>
        ⬅ Retour
      </button>
        <button className="upload-button" onClick={toggleUploadSection}>
          <i className="fa fa-upload"></i> {showUploadSection ? 'Masquer l\'import' : 'Importer fichier Excel'}
        </button>
        {stagiaires.length > 0 && (
          <button className="clear-button" onClick={clearStoredData}>
            <i className="fa fa-trash"></i> Effacer les données
          </button>
        )}
      </div>

      {/* Excel File Upload Section */}
      {showUploadSection && (
        <div className="upload-section">
          <h3>Importer un fichier de données</h3>
          <div 
            className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon">📄</div>
            <p>Glissez et déposez votre fichier CSV ou Excel ici</p>
            <p className="or-divider">OU</p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="file-input"
            />
            <button 
              type="button" 
              className="browse-button"
              onClick={() => fileInputRef.current.click()}
            >
              Parcourir les fichiers
            </button>
            {file && (
              <div className="file-info">
                <p><strong>Fichier:</strong> {file.name}</p>
                <p><strong>Taille:</strong> {(file.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
          </div>

          {uploadFeedback.message && (
            <div className={`feedback-message ${uploadFeedback.type}`}>
              {uploadFeedback.message}
            </div>
          )}

          <div className="upload-actions">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={toggleUploadSection}
            >
              Annuler
            </button>
            <button 
              type="button" 
              className="upload-submit-button" 
              onClick={handleUploadSubmit}
              disabled={!file || isLoading}
            >
              {isLoading ? 'Importation...' : 'Importer les données'}
            </button>
          </div>
        </div>
      )}

      {/* Show an empty state message if there's no data yet */}
      {stagiaires.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>Aucune donnée de stagiaires disponible</h3>
          <p>Utilisez le bouton "Importer fichier Excel" ci-dessus pour charger vos données</p>
        </div>
      ) : (
        <>
          {/* If we're using demonstration data (auto-generated), show a notice */}
          {stagiaires.length > 0 && stagiaires[0].name.startsWith('Nom_') && (
            <div className="demo-data-notice">
              <p>
                <strong>⚠️ Mode Démonstration:</strong> Les données affichées sont des exemples générés automatiquement.
                Pour afficher vos propres données, veuillez importer un fichier CSV valide.
              </p>
            </div>
          )}

          <div className="form-controls">
            <div className="control-row">
              <div className="control-group">
                <label>Groupe</label>
                <select
                  value={selectedGroupe}
                  onChange={handleGroupeChange}
                  className="enhanced-select"
                >
                  <option value="">Choisir le groupe</option>
                  {availableGroups.map((groupe) => (
                    <option key={groupe} value={groupe}>
                      {groupe}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Add new disciplinary state filter dropdown */}
              <div className="control-group">
                <label>État Disciplinaire</label>
                <select
                  value={selectedDisciplinaryState}
                  onChange={handleDisciplinaryStateChange}
                  className="enhanced-select"
                >
                  {disciplinaryStates.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <button onClick={handleFilter} className="submit-button enhanced-button">
                  <i className="filter-icon">🔍</i> Filtrer
                </button>
              </div>
            </div>

            <div className="control-row">
              <div className="control-group full-width">
                <label>Rechercher</label>
                <div className="search-input-wrapper">
                  <i className="search-icon">🔍</i>
                  <input
                    type="text"
                    placeholder="Rechercher par nom, prénom ou CEF..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="enhanced-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Move "Gérer les absences" button above the table */}
          <div className="manage-absences-container">
            <NavLink to="/sg/absence">
              <button className="manage-absences-button enhanced-button">Gérer les absences</button>
            </NavLink>
          </div>

          {/* Use the new selected filters display instead of just the group */}
          {(selectedGroupe || selectedDisciplinaryState) && (
            <div className="selected-filters-display">
              {selectedGroupe && (
                <div className="filter-item">
                  <div className="filter-label">Groupe:</div>
                  <div className="filter-value" style={{ color: 'white' }}>{selectedGroupe}</div>
                </div>
              )}
              
              {selectedDisciplinaryState && (
                <div className="filter-item">
                  <div className="filter-label">État Disciplinaire:</div>
                  <div className="filter-value" style={{ color: 'white' }}>
                    {disciplinaryStates.find(state => state.value === selectedDisciplinaryState)?.label || selectedDisciplinaryState}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="absence-table-container">
            <table className="absence-table">
              <thead>
                <tr>
                  <th>CEF</th>
                  <th>NOM ET PRÉNOM</th> {/* Combined name column */}
                  <th>TÉLÉPHONE</th> {/* Added phone column */}
                  <th>HEURES D'ABSENCE</th> {/* Updated column name */}
                  <th>ÉTAT</th> {/* New column for status */}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStagiaires.length > 0 ? (
                  filteredStagiaires.map((trainee, index) => {
                    // Get absences for this trainee
                    const traineeAbsences = getTraineeAbsences(trainee);
                    // Calculate absence hours
                    const absenceHours = calculateAbsenceHours(traineeAbsences);
                    // Get status based on absence hours
                    const status = getTraineeStatus(absenceHours);
                    
                    return (
                        <tr key={trainee.id || index}>
                          <td>{trainee.cef}</td>
                          <td>{trainee.name} {trainee.first_name}</td> {/* Combined name */}
                          <td>{trainee.phone || trainee.TELEPHONE || trainee.TEL || "-"}</td> {/* Display phone number */}
                          <td>{absenceHours} h</td> {/* Dynamic absence hours */}
                          <td>
                          <span 
                            className="status-badge" 
                            style={{ backgroundColor: status.color, color: ['yellow', 'lightgreen'].includes(status.color) ? '#333' : 'white' }}
                          >
                            {status.text}
                          </span>
                        </td>
                      <td>
                        <button
                              onClick={() => handleViewDetails(trainee)}
                          className="view-details-button"
                        >
                          Voir Détails
                        </button>
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data-message">
                      {selectedGroupe 
                        ? "Aucun stagiaire trouvé. Ajustez votre recherche."
                        : "Veuillez sélectionner un groupe pour afficher les stagiaires."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal for displaying trainee details */}
      {modalVisible && selectedStagiaire && (
        <div className="modal-overlay" onClick={handleOutsideClick}>
          <div className="modal-content trainee-details-modal">
            <div className="modal-header">
              <h2>Détails du Stagiaire</h2>
              <button className="close-modal-button" onClick={handleCloseModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="trainee-details-info">
                  <div className="detail-item">
                  <span className="detail-label">Nom Complet:</span> 
                  <span className="detail-value">{selectedStagiaire.name} {selectedStagiaire.first_name}</span>
                  </div>
                  <div className="detail-item">
                  <span className="detail-label">Téléphone:</span> 
                  <span className="detail-value">{selectedStagiaire.phone || selectedStagiaire.TELEPHONE || selectedStagiaire.TEL || "Non spécifié"}</span>
                  </div>
                  <div className="detail-item">
                  <span className="detail-label">Heures d'Absence:</span> 
                  <span className="detail-value">{calculateAbsenceHours(absenceHistory)}</span>
                  </div>
                  <div className="detail-item">
                  <span className="detail-label">Note de Discipline:</span> 
                  <span className={`detail-value ${calculateDisciplinaryNote(absenceHistory) < 14 ? 'warning-text' : ''}`}>
                    {calculateDisciplinaryNote(absenceHistory)}/20
                  </span>
                  </div>
                  <div className="detail-item">
                  <span className="detail-label">État:</span> 
                  <div className="status-badge-container">
                    {(() => {
                      const absenceHours = selectedStagiaire.absence_hours || calculateAbsenceHours(absenceHistory);
                      const status = getTraineeStatus(absenceHours);
                      return (
                        <span 
                          className="detail-value status-badge" 
                          style={{ backgroundColor: status.color, color: ['yellow', 'lightgreen'].includes(status.color) ? '#333' : 'white' }}
                        >
                          {status.text}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button className="historique-button" onClick={handleShowHistory}>Historique</button>
              </div>
            </div>
                    </div>
                  </div>
                )}
                
      {/* History Modal */}
      {historyModalVisible && selectedStagiaire && (
        <div className="modal-overlay" onClick={handleHistoryOutsideClick}>
          <div className="modal-content trainee-history-modal">
            <div className="modal-header">
              <h2>Historique d'Absences - {selectedStagiaire.name} {selectedStagiaire.first_name}</h2>
              <button className="close-modal-button" onClick={handleCloseHistoryModal}>&times;</button>
            </div>
            <div className="modal-body">
                {/* Absence Statistics - Update discipline note to /20 */}
                <div className="absence-stats">
                  <div className="stats-row">
                    <div className="stat-item">
                      <div className="stat-value">{absenceHistory.filter(a => a.status === 'absent').length}</div>
                      <div className="stat-label">Absences</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{absenceHistory.filter(a => a.status === 'late').length}</div>
                      <div className="stat-label">Retards</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{calculateAbsenceHours(absenceHistory)}</div>
                      <div className="stat-label">Heures d'Absence</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{calculateDisciplinaryNote(absenceHistory)}/20</div>
                      <div className="stat-label">Note de Discipline</div>
                  </div>
                </div>
                            </div>
                
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
              
              <div className="modal-actions">
                <button className="return-button" onClick={handleCloseHistoryModal}>Retour</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .action-buttons-container {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        /* Style for the Gérer les absences button */
        .manage-absences-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 1rem;
        }
        
        .manage-absences-button {
          background-color: #FF5722;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s;
        }
        
        .manage-absences-button:hover {
          background-color: #E64A19;
          transform: translateY(-2px);
        }
        
        .demo-data-notice {
          background-color: #fff3cd;
          color: #856404;
          border-left: 4px solid #ffc107;
          padding: 12px 20px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        
        .demo-data-notice p {
          margin: 0;
        }

        .empty-state {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 40px 20px;
          margin: 30px 0;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .empty-state-icon {
          font-size: 64px;
          margin-bottom: 20px;
          color: #6c757d;
        }
        
        .empty-state h3 {
          font-size: 1.5rem;
          color: #495057;
          margin-bottom: 10px;
        }
        
        .empty-state p {
          color: #6c757d;
          font-size: 1.1rem;
        }
        
        .view-details-button {
          background-color: #3498db;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .view-details-button:hover {
          background-color: #2980b9;
          transform: translateY(-2px);
        }

        .upload-section {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .drop-zone {
          border: 2px dashed #ccc;
          border-radius: 5px;
          padding: 30px;
          text-align: center;
          cursor: pointer;
          margin-bottom: 15px;
          background-color: white;
          transition: all 0.3s ease;
        }

        .drop-zone.drag-over {
          background-color: #e3f2fd;
          border-color: #2196f3;
        }

        .upload-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }

        .or-divider {
          margin: 10px 0;
          color: #6c757d;
        }

        .file-input {
          display: none;
        }

        .browse-button {
          background-color: #3498db;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
        }

        .browse-button:hover {
          background-color: #2980b9;
        }

        .file-info {
          margin-top: 15px;
          text-align: left;
          padding: 10px;
          background-color: #f0f0f0;
          border-radius: 4px;
          display: inline-block;
        }

        .feedback-message {
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .feedback-message.error {
          background-color: #ffebee;
          color: #c62828;
          border-left: 4px solid #c62828;
        }

        .feedback-message.info {
          background-color: #e3f2fd;
          color: #0d47a1;
          border-left: 4px solid #0d47a1;
        }

        .feedback-message.success {
          background-color: #e8f5e9;
          color: #2e7d32;
          border-left: 4px solid #2e7d32;
        }

        .upload-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .cancel-button {
          background-color: #f44336;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .cancel-button:hover {
          background-color: #d32f2f;
        }

        .upload-submit-button {
          background-color: #4caf50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .upload-submit-button:hover {
          background-color: #388e3c;
        }

        .upload-submit-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .upload-instructions {
          background-color: #e3f2fd;
          border-left: 4px solid #2196f3;
          padding: 10px 15px;
          margin-bottom: 15px;
          border-radius: 4px;
        }
        
        .upload-instructions ul {
          margin: 5px 0 5px 20px;
          padding: 0;
        }
        
        .upload-instructions li {
          margin-bottom: 5px;
        }

        .csv-example {
          background-color: #f8f9fa;
          border-radius: 4px;
          padding: 10px 15px;
          margin-top: 15px;
          border-left: 4px solid #17a2b8;
        }
        
        .csv-preview {
          background-color: #fff;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 10px;
          font-family: monospace;
          white-space: pre;
          overflow-x: auto;
          font-size: 0.9rem;
          margin: 10px 0;
        }
        
        .example-download-button {
          background-color: #17a2b8;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
          font-size: 0.9rem;
        }
        
        .example-download-button:hover {
          background-color: #138496;
        }

        /* Updated Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-content {
          background-color: white;
          border-radius: 8px;
          width: 400px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }
        
        .modal-header {
          background-color: #f8f9fa;
          padding: 15px 20px;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-header h2 {
          margin: 0;
          color: #333;
          font-size: 20px;
        }
        
        .close-modal-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          line-height: 1;
        }
        
        .modal-body {
          padding: 20px;
        }
        
        .trainee-details-modal {
          max-width: 450px;
        }
        
        .trainee-details-info {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
          margin-bottom: 10px;
        }
        
        .detail-label {
          font-weight: 600;
          color: #555;
          margin-bottom: 5px;
        }
        
        .detail-value {
          color: #333;
        }
        
        .detail-value.status-badge {
          background-color: #FF5722;
          color: white;
          padding: 4px 10px;
          border-radius: 4px;
          display: inline-block;
          font-size: 14px;
          font-weight: 500;
        }
        
        .modal-actions {
          margin-top: 25px;
          display: flex;
          justify-content: center;
        }
        
        .historique-button {
          background-color: #2196F3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .historique-button:hover {
          background-color: #0D8AEE;
        }

        .clear-button {
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.3s;
        }
        
        .clear-button:hover {
          background-color: #d32f2f;
        }
        
        /* Absences section styles */
        .absences-section {
          margin-top: 20px;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
        
        .absences-section h3 {
          margin-bottom: 15px;
          color: #333;
          font-size: 18px;
        }
        
        .absences-table-container {
          overflow-x: auto;
        }
        
        .absences-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .absences-table th {
          background-color: #f0f0f0;
          padding: 10px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #ddd;
        }
        
        .absences-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #eee;
        }
        
        .absences-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-badge.absent {
          background-color: #ffebee;
          color: #c62828;
          border: 1px solid #ef9a9a;
        }
        
        .status-badge.late {
          background-color: #fff3e0;
          color: #e65100;
          border: 1px solid #ffcc80;
        }
        
        .status-badge.present {
          background-color: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #a5d6a7;
        }
        
        .status-absent {
          background-color: rgba(255, 235, 238, 0.3);
        }
        
        .status-late {
          background-color: rgba(255, 243, 224, 0.3);
        }
        
        .no-absences-message {
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 4px;
          color: #666;
          text-align: center;
        }

        /* New styles for absence statistics */
        .absence-stats {
          margin-top: 20px;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
        
        .absence-stats h3 {
          margin-bottom: 15px;
          color: #333;
          font-size: 18px;
        }
        
        .stats-row {
          display: flex;
          justify-content: space-around;
          margin-bottom: 20px;
        }
        
        .stat-item {
          text-align: center;
          padding: 10px 15px;
          border-radius: 8px;
          background-color: #f5f5f5;
          min-width: 100px;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        
        .stat-label {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        
        /* Calendar styles */
        .absence-calendar {
          margin-top: 20px;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
        
        .absence-calendar h3 {
          margin-bottom: 15px;
          color: #333;
          font-size: 18px;
        }
        
        .calendar-container {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .month-calendar {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 15px;
          width: 280px;
        }
        
        .month-name {
          text-align: center;
          font-size: 16px;
          margin-bottom: 10px;
          color: #333;
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .week-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 10px;
        }
        
        .week-day {
          text-align: center;
          font-size: 12px;
          font-weight: bold;
          color: #666;
        }
        
        .days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }
        
        .day-cell {
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: #333;
          border-radius: 4px;
        }
        
        .day-cell.empty {
          background-color: transparent;
        }
        
        .day-cell.absent {
          background-color: #ffebee;
          color: #c62828;
          font-weight: bold;
        }

        .status-badge-container {
          display: flex;
          justify-content: center;
          width: 100%;
          margin-top: 5px;
        }
        
        .detail-value.status-badge {
          background-color: #FF5722;
          color: white;
          padding: 4px 10px;
          border-radius: 4px;
          display: inline-block;
          font-size: 14px;
          font-weight: 500;
        }
        
        .trainee-history-modal {
          max-width: 700px;
          width: 90%;
        }
        
        .return-button {
          background-color: #2196F3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .return-button:hover {
          background-color: #0D8AEE;
        }

        /* Add a class for warning text */
        .warning-text {
          color: #e65100;
          font-weight: bold;
        }

        .selected-group-display {
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: #f1f8ff;
          padding: 12px 15px;
          border-radius: 5px;
          margin-bottom: 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .filter-label {
          font-weight: 600;
          color: #555;
        }
        
        .filter-value {
          background-color: #3949ab;
          color: white;
          padding: 5px 12px;
          border-radius: 4px;
          font-weight: 500;
        }
        
        .status-badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
          min-width: 80px;
        }
        
        .no-data-message {
          text-align: center;
          padding: 20px;
          font-style: italic;
          color: #666;
        }

        /* Add styles for disciplinary action display */
        .disciplinary-action {
          margin-top: 15px;
          padding: 10px 15px;
          background-color: #f5f5f5;
          border-radius: 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .action-label {
          font-weight: 600;
          margin-bottom: 5px;
          color: #555;
        }

        .action-value {
          font-size: 18px;
          font-weight: 600;
          color: #e65100;
          text-align: center;
        }

        .action-authority {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }

        .selected-filters-display {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          background-color: #f9f9f9;
          padding: 0.8rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          border: 1px solid #e0e0e0;
        }
        
        .filter-item {
          display: flex;
          align-items: center;
          background-color: white;
          padding: 0.5rem 0.8rem;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .filter-label {
          font-weight: 600;
          color: #555;
          margin-right: 0.5rem;
        }
        
        .filter-value {
          color: #3f51b5;
          font-weight: 500;
        }
        
        .control-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .enhanced-select,
        .enhanced-input {
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid #dce0e6;
          background-color: white;
          font-size: 1rem;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          width: 100%;
        }
        
        .enhanced-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23555555'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 20px;
          padding-right: 35px;
        }
        
        .enhanced-select:hover,
        .enhanced-input:hover {
          border-color: #b9c5ef;
        }
        
        .enhanced-select:focus,
        .enhanced-input:focus {
          border-color: #4568dc;
          box-shadow: 0 0 0 3px rgba(69, 104, 220, 0.1);
          outline: none;
        }
        
        .enhanced-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          border-radius: 8px;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        
        .enhanced-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .submit-button.enhanced-button {
          background: linear-gradient(135deg, #4568dc, #3f5efb);
          color: white;
        }
        
        .manage-absences-button.enhanced-button {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
        }
        
        .search-input-wrapper {
          position: relative;
          width: 100%;
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          font-style: normal;
        }
        
        .enhanced-input {
          padding-left: 40px;
        }
        
        .selected-filters-display {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          background-color: #f5f8ff;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border: 1px solid #dce0e6;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        
        .filter-item {
          display: flex;
          align-items: center;
          background-color: white;
          padding: 0.6rem 1rem;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border-left: 3px solid #4568dc;
        }
        
        .filter-label {
          font-weight: 600;
          color: #555;
          margin-right: 0.5rem;
        }
        
        .filter-value {
          color: #4568dc;
          font-weight: 500;
        }
        
        .control-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
          align-items: flex-end;
        }
        
        .control-group {
          flex: 1;
          min-width: 200px;
        }
        
        .control-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #495057;
        }
        
        .full-width {
          flex-basis: 100%;
        }
      `}</style>
    </div>
  );
};

export default ManagerTrainees;