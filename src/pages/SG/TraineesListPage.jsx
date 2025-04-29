import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../index.css';
import TraineesTable from '../../components/TraineesTable';

const TraineesListPage = () => {
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentTrainee, setCurrentTrainee] = useState(null);
  const [formData, setFormData] = useState({
    cef: '',
    name: '',
    first_name: '',
    class: '',
    phone: ''
  });
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [filteredTrainees, setFilteredTrainees] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  
  useEffect(() => {
    loadTraineesData();
  }, []);
  
  useEffect(() => {
    filterTraineesByGroup();
  }, [selectedGroup, trainees, searchTerm]);
  
  const loadTraineesData = () => {
    try {
      setLoading(true);
      // Try to load from localStorage first
      const traineesJson = localStorage.getItem('traineesData') || '[]';
      let parsedTrainees = JSON.parse(traineesJson);
      
      // Filter out duplicates by CEF
      const uniqueTrainees = [];
      const cefMap = {};
      
      parsedTrainees.forEach(trainee => {
        const traineeCef = trainee.cef || trainee.CEF;
        if (!cefMap[traineeCef]) {
          cefMap[traineeCef] = true;
          
          // Ensure phone field is properly mapped from various possible sources
          if (!trainee.phone && (trainee.TEL || trainee.TELEPHONE || trainee.GSM || trainee.PORTABLE)) {
            trainee.phone = trainee.TEL || trainee.TELEPHONE || trainee.GSM || trainee.PORTABLE;
          }
          
          uniqueTrainees.push(trainee);
        }
      });
      
      // Log the first few trainees to verify data
      console.log('Loaded trainees data (first 3):', uniqueTrainees.slice(0, 3));
      
      // Extract all unique groups
      const groups = [...new Set(uniqueTrainees.map(trainee => 
        trainee.class || trainee.GROUPE || 'Non assigné'
      ))].filter(Boolean).sort();
      
      setTrainees(uniqueTrainees);
      setFilteredTrainees(uniqueTrainees);
      setAvailableGroups(groups);
      setLoading(false);
    } catch (e) {
      console.error('Error loading trainees data:', e);
      setError('Une erreur est survenue lors du chargement des données des stagiaires');
      setLoading(false);
    }
  };
  
  const filterTraineesByGroup = () => {
    let filtered = [...trainees];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(trainee => {
        const cef = (trainee.cef || trainee.CEF || '').toLowerCase();
        const name = (trainee.name || trainee.NOM || '').toLowerCase();
        const firstName = (trainee.first_name || trainee.PRENOM || '').toLowerCase();
        const group = (trainee.class || trainee.GROUPE || '').toLowerCase();
        const phone = (trainee.phone || '').toLowerCase();
        
        return cef.includes(searchLower) 
          || name.includes(searchLower) 
          || firstName.includes(searchLower)
          || group.includes(searchLower)
          || phone.includes(searchLower);
      });
    }
    
    // Filter by group if a group is selected
    if (selectedGroup) {
      filtered = filtered.filter(trainee => 
        (trainee.class || trainee.GROUPE) === selectedGroup
      );
    }
    
    // Sort the trainees by groupe first, then by name and first name
    filtered.sort((a, b) => {
      // First sort by groupe
      const groupA = (a.class || a.GROUPE || '').toLowerCase();
      const groupB = (b.class || b.GROUPE || '').toLowerCase();
      
      if (groupA !== groupB) {
        return groupA.localeCompare(groupB);
      }
      
      // Then sort by name
      const nameA = (a.name || a.NOM || '').toLowerCase();
      const nameB = (b.name || b.NOM || '').toLowerCase();
      
      if (nameA !== nameB) {
        return nameA.localeCompare(nameB);
      }
      
      // Finally sort by first name
      const firstNameA = (a.first_name || a.PRENOM || '').toLowerCase();
      const firstNameB = (b.first_name || b.PRENOM || '').toLowerCase();
      
      return firstNameA.localeCompare(firstNameB);
    });
    
    setFilteredTrainees(filtered);
  };
  
  const handleGroupChange = (e) => {
    setSelectedGroup(e.target.value);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleAddTrainee = () => {
    setCurrentTrainee(null);
    setFormData({
      cef: '',
      name: '',
      first_name: '',
      class: availableGroups.length > 0 ? availableGroups[0] : '',
      phone: ''
    });
    setShowModal(true);
  };
  
  const handleEditTrainee = (trainee) => {
    setCurrentTrainee(trainee);
    setFormData({
      cef: trainee.cef || trainee.CEF || '',
      name: trainee.name || trainee.NOM || '',
      first_name: trainee.first_name || trainee.PRENOM || '',
      class: trainee.class || trainee.GROUPE || '',
      phone: trainee.phone || trainee.TEL || trainee.TELEPHONE || trainee.GSM || trainee.PORTABLE || ''
    });
    setShowModal(true);
  };
  
  const handleDeleteTrainee = (trainee) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${trainee.name || trainee.NOM} ${trainee.first_name || trainee.PRENOM} ?`)) {
      try {
        const traineeCef = trainee.cef || trainee.CEF;
        const updatedTrainees = trainees.filter(t => (t.cef || t.CEF) !== traineeCef);
        
        // Update localStorage
        localStorage.setItem('traineesData', JSON.stringify(updatedTrainees));
        
        // Update state
        setTrainees(updatedTrainees);
        
        // Show success message
        showToast('Le stagiaire a été supprimé avec succès', 'success');
      } catch (error) {
        console.error('Error deleting trainee:', error);
        showToast('Une erreur est survenue lors de la suppression du stagiaire', 'error');
      }
    }
  };
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.cef || !formData.name || !formData.first_name || !formData.class) {
      showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    
    try {
      // Check if CEF already exists (when adding new trainee)
      if (!currentTrainee) {
        const existingTrainee = trainees.find(t => 
          (t.cef || t.CEF) === formData.cef
        );
        
        if (existingTrainee) {
          showToast('Un stagiaire avec ce CEF existe déjà', 'error');
          return;
        }
      }
      
      let updatedTrainees;
      
      if (currentTrainee) {
        // Update existing trainee
        updatedTrainees = trainees.map(t => {
          if ((t.cef || t.CEF) === (currentTrainee.cef || currentTrainee.CEF)) {
            return {
              ...t,
              cef: formData.cef,
              name: formData.name,
              first_name: formData.first_name,
              class: formData.class,
              phone: formData.phone
            };
          }
          return t;
        });
        
        showToast('Le stagiaire a été mis à jour avec succès', 'success');
      } else {
        // Add new trainee
        const newTrainee = {
          cef: formData.cef,
          name: formData.name,
          first_name: formData.first_name,
          class: formData.class,
          phone: formData.phone,
          absence_count: 0,
          created_at: new Date().toISOString()
        };
        
        updatedTrainees = [...trainees, newTrainee];
        showToast('Le stagiaire a été ajouté avec succès', 'success');
      }
      
      // Update localStorage
      localStorage.setItem('traineesData', JSON.stringify(updatedTrainees));
      
      // Update state
      setTrainees(updatedTrainees);
      
      // Close modal
      setShowModal(false);
    } catch (error) {
      console.error('Error saving trainee:', error);
      showToast('Une erreur est survenue lors de l\'enregistrement du stagiaire', 'error');
    }
  };
  
  const handleBack = () => {
    navigate('/sg');
  };
  
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 5000);
  };
  
  return (
    <div className="trainees-list-page">
      <div className="page-header">
        <h1 className="page-title">Liste des Stagiaires</h1>
      </div>

      <div className="main-container">
        <div className="control-panel">
          <div className="panel-content">
            <div className="top-controls">
              <button className="btn-back" onClick={handleBack}>
                <span className="btn-icon">←</span> Retour
              </button>
              
              <div className="filter-group">
                <label htmlFor="group-select">Filtrer par groupe:</label>
                <select
                  id="group-select"
                  className="select-input"
                  value={selectedGroup}
                  onChange={handleGroupChange}
                >
                  <option value="">Tous les groupes</option>
                  {availableGroups.map((group, index) => (
                    <option key={index} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              
              <div className="stats-display">
                <div className="stat-number">{filteredTrainees.length}</div>
                <div className="stat-label">Stagiaires {selectedGroup ? `dans ${selectedGroup}` : 'au total'}</div>
              </div>
              
              <button className="btn-add" onClick={handleAddTrainee}>
                <span className="btn-icon">+</span> Ajouter un stagiaire
              </button>
            </div>
          </div>
        </div>
        
        <div className="search-section">
          <div className="search-container">
            <i className="search-icon">🔍</i>
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, CEF..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="table-section">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-message">Chargement des données...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <i className="fas fa-exclamation-triangle error-icon"></i>
              <p className="error-message">{error}</p>
            </div>
          ) : (
            <div className="table-container">
              <TraineesTable 
                trainees={filteredTrainees}
                onEdit={handleEditTrainee}
                onDelete={handleDeleteTrainee}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Form Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{currentTrainee ? 'Modifier un stagiaire' : 'Ajouter un stagiaire'}</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleFormSubmit}>
                <div className="form-group">
                  <label htmlFor="cef">CEF*</label>
                  <input
                    type="text"
                    id="cef"
                    name="cef"
                    value={formData.cef}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="name">Nom*</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="first_name">Prénom*</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleFormChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="class">Groupe*</label>
                  <select
                    id="class"
                    name="class"
                    value={formData.class}
                    onChange={handleFormChange}
                    className="form-select"
                    required
                  >
                    <option value="">Sélectionner un groupe</option>
                    {availableGroups.map((group, index) => (
                      <option key={index} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Téléphone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleFormChange}
                    className="form-input"
                    placeholder="0600000000"
                  />
                </div>
                
                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowModal(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                  >
                    {currentTrainee ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast */}
      {toast.show && (
        <div className={`toast ${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' ? 
              <i className="fas fa-check-circle"></i> : 
              <i className="fas fa-exclamation-circle"></i>
            }
          </div>
          <div className="toast-content">{toast.message}</div>
        </div>
      )}
      
      <style jsx>{`
        .trainees-list-page {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f8f9fa;
          align-items: center;
        }
        
        .page-header {
          background: linear-gradient(135deg, #4568dc, #3f5efb);
          color: white;
          padding: 1.5rem 2rem;
          text-align: center;
          width: 100%;
          margin: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .page-title {
          font-size: 2.2rem;
          margin: 0;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .main-container {
          display: flex;
          flex-direction: column;
          flex: 1;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
        }
        
        .control-panel {
          background-color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          transition: all 0.3s ease;
        }
        
        .panel-content {
          width: 100%;
        }
        
        .top-controls {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
          width: 100%;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 0 0 auto;
        }
        
        .filter-group label {
          font-weight: 500;
          color: #495057;
        }
        
        .search-box {
          flex: 1;
          min-width: 280px;
          position: relative;
        }
        
        .search-box::before {
          content: "🔍";
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          z-index: 1;
        }
        
        .select-input, .search-input {
          padding: 0.75rem 1rem;
          border: 1px solid #dce4ec;
          border-radius: 6px;
          background-color: white;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }
        
        .select-input {
          min-width: 180px;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 30px;
        }
        
        .search-input {
          width: 100%;
          padding-left: 2.5rem;
        }
        
        .select-input:hover, .search-input:hover {
          border-color: #a3b9ef;
        }
        
        .select-input:focus, .search-input:focus {
          border-color: #4568dc;
          box-shadow: 0 0 0 3px rgba(69, 104, 220, 0.15);
        }
        
        .stats-display {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          background: linear-gradient(135deg, #4568dc20, #3f5efb10);
          padding: 0.75rem 1.25rem;
          border-radius: 6px;
          color: #3952bd;
          margin-left: auto;
          flex: 0 0 auto;
          border: 1px solid #d8e1fb;
        }
        
        .stat-number {
          font-size: 1.6rem;
          font-weight: 700;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          font-weight: 500;
          padding: 0.75rem 1.25rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          gap: 0.5rem;
        }
        
        .btn-back {
          background-color: #f1f5ff;
          color: #4568dc;
          border: 1px solid #d8e1fb;
        }
        
        .btn-back:hover {
          background-color: #e6edff;
          transform: translateY(-1px);
        }
        
        .btn-add {
          background: linear-gradient(135deg, #4caf50, #43a047);
          color: white;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }
        
        .btn-add:hover {
          background: linear-gradient(135deg, #43a047, #388e3c);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
        }
        
        .btn-icon {
          font-weight: bold;
          font-size: 1.1rem;
          line-height: 1;
        }
        
        .table-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .table-container {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          padding: 3rem;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(69, 104, 220, 0.1);
          border-top-color: #4568dc;
          border-radius: 50%;
          margin-bottom: 1.5rem;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .loading-message {
          color: #6c757d;
          font-size: 1.1rem;
        }
        
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #dc3545;
          flex: 1;
        }
        
        .error-icon {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
        }
        
        .error-message {
          font-size: 1.1rem;
          text-align: center;
          max-width: 600px;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(3px);
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal-content {
          background-color: white;
          border-radius: 12px;
          width: 90%;
          max-width: 550px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
          transform: translateY(0);
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          background: linear-gradient(135deg, #4568dc, #3f5efb);
          color: white;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 600;
        }
        
        .close-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          font-size: 1.5rem;
          color: white;
          cursor: pointer;
          opacity: 0.9;
          transition: all 0.2s;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        
        .close-button:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }
        
        .modal-body {
          padding: 2rem;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.6rem;
          font-weight: 500;
          color: #495057;
          font-size: 0.95rem;
        }
        
        .form-input,
        .form-select {
          width: 100%;
          padding: 0.85rem 1rem;
          border: 1px solid #dce4ec;
          border-radius: 6px;
          font-size: 1rem;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }
        
        .form-input:focus,
        .form-select:focus {
          border-color: #4568dc;
          outline: none;
          box-shadow: 0 0 0 3px rgba(69, 104, 220, 0.15);
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }
        
        .cancel-button {
          background-color: #f8f9fa;
          border: 1px solid #dce4ec;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s;
          color: #495057;
        }
        
        .cancel-button:hover {
          background-color: #e9ecef;
        }
        
        .submit-button {
          background: linear-gradient(135deg, #4568dc, #3f5efb);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(69, 104, 220, 0.3);
        }
        
        .submit-button:hover {
          background: linear-gradient(135deg, #3f5efb, #3452c7);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(69, 104, 220, 0.4);
        }
        
        /* Toast Styles */
        .toast {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-radius: 10px;
          color: white;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
          z-index: 1100;
          min-width: 320px;
          animation: slideIn 0.3s ease, slideOut 0.3s ease 4.7s;
          font-size: 1rem;
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        
        .toast.success {
          background: linear-gradient(135deg, #4caf50, #43a047);
        }
        
        .toast.error {
          background: linear-gradient(135deg, #dc3545, #c82333);
        }
        
        .toast-icon {
          font-size: 1.8rem;
        }
        
        .toast-content {
          font-weight: 500;
        }
        
        /* Responsive styles */
        @media (max-width: 992px) {
          .main-container {
            padding: 1rem;
          }
          
          .top-controls {
            gap: 1rem;
          }
        }
        
        @media (max-width: 768px) {
          .top-controls {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .filter-group, .search-box, .btn-add, .stats-display {
            width: 100%;
          }
          
          .stats-display {
            justify-content: flex-start;
            margin-left: 0;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
          }
          
          .filter-group {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .modal-content {
            width: 95%;
          }
          
          .toast {
            min-width: auto;
            width: calc(100% - 2rem);
            right: 1rem;
            bottom: 1rem;
          }
        }
        
        .search-section {
          margin-bottom: 1.5rem;
        }
        
        .search-container {
          position: relative;
          max-width: 100%;
        }
        
        .search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
          font-style: normal;
          z-index: 1;
        }
        
        .search-input {
          width: 100%;
          padding: 1rem 1rem 1rem 2.5rem;
          border: 1px solid #dce4ec;
          border-radius: 8px;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          background-color: white;
        }
        
        .search-input:hover {
          border-color: #a3b9ef;
        }
        
        .search-input:focus {
          border-color: #4568dc;
          box-shadow: 0 0 0 3px rgba(69, 104, 220, 0.15);
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default TraineesListPage; 