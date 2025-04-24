import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../index.css";
import "../../styles/TraineesList.css";

export default function ManageTeachers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [formateurs, setFormateurs] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFormateur, setSelectedFormateur] = useState(null);
  const [displayTrainees, setDisplayTrainees] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [teacherSchedule, setTeacherSchedule] = useState(null);

  useEffect(() => {
    // Fetch trainees from API
    fetchTrainees();
    
    // Load formateurs from localStorage
    loadFormateurs();
    
    // Set up an event listener to detect localStorage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Function to load formateurs from localStorage
  const loadFormateurs = () => {
    try {
      const storedFormateurs = localStorage.getItem('formateurs');
      if (storedFormateurs) {
        const parsedFormateurs = JSON.parse(storedFormateurs);
        // Transform the data to match the expected format
        const transformedFormateurs = parsedFormateurs.map(formateur => ({
          id: formateur.id,
          nom: formateur.lastName,
          prenom: formateur.firstName,
          email: formateur.email,
          modules: [], // Default empty modules array
          classes: formateur.groups || [] // Use groups as classes
        }));
        setFormateurs(transformedFormateurs);
      } else {
        setFormateurs([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading formateurs from localStorage:', err);
      setError('Erreur lors du chargement des formateurs. Veuillez réessayer.');
      setLoading(false);
    }
  };
  
  // Handler for localStorage changes
  const handleStorageChange = (e) => {
    if (e.key === 'formateurs') {
      loadFormateurs();
    }
  };

  const fetchTrainees = async () => {
    setLoading(true);
    try {
      // Try to get trainees from localStorage first
      const storedTrainees = localStorage.getItem('traineesData');
      if (storedTrainees) {
        const parsedTrainees = JSON.parse(storedTrainees);
        setTrainees(parsedTrainees);
      } else {
        // Fallback to API if needed
        const response = await axios.get('/api/trainees');
        const data = Array.isArray(response.data) ? response.data : [];
        setTrainees(data);
      }
    } catch (err) {
      console.error('Error fetching trainees:', err);
      setError('Erreur lors du chargement des stagiaires. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredFormateurs = formateurs.filter((f) =>
    `${f.nom} ${f.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBack = () => {
    navigate("/sg");
  };

  const navigate = useNavigate();

  const handleShowTrainees = (formateur) => {
    setSelectedFormateur(formateur);
    if (formateur.classes && formateur.classes.length > 0) {
      setSelectedClass(formateur.classes[0]);
    }
    setDisplayTrainees(true);
  };

  const handleCloseTrainees = () => {
    setDisplayTrainees(false);
    setSelectedFormateur(null);
  };

  // Get trainees for a specific teacher class
  const getTraineesForClass = (className) => {
    if (!className) return [];
    return trainees.filter(trainee => 
      (trainee.class === className || trainee.GROUPE === className)
    );
  };

  // Get all trainees for a teacher
  const getTraineesForTeacher = (teacher) => {
    if (!teacher.classes || teacher.classes.length === 0) return [];
    
    let result = [];
    teacher.classes.forEach(className => {
      const classTrainees = getTraineesForClass(className);
      result = [...result, ...classTrainees];
    });
    return result;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const handleViewSchedule = (formateur) => {
    setSelectedFormateur(formateur);
    
    // Get schedule
    try {
      const schedulesJson = localStorage.getItem('teacherSchedules') || '{}';
      const schedules = JSON.parse(schedulesJson);
      
      if (schedules[formateur.id]) {
        setTeacherSchedule(schedules[formateur.id]);
      } else {
        setTeacherSchedule(null);
      }
      
      setShowScheduleModal(true);
    } catch (e) {
      console.error('Error loading teacher schedule:', e);
      setError('Erreur lors du chargement de l\'emploi du temps');
    }
  };
  
  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false);
    setTeacherSchedule(null);
    setSelectedFormateur(null);
  };

  return (
    <div className="manage-teachers-container">
      <button className="back-button" onClick={handleBack}>
        ⬅ Retour
      </button>
      <div className="header-section">
        <h1 className="page-title">Gestion des Formateurs</h1>

        <div className="search-container">
          <input
            type="text"
            placeholder="Rechercher un formateur..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-bar"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Chargement des formateurs...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
        </div>
      ) : (
        <div className="table-responsive">
          {formateurs.length === 0 ? (
            <div className="no-data-message">
              <p>Aucun formateur n'a été ajouté par l'administrateur.</p>
            </div>
          ) : (
            <table className="teachers-table">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header">ID</th>
                  <th className="table-header">Nom</th>
                  <th className="table-header">Prénom</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Groupes</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFormateurs.map((formateur, index) => (
                  <tr key={formateur.id} className="table-row">
                    <td className="table-cell id-cell">{index + 1}</td>
                    <td className="table-cell name-cell">{formateur.nom}</td>
                    <td className="table-cell name-cell">{formateur.prenom}</td>
                    <td className="table-cell name-cell">{formateur.email}</td>
                    <td className="table-cell">
                      {formateur.classes && formateur.classes.length > 0 ? (
                        <ul className="items-list">
                          {formateur.classes.map((classe, index) => (
                            <li key={index} className="list-item">
                              <span className="class-badge">{classe}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="no-groups">Aucun groupe assigné</span>
                      )}
                    </td>

                    <td className="table-cell action-cell">
                      <div className="action-buttons">
                        <button 
                          className="view-schedule-btn"
                          onClick={() => handleViewSchedule(formateur)}
                        >
                          <span className="icon">👁️</span>
                          <span className="text">Voir Emploi</span>
                        </button>
                        <button 
                          className="trainees-btn"
                          onClick={() => handleShowTrainees(formateur)}
                          disabled={!formateur.classes || formateur.classes.length === 0}
                          title={!formateur.classes || formateur.classes.length === 0 ? 
                            "Ce formateur n'a pas de groupes assignés" : ""}
                        >
                          <span className="icon">👨‍🎓</span>
                          <span className="text">Stagiaires</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal for displaying trainees */}
      {displayTrainees && selectedFormateur && (
        <div className="modal-overlay">
          <div className="modal-content trainees-modal">
            <div className="modal-header">
              <h2>Stagiaires de {selectedFormateur.prenom} {selectedFormateur.nom}</h2>
              <button className="close-button" onClick={handleCloseTrainees}>&times;</button>
            </div>
            <div className="modal-body">
              {loading ? (
                <div className="loading">Chargement des stagiaires...</div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : (
                <>
                  <div className="classes-tabs">
                    {selectedFormateur.classes && selectedFormateur.classes.map((className, index) => (
                      <button 
                        key={index} 
                        className={`class-tab ${selectedClass === className ? 'active' : ''}`}
                        onClick={() => setSelectedClass(className)}
                      >
                        {className}
                      </button>
                    ))}
                  </div>
                  
                  <div className="trainees-table-container">
                    {selectedClass && getTraineesForClass(selectedClass).length > 0 ? (
                      <table className="trainees-table">
                        <thead>
                          <tr>
                            <th>CEF</th>
                            <th>Nom</th>
                            <th>Prénom</th>
                            <th>Classe</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getTraineesForClass(selectedClass).map((trainee, index) => (
                            <tr key={trainee.id || index}>
                              <td>{trainee.cef || trainee.CEF}</td>
                              <td>{trainee.name || trainee.NOM}</td>
                              <td>{trainee.first_name || trainee.PRENOM}</td>
                              <td>{trainee.class || trainee.GROUPE}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="no-results">Aucun stagiaire trouvé pour cette classe</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedFormateur && (
        <div className="modal-overlay">
          <div className="modal-content schedule-modal">
            <div className="modal-header">
              <h2>Emploi du temps de {selectedFormateur.prenom} {selectedFormateur.nom}</h2>
              <button className="close-button" onClick={handleCloseScheduleModal}>&times;</button>
            </div>
            <div className="modal-body">
              {teacherSchedule ? (
                <div className="schedule-container">
                  {teacherSchedule.startsWith('data:application/pdf') ? (
                    <iframe 
                      src={teacherSchedule} 
                      title="Emploi du Temps" 
                      className="schedule-pdf" 
                      width="100%" 
                      style={{ height: '80vh', minHeight: '700px' }}
                    />
                  ) : (
                    <img 
                      src={teacherSchedule} 
                      alt="Emploi du Temps" 
                      className="schedule-image" 
                    />
                  )}
                </div>
              ) : (
                <div className="no-schedule-message">
                  <p>Aucun emploi du temps n'a été téléchargé pour ce formateur.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .manage-teachers-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .page-title {
          font-size: 24px;
          color: #333;
          margin: 0;
        }
        
        .search-container {
          width: 300px;
        }
        
        .search-bar {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .table-responsive {
          overflow-x: auto;
          margin-bottom: 20px;
        }
        
        .teachers-table {
          width: 100%;
          border-collapse: collapse;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .table-header-row {
          background-color: #4CAF50;
        }
        
        .table-header {
          color: white;
          padding: 15px;
          text-align: left;
          font-weight: 600;
        }
        
        .table-row:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .table-row:hover {
          background-color: #f1f1f1;
        }
        
        .table-cell {
          padding: 12px 15px;
          border-bottom: 1px solid #eee;
        }
        
        .id-cell {
          width: 50px;
          text-align: center;
        }
        
        .name-cell {
          min-width: 120px;
        }
        
        .items-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        
        .list-item {
          margin-bottom: 5px;
        }
        
        .class-badge {
          background-color: #e8f5e9;
          color: #388e3c;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          display: inline-block;
          border: 1px solid #c8e6c9;
        }
        
        .action-cell {
          width: 180px;
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .schedule-btn, .trainees-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          transition: all 0.2s;
        }
        
        .schedule-btn {
          background-color: #2196F3;
          color: white;
        }
        
        .trainees-btn {
          background-color: #FF9800;
          color: white;
        }
        
        .schedule-btn:hover {
          background-color: #1976D2;
        }
        
        .trainees-btn:hover {
          background-color: #F57C00;
        }
        
        .trainees-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
          opacity: 0.7;
        }
        
        .icon {
          font-size: 14px;
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
        
        .back-button:hover {
          background-color: #e0e0e0;
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
          background-color: white;
          border-radius: 8px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        
        .modal-header {
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }
        
        .modal-body {
          padding: 20px;
        }
        
        .classes-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .class-tab {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #f0f0f0;
          cursor: pointer;
          font-size: 14px;
        }
        
        .class-tab.active {
          background-color: #4CAF50;
          color: white;
          border-color: #4CAF50;
        }
        
        .trainees-table-container {
          overflow-x: auto;
        }
        
        .trainees-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .trainees-table th {
          background-color: #f0f0f0;
          padding: 10px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #ddd;
        }
        
        .trainees-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #eee;
        }
        
        .trainees-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .no-results {
          padding: 20px;
          text-align: center;
          color: #666;
          background-color: #f9f9f9;
          border-radius: 4px;
        }
        
        .loading-container, .error-container, .no-data-message {
          padding: 40px;
          text-align: center;
          background-color: #f9f9f9;
          border-radius: 8px;
          margin: 20px 0;
          border: 1px solid #eee;
        }
        
        .loading-container p {
          color: #333;
          font-size: 16px;
        }
        
        .error-container p {
          color: #d32f2f;
          font-size: 16px;
        }
        
        .no-data-message p {
          color: #666;
          font-size: 16px;
        }
        
        .no-groups {
          color: #999;
          font-style: italic;
          font-size: 13px;
        }
        
        .nav-link {
          text-decoration: none;
        }
        
        /* Add styles for schedule modal */
        .view-schedule-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          transition: all 0.2s;
          background-color: #9C27B0;
          color: white;
          margin-right: 8px;
        }
        
        .view-schedule-btn:hover {
          background-color: #7B1FA2;
        }
        
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
          background-color: white;
          border-radius: 8px;
          width: 90%;
          max-width: 1000px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .schedule-modal {
          max-width: 90%;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #333;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #777;
        }
        
        .modal-body {
          padding: 20px;
        }
        
        .schedule-container {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        
        .schedule-image {
          max-width: 100%;
          height: auto;
          object-fit: contain;
        }
        
        .schedule-pdf {
          width: 100%;
          border: none;
          display: block;
          background-color: white;
        }
        
        .no-schedule-message {
          text-align: center;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
          color: #666;
        }
        /* End of schedule modal styles */
      `}</style>
    </div>
  );
}
