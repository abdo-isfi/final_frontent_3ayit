import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../index.css";

// Custom CSS for buttons
const customStyles = `
  .status-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .status-buttons {
    display: flex;
    flex-direction: row;
    gap: 8px;
    margin-bottom: 5px;
  }
  
  .status-btn {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    border: 2px solid transparent;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    outline: none;
  }

  .status-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  }

  .status-btn:focus {
    outline: none;
  }

  /* Present button */
  .status-btn.present {
    background-color: #e8f5e9;
    color: #2e7d32;
    border-color: #28a745;
  }

  .status-btn.present.active,
  .status-btn.present:active {
    background-color: #4caf50;
    color: white !important;
    text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
    box-shadow: 0 0 8px rgba(40, 167, 69, 0.6);
    transform: scale(1.05);
  }

  .status-btn.present.active .icon,
  .status-btn.present:active .icon {
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
    color: white !important;
  }

  /* Late button */
  .status-btn.late {
    background-color: #fff3e0;
    color: #e65100;
    border-color: #ffc107;
  }

  .status-btn.late.active,
  .status-btn.late:active {
    background-color: #ff9800;
    color: white !important;
    text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
    box-shadow: 0 0 8px rgba(255, 193, 7, 0.6);
    transform: scale(1.05);
  }

  .status-btn.late.active .icon,
  .status-btn.late:active .icon {
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
    color: white !important;
  }

  /* Absent button */
  .status-btn.absent {
    background-color: #ffebee;
    color: #c62828;
    border-color: #dc3545;
  }

  .status-btn.absent.active,
  .status-btn.absent:active {
    background-color: #f44336;
    color: white !important;
    text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
    box-shadow: 0 0 8px rgba(220, 53, 69, 0.6);
    transform: scale(1.05);
  }

  .status-btn.absent.active .icon,
  .status-btn.absent:active .icon {
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
    color: white !important;
  }
  
  /* Toast notification styles */
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    max-width: 350px;
    width: 100%;
  }
  
  .toast {
    margin-bottom: 10px;
    padding: 15px;
    border-radius: 5px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    animation: slideIn 0.3s ease forwards;
    opacity: 0;
    transform: translateX(50px);
  }
  
  .toast-error {
    background-color: #f44336;
    color: white;
    border-left: 5px solid #d32f2f;
  }
  
  .toast-success {
    background-color: #4caf50;
    color: white;
    border-left: 5px solid #388e3c;
  }
  
  .toast-warning {
    background-color: #ff9800;
    color: white;
    border-left: 5px solid #f57c00;
  }
  
  .toast-info {
    background-color: #2196f3;
    color: white;
    border-left: 5px solid #1976d2;
  }
  
  .toast-close {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    margin-left: 15px;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
      transform: translateY(-20px);
    }
  }
  
  .toast-exit {
    animation: fadeOut 0.3s ease forwards;
  }
`;

const styles = {
  container: {
    padding: "20px",
    maxWidth: "100%",
  },
  statusButtons: {
    display: "flex",
    flexDirection: "row",
    gap: "5px",
  },
  statusBtn: {
    cursor: "pointer",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    backgroundColor: "#f5f5f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    transition: "all 0.2s ease",
  },
};

const AbsencePage = () => {
  const [stagiaires, setStagiaires] = useState([]);
  const [filteredStagiaires, setFilteredStagiaires] = useState([]);
  const [filterApplied, setFilterApplied] = useState(false);
  const [availableGroups, setAvailableGroups] = useState(() => {
    // Get current user from localStorage
    const currentUserJson = localStorage.getItem('currentUser');
    let teacherGroups = [];
    
    if (currentUserJson) {
      try {
        const currentUser = JSON.parse(currentUserJson);
        teacherGroups = currentUser.groups || [];
      } catch (e) {
        console.error('Error parsing current user data:', e);
      }
    }
    
    // Only return assigned groups
    return teacherGroups.sort();
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnnee, setSelectedAnnee] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState("");
  const [selectedGroupe, setSelectedGroupe] = useState("");
  const [filteredGroupe, setFilteredGroupe] = useState("");
  const [absenceDate, setAbsenceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [studentStatuses, setStudentStatuses] = useState({});
  const [errors, setErrors] = useState({
    date: false,
    start: false,
    end: false,
    annee: false,
    filiere: false,
    groupe: false,
  });

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  // Day of week state
  const [dayOfWeek, setDayOfWeek] = useState("");

  const groupeOptions = {
    "1ere annee": {
      "developpement digitale": ["DEV101", "DEV102"],
      "infrastructure digitale": ["ID101", "ID102", "ID103", "ID104"],
    },
    "2eme annee": {
      "developpement digitale": [
        "DEVOWFS201",
        "DEVOWFS202",
        "DEVOWFS203",
        "DEVOWFS204",
        "DEVOWFS205",
      ],
      "infrastructure digitale": [
        "IDOSR201",
        "IDOSR202",
        "IDOSR203",
        "IDOSR204",
        "IDOSR205",
        "IDOSR206",
      ],
    },
  };

  const timeOptions = {
    "08:30": ["11:00", "13:30"],
    "11:00": ["13:30"],
    "13:30": ["16:00", "18:30"],
    "16:00": ["18:30"],
  };

  const startTimes = Object.keys(timeOptions);

  const handleStartTimeChange = (e) => {
    const value = e.target.value;
    setStartTime(value);
    setEndTime("");
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
    setDayOfWeek(getDayOfWeek(absenceDate));
  }, [absenceDate]);

  useEffect(() => {
    const storedTrainees = localStorage.getItem('traineesData');
    if (storedTrainees) {
      try {
        const data = JSON.parse(storedTrainees);
        setStagiaires(data);
        setFilteredStagiaires(data); 
        
        // Get the current user's assigned groups
        const currentUserJson = localStorage.getItem('currentUser');
        let teacherGroups = [];
        
        if (currentUserJson) {
          try {
            const currentUser = JSON.parse(currentUserJson);
            teacherGroups = currentUser.groups || [];
          } catch (e) {
            console.error('Error parsing current user data:', e);
          }
        }
        
        // Only set the assigned groups, no fallback
        setAvailableGroups(teacherGroups.sort());

        // Make sure all students are set to "present" by default
        const initialStatuses = {};
        data.forEach((student) => {
          const id = student.CEF || student.cef || student.id;
          if (id) {
            initialStatuses[id] = "present";
          }
        });
        setStudentStatuses(initialStatuses);
      } catch (error) {
        console.error("Error parsing localStorage data:", error);
      }
    } else {
      fetch("http://localhost:3008/stagiaires")
        .then((response) => response.json())
        .then((data) => {
          setStagiaires(data);
          setFilteredStagiaires(data);
          
          // Get the current user's assigned groups
          const currentUserJson = localStorage.getItem('currentUser');
          let teacherGroups = [];
          
          if (currentUserJson) {
            try {
              const currentUser = JSON.parse(currentUserJson);
              teacherGroups = currentUser.groups || [];
            } catch (e) {
              console.error('Error parsing current user data:', e);
            }
          }
          
          // Only set the assigned groups, no fallback
          setAvailableGroups(teacherGroups.sort());
          
          // Initialize all students to present
          const initialStatuses = {};
          data.forEach((student) => {
            const cef = student.CEF || student.cef || student.id;
            if (cef) {
              initialStatuses[cef] = "present";
            }
          });
          setStudentStatuses(initialStatuses);
        })
        .catch((error) => console.error("Error loading data:", error));
    }
  }, []);

  // Function to show toast notification
  const showToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const toast = { id, message, type };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };
  
  // Function to remove toast
  const removeToast = (id) => {
    // Mark toast for exit animation
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, exiting: true } : toast
    ));
    
    // Remove toast after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 300);
  };

  const handleFilter = () => {
    // Validate selections first
    if (!selectedGroupe) {
      setErrors((prev) => ({ ...prev, groupe: true }));
      showToast("Veuillez sélectionner un groupe pour filtrer les stagiaires.", "error");
      return;
    }
    
    // Check if absences for this group and date have already been submitted
    try {
      const existingRecordsJSON = localStorage.getItem("absenceRecords") || "[]";
      const existingRecords = JSON.parse(existingRecordsJSON);
      
      // Check for any absences with the same group and date
      const sameGroupDate = existingRecords.filter(record => 
        record.groupe === selectedGroupe && 
        record.date === absenceDate
      );
      
      if (sameGroupDate.length > 0) {
        showToast(`Les absences pour ce groupe (${selectedGroupe}) et cette date (${absenceDate}) ont déjà été enregistrées. Vous ne pouvez pas soumettre plusieurs fois les absences pour le même groupe dans la même journée.`, "warning");
        // Still allow viewing but show warning
      }
    } catch (error) {
      console.error("Error checking existing absences:", error);
    }

    setErrors((prev) => ({ ...prev, groupe: false }));
    setFilteredGroupe(selectedGroupe);

    const filtered = stagiaires.filter((student) => {
      const studentGroupe = student.class || student.GROUPE;
      const search = searchTerm.toLowerCase();
      const name = (student.name || student.NOM || "").toLowerCase();
      const firstName = (student.first_name || student.PRENOM || "").toLowerCase();
      const fullName = `${name} ${firstName}`.toLowerCase();
      const cef = (student.cef || student.CEF || "").toString().toLowerCase();

      const matchesGroupe = studentGroupe === selectedGroupe;
      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        cef.includes(search);

      return matchesGroupe && matchesSearch;
    });
    
    // Initialize status to "present" for all filtered students
    const newStatuses = { ...studentStatuses };
    filtered.forEach((student) => {
      const id = student.CEF || student.cef || student.id;
      if (id) {
        newStatuses[id] = "present";
      }
    });
    setStudentStatuses(newStatuses);
    
    setFilteredStagiaires(filtered);
    setFilterApplied(true);
  };

  const handleYearChange = (e) => {
    setSelectedAnnee(e.target.value);
    setSelectedFiliere("");
    setSelectedGroupe("");
    setFilteredStagiaires([]);
    setFilterApplied(false);
    setErrors((prev) => ({
      ...prev,
      annee: false,
      filiere: false,
      groupe: false,
    }));
  };

  const handleFiliereChange = (e) => {
    setSelectedFiliere(e.target.value);
    setSelectedGroupe("");
    setFilteredStagiaires([]);
    setFilterApplied(false);
    setErrors((prev) => ({ ...prev, filiere: false, groupe: false }));
  };

  const handleGroupeChange = (e) => {
    const selectedGroup = e.target.value;
    setSelectedGroupe(selectedGroup);
    // No filtering until button is clicked
  };

  const handleSearchChange = (e) => {
    const value = e.target.value || "";
    setSearchTerm(value);
    
    // Apply search filter immediately if group is selected
    if (selectedGroupe) {
      // First filter by group
      let filtered = stagiaires.filter(
        (stagiaire) => (stagiaire.class === selectedGroupe || stagiaire.GROUPE === selectedGroupe)
      );
      
      // Then apply search filter if there's a search term
      if (value && value.trim() !== '') {
        const processedSearchTerm = value.toLowerCase().trim();
        
        filtered = filtered.filter(trainee => {
          const name = trainee.name || trainee.NOM || '';
          const firstName = trainee.first_name || trainee.PRENOM || '';
          const cef = trainee.cef || trainee.CEF || '';
          
          const fullName = `${name} ${firstName}`.toLowerCase();
          
          return (
            fullName.includes(processedSearchTerm) || 
            String(name).toLowerCase().includes(processedSearchTerm) ||
            String(firstName).toLowerCase().includes(processedSearchTerm) ||
            String(cef).toLowerCase().includes(processedSearchTerm)
          );
        });
      }
      
      // Filter out specific student
      filtered = filtered.filter(trainee => {
        const name = trainee.name || trainee.NOM || '';
        const firstName = trainee.first_name || trainee.PRENOM || '';
        const fullName = `${name} ${firstName}`.toLowerCase();
        return fullName !== 'el fariq fatima ezzahra';
      });
      
      setFilteredStagiaires(filtered);
      setFilterApplied(true);
    }
  };

  const handleStatusChange = (cef, newStatus) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [cef]: newStatus,
    }));
  };

  const handleSubmitAbsence = (event) => {
    event.preventDefault();

    // Validate required fields
    const validationErrors = {
      date: !absenceDate,
      start: !startTime,
      end: !endTime,
      groupe: !selectedGroupe && !filteredGroupe,
    };

    if (Object.values(validationErrors).some((isError) => isError)) {
      setErrors(validationErrors);
      showToast("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }

    const groupe = selectedGroupe || filteredGroupe;

    // Check if absences for this group and date have already been submitted
    // (regardless of time period)
    try {
      const existingRecordsJSON = localStorage.getItem("absenceRecords") || "[]";
      const existingRecords = JSON.parse(existingRecordsJSON);
      
      const alreadySubmittedSameDay = existingRecords.some(record => 
        record.groupe === groupe && 
        record.date === absenceDate
      );
      
      if (alreadySubmittedSameDay) {
        showToast("Les absences pour ce groupe et cette date ont déjà été enregistrées et envoyées au Surveillant Général. Vous ne pouvez soumettre les absences d'un groupe qu'une seule fois par jour.", "error");
        return;
      }
    } catch (error) {
      console.error("Error checking existing absences:", error);
    }

    // Get the selected students' data for the absence record
    const studentsWithStatus = filteredStagiaires.map((student) => {
      const cef = student.cef || student.CEF;
      const status = studentStatuses[cef] || "present"; // Default to present if not specified
      return {
        cef,
        name: student.name || student.NOM,
        firstName: student.first_name || student.PRENOM,
        groupe: student.class || student.GROUPE,
        status,
      };
    });

    // Create the absence record
    const absenceRecord = {
      date: absenceDate,
      startTime,
      endTime,
      groupe: selectedGroupe || filteredGroupe,
      students: studentsWithStatus,
    };

    // Get current user information for the teacher record
    let teacherName = "Formateur";
    const currentUserJson = localStorage.getItem('currentUser');
    if (currentUserJson) {
      try {
        const currentUser = JSON.parse(currentUserJson);
        teacherName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
        
        // Add teacher id if available 
        if (currentUser.id) {
          absenceRecord.teacherId = currentUser.id;
        }
      } catch (e) {
        console.error('Error parsing current user data:', e);
      }
    }
    
    // Add teacher information to record
    absenceRecord.teacher = teacherName;

    try {
      // Get existing records from localStorage
      const existingRecordsJSON = localStorage.getItem("absenceRecords") || "[]";
      const existingRecords = JSON.parse(existingRecordsJSON);

      // Add the new record
      existingRecords.push(absenceRecord);

      // Save back to localStorage
      localStorage.setItem("absenceRecords", JSON.stringify(existingRecords));
      
      // Now also save individual student absence records for SG to reference
      const studentAbsencesJSON = localStorage.getItem("studentAbsences") || "{}";
      const studentAbsences = JSON.parse(studentAbsencesJSON);
      
      // Update each student's individual absence history
      studentsWithStatus.forEach(student => {
        const studentCEF = student.cef;
        if (!studentCEF) return;
        
        // Create individual absence record for this student
        const individualRecord = {
          date: absenceDate,
          startTime,
          endTime,
          status: student.status,
          groupe: student.groupe,
          teacher: teacherName,
          teacherId: absenceRecord.teacherId
        };
        
        // Initialize array if it doesn't exist
        if (!studentAbsences[studentCEF]) {
          studentAbsences[studentCEF] = [];
        }
        
        // Add the new record
        studentAbsences[studentCEF].push(individualRecord);
      });
      
      // Save student absences back to localStorage
      localStorage.setItem("studentAbsences", JSON.stringify(studentAbsences));

      showToast(
        `Les absences ont été enregistrées avec succès pour ${studentsWithStatus.length} stagiaires.`,
        "success"
      );

      // Reset form after successful submission
      resetForm();
    } catch (error) {
      console.error("Error saving absence data:", error);
      showToast("Une erreur s'est produite lors de l'enregistrement des absences.", "error");
    }
  };

  const navigate = useNavigate();
  const handleBack = () => {
    navigate("/");
  };

  const resetForm = () => {
    setSelectedAnnee("");
    setSelectedFiliere("");
    setSelectedGroupe("");
    setFilteredGroupe("");
    setAbsenceDate(new Date().toISOString().split("T")[0]);
    setStartTime("");
    setEndTime("");
    setSearchTerm("");
    setFilteredStagiaires([]);
    
    // Reset all students to present status
    const resetStatuses = {};
    stagiaires.forEach((student) => {
      const id = student.CEF || student.cef || student.id;
      if (id) {
        resetStatuses[id] = "present";
      }
    });
    setStudentStatuses(resetStatuses);
    
    setFilterApplied(false);
    setErrors({
      date: false,
      start: false,
      end: false,
      annee: false,
      filiere: false,
      groupe: false,
    });
  };

  return (
    <div className="absence-container">
      <style>{customStyles}</style>
      
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast toast-${toast.type} ${toast.exiting ? 'toast-exit' : ''}`}
          >
            <span>{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>
      
      <h1>Gérer les Absences</h1>
      <button className="back-button" onClick={handleBack}>
        ⬅ Retour
      </button>

      <div className="form-controls">
        <div className="control-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <div className="control-group" style={{ flex: 1, marginRight: '10px' }}>
            <label>Groupe</label>
            <select
              value={selectedGroupe}
              onChange={handleGroupeChange}
              style={{ height: '40px', boxSizing: 'border-box', width: '100%' }}
            >
              <option value="">Tous les groupes</option>
              {availableGroups.map((groupe) => (
                <option key={groupe} value={groupe}>
                  {groupe}
                </option>
              ))}
            </select>
          </div>

          {/* Day of week display */}
          <div className="control-group" style={{ width: '150px', marginRight: '10px' }}>
            <label>Jour</label>
            <div 
              style={{ 
                height: '40px',
                padding: '0 10px',
                backgroundColor: '#f1f8ff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: '#2c3e50',
                boxSizing: 'border-box'
              }}
            >
              {dayOfWeek}
            </div>
          </div>

          <div className="control-group">
            <label style={{ visibility: "hidden" }}>Filtrer</label>
            <button 
              onClick={handleFilter} 
              className="submit-button"
              style={{ height: '40px', boxSizing: 'border-box' }}
            >
              Filtrer
            </button>
          </div>
        </div>

        <div className="control-row" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <div className="control-group" style={{ flex: 1, marginRight: '10px' }}>
            <label>Date</label>
            <input
              type="date"
              value={absenceDate}
              onChange={(e) => {
                setAbsenceDate(e.target.value);
                setErrors((prev) => ({ ...prev, date: false }));
              }}
              style={{ width: '100%', height: '40px', boxSizing: 'border-box' }}
              readOnly
            />
            {errors.date && (
              <span style={{ color: "red", fontSize: "0.85rem" }}>
                Veuillez choisir une date.
              </span>
            )}
          </div>

          <div className="control-group" style={{ flex: 1, marginRight: '10px' }}>
            <label>Heure de début</label>
            <select
              value={startTime}
              onChange={(e) => {
                handleStartTimeChange(e);
                setErrors((prev) => ({ ...prev, start: false }));
              }}
              style={{ height: '40px', boxSizing: 'border-box', width: '100%' }}
            >
              <option value="">Choisir l'heure</option>
              {startTimes.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            {errors.start && (
              <span style={{ color: "red", fontSize: "0.85rem" }}>
                Veuillez choisir l'heure de début.
              </span>
            )}
          </div>

          <div className="control-group" style={{ flex: 1 }}>
            <label>Heure de fin</label>
            <select
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
                setErrors((prev) => ({ ...prev, end: false }));
              }}
              disabled={!startTime}
              style={{ height: '40px', boxSizing: 'border-box', width: '100%' }}
            >
              <option value="">Choisir l'heure</option>
              {startTime &&
                timeOptions[startTime].map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
            </select>
            {errors.end && (
              <span style={{ color: "red", fontSize: "0.85rem" }}>
                Veuillez choisir l'heure de fin.
              </span>
            )}
          </div>

          <div className="control-group">
            <button 
              onClick={handleSubmitAbsence} 
              className="submit-button"
              style={{ height: '40px', boxSizing: 'border-box' }}
            >
              Soumettre Absences
            </button>
          </div>
        </div>
      </div>

      <div className="control-row" style={{ marginBottom: '15px' }}>
        <div className="control-group full-width">
          <label>Rechercher</label>
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou CEF..."
            value={searchTerm}
            onChange={handleSearchChange}
            disabled={!selectedGroupe}
            style={{ 
              width: '100%', 
              height: '40px', 
              boxSizing: 'border-box',
              backgroundColor: !selectedGroupe ? '#f0f0f0' : 'white' 
            }}
          />
          {!selectedGroupe && (
            <small style={{ color: '#888', display: 'block', marginTop: '5px' }}>
              Veuillez d'abord sélectionner un groupe pour activer la recherche
            </small>
          )}
        </div>
      </div>
      
      {filteredGroupe && filterApplied && (
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
          Groupe sélectionné: {filteredGroupe}
        </div>
      )}

      {selectedGroupe && filteredStagiaires.length > 0 ? (
        <div className="absence-table-container">
          <table className="absence-table">
            <thead>
              <tr>
                <th>NBR</th>
                <th>NOM ET PRENOM</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStagiaires.map((student, index) => {
                const id = student.CEF || student.cef || student.id;
                const name = student.NOM || student.name || '';
                const firstName = student.PRENOM || student.first_name || '';
                const groupe = student.GROUPE || student.class || '';
                
                return (
                  <tr key={id || index}>
                    <td>{index + 1}</td>
                    <td>
                      {name} {firstName}
                    </td>
                    <td>
                      <div className="status-cell">
                        <div className="status-buttons" style={styles.statusButtons}>
                          <button
                            className={`status-btn present ${
                              studentStatuses[id] === "present"
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              handleStatusChange(id, "present")
                            }
                            title="Présent"
                            style={{
                              ...styles.statusBtn,
                              backgroundColor: studentStatuses[id] === "present" ? "#4CAF50" : "#f5f5f5",
                              color: studentStatuses[id] === "present" ? "white" : "black",
                            }}
                          >
                            <span className="icon">✓</span> 
                          </button>
                          <button
                            className={`status-btn late ${
                              studentStatuses[id] === "late"
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              handleStatusChange(id, "late")
                            }
                            title="Retard"
                            style={{
                              ...styles.statusBtn,
                              backgroundColor: studentStatuses[id] === "late" ? "#FF9800" : "#f5f5f5",
                              color: studentStatuses[id] === "late" ? "white" : "black",
                            }}
                          >
                            <span className="icon">⏰</span> 
                          </button>
                          <button
                            className={`status-btn absent ${
                              studentStatuses[id] === "absent"
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              handleStatusChange(id, "absent")
                            }
                            title="Absent"
                            style={{
                              ...styles.statusBtn,
                              backgroundColor: studentStatuses[id] === "absent" ? "#F44336" : "#f5f5f5",
                              color: studentStatuses[id] === "absent" ? "white" : "black",
                            }}
                          >
                            <span className="icon">✖</span>
                          </button>
                        </div>
                        <div className="status-text" style={{ marginTop: '5px', fontSize: '0.75rem', textAlign: 'center' }}>
                          {studentStatuses[id] === 'present' && 'Présent'}
                          {studentStatuses[id] === 'late' && 'Retard'}
                          {studentStatuses[id] === 'absent' && 'Absent'}
                          {!studentStatuses[id] && 'Présent'}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '5px', margin: '20px' }}>
          {selectedGroupe 
            ? "Aucun stagiaire trouvé pour ce groupe. Veuillez ajuster votre recherche." 
            : availableGroups.length > 0 
              ? "Veuillez sélectionner un groupe pour afficher les stagiaires." 
              : "Aucun groupe n'est assigné à votre compte. Veuillez contacter l'administrateur pour obtenir l'accès aux groupes."}
        </div>
      )}
    </div>
  );
};

export default AbsencePage;