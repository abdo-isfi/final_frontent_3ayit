import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../index.css';

const TraineeCredentialsPage = () => {
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [availableGroups, setAvailableGroups] = useState([]);
  const [editingTrainee, setEditingTrainee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // New credential fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const navigate = useNavigate();
  
  useEffect(() => {
    loadTraineesData();
  }, []);
  
  const loadTraineesData = () => {
    try {
      setLoading(true);
      const traineesJson = localStorage.getItem('traineesData') || '[]';
      const parsedTrainees = JSON.parse(traineesJson);
      
      // Extract all unique groups
      const groups = [...new Set(parsedTrainees.map(trainee => 
        trainee.class || trainee.GROUPE || 'Non assigné'
      ))].filter(Boolean).sort();
      
      setTrainees(parsedTrainees);
      setAvailableGroups(groups);
      setLoading(false);
    } catch (e) {
      console.error('Error loading trainees data:', e);
      setError('Une erreur est survenue lors du chargement des données des stagiaires');
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleGroupFilter = (e) => {
    setFilterGroup(e.target.value);
  };
  
  const handleEditCredentials = (trainee) => {
    setEditingTrainee(trainee);
    // Generate default username based on CEF
    setUsername(trainee.username || `stagiaire${trainee.cef || trainee.CEF}`);
    // Generate a random password if not set
    setPassword(trainee.password || generateRandomPassword());
    setShowEditModal(true);
  };
  
  const generateRandomPassword = () => {
    // Generate a random 8 character password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
  
  const saveCredentials = () => {
    if (!editingTrainee) return;
    
    try {
      // Get all trainees data
      const traineesJson = localStorage.getItem('traineesData') || '[]';
      const allTrainees = JSON.parse(traineesJson);
      
      // Find and update the specific trainee
      const updatedTrainees = allTrainees.map(trainee => {
        const traineeCef = trainee.cef || trainee.CEF;
        const editingCef = editingTrainee.cef || editingTrainee.CEF;
        
        if (traineeCef === editingCef) {
          return {
            ...trainee,
            username: username,
            password: password,
            credentials_last_updated: new Date().toISOString()
          };
        }
        return trainee;
      });
      
      // Save updated data
      localStorage.setItem('traineesData', JSON.stringify(updatedTrainees));
      
      // Update state
      setTrainees(updatedTrainees);
      
      // Show success message
      setToast({
        show: true,
        message: "Les identifiants du stagiaire ont été mis à jour avec succès.",
        type: 'success'
      });
      
      // Close modal
      setShowEditModal(false);
      setEditingTrainee(null);
    } catch (error) {
      console.error('Error saving credentials:', error);
      setToast({
        show: true,
        message: "Une erreur est survenue lors de la mise à jour des identifiants.",
        type: 'error'
      });
    }
  };
  
  const resetAllCredentials = () => {
    if (!window.confirm('Êtes-vous sûr de vouloir réinitialiser les identifiants de tous les stagiaires? Cette action est irréversible.')) {
      return;
    }
    
    try {
      // Get all trainees data
      const traineesJson = localStorage.getItem('traineesData') || '[]';
      const allTrainees = JSON.parse(traineesJson);
      
      // Reset credentials for all trainees
      const updatedTrainees = allTrainees.map(trainee => {
        const cef = trainee.cef || trainee.CEF;
        return {
          ...trainee,
          username: `stagiaire${cef}`,
          password: generateRandomPassword(),
          credentials_last_updated: new Date().toISOString()
        };
      });
      
      // Save updated data
      localStorage.setItem('traineesData', JSON.stringify(updatedTrainees));
      
      // Update state
      setTrainees(updatedTrainees);
      
      // Show success message
      setToast({
        show: true,
        message: "Les identifiants de tous les stagiaires ont été réinitialisés avec succès.",
        type: 'success'
      });
    } catch (error) {
      console.error('Error resetting credentials:', error);
      setToast({
        show: true,
        message: "Une erreur est survenue lors de la réinitialisation des identifiants.",
        type: 'error'
      });
    }
  };
  
  const filteredTrainees = () => {
    let filtered = [...trainees];
    
    // Apply group filter
    if (filterGroup) {
      filtered = filtered.filter(trainee => 
        (trainee.class || trainee.GROUPE) === filterGroup
      );
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(trainee => {
        const name = (trainee.name || trainee.NOM || '').toLowerCase();
        const firstName = (trainee.first_name || trainee.PRENOM || '').toLowerCase();
        const cef = (trainee.cef || trainee.CEF || '').toString().toLowerCase();
        const username = (trainee.username || '').toLowerCase();
        
        return name.includes(term) || 
               firstName.includes(term) || 
               cef.includes(term) ||
               username.includes(term);
      });
    }
    
    return filtered;
  };
  
  const handleBack = () => {
    navigate('/sg');
  };
  
  const hideToast = () => {
    setToast({ ...toast, show: false });
  };
  
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        hideToast();
      }, 5000); // Hide after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [toast.show]);
  
  return (
    <div className="credentials-container">
      <h2 className="page-title">Gestion des Identifiants des Stagiaires</h2>
      
      <button className="back-button" onClick={handleBack}>
        ⬅ Retour
      </button>
      
      <div className="action-buttons">
        <button 
          className="reset-button"
          onClick={resetAllCredentials}
        >
          Réinitialiser tous les identifiants
        </button>
      </div>
      
      {/* Filters */}
      <div className="filters">
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
          <label htmlFor="search-input">Recherche:</label>
          <input 
            type="text"
            id="search-input"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Recherche par nom, CEF ou identifiant..."
            className="search-input"
          />
        </div>
      </div>
      
      {/* Trainees Table */}
      {loading ? (
        <div className="loading-message">Chargement des données des stagiaires...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="table-container">
          {filteredTrainees().length === 0 ? (
            <div className="no-data-message">
              Aucun stagiaire trouvé
              {filterGroup || searchTerm ? " avec les filtres sélectionnés" : ""}.
            </div>
          ) : (
            <table className="credentials-table">
              <thead>
                <tr>
                  <th>CEF</th>
                  <th>Nom et Prénom</th>
                  <th>Groupe</th>
                  <th>Nom d'utilisateur</th>
                  <th>Mot de passe</th>
                  <th>Dernière mise à jour</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrainees().map((trainee, index) => {
                  const cef = trainee.cef || trainee.CEF;
                  const name = trainee.name || trainee.NOM;
                  const firstName = trainee.first_name || trainee.PRENOM;
                  const group = trainee.class || trainee.GROUPE;
                  const username = trainee.username || `stagiaire${cef}`;
                  const password = trainee.password ? '••••••••' : 'Non défini';
                  const lastUpdated = trainee.credentials_last_updated ? 
                    new Date(trainee.credentials_last_updated).toLocaleDateString('fr-FR') : 
                    'Jamais';
                  
                  return (
                    <tr key={index}>
                      <td>{cef}</td>
                      <td>{name} {firstName}</td>
                      <td>{group}</td>
                      <td>{username}</td>
                      <td>{password}</td>
                      <td>{lastUpdated}</td>
                      <td>
                        <button 
                          className="edit-btn"
                          onClick={() => handleEditCredentials(trainee)}
                          title="Modifier les identifiants"
                        >
                          <i className="fas fa-key mr-1"></i> Modifier
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
      
      {/* Edit Credentials Modal */}
      {showEditModal && editingTrainee && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Modifier les identifiants</h2>
              <button className="close-button" onClick={() => setShowEditModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="trainee-info">
                <div className="info-row">
                  <div className="info-item">
                    <strong>CEF:</strong> {editingTrainee.cef || editingTrainee.CEF}
                  </div>
                  <div className="info-item">
                    <strong>Nom:</strong> {editingTrainee.name || editingTrainee.NOM} {editingTrainee.first_name || editingTrainee.PRENOM}
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-item">
                    <strong>Groupe:</strong> {editingTrainee.class || editingTrainee.GROUPE}
                  </div>
                </div>
              </div>
              
              <div className="credentials-form">
                <div className="form-group">
                  <label htmlFor="username">Nom d'utilisateur:</label>
                  <input 
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Mot de passe:</label>
                  <div className="password-input-group">
                    <input 
                      type="text"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                    />
                    <button 
                      className="generate-btn"
                      onClick={() => setPassword(generateRandomPassword())}
                      title="Générer un mot de passe aléatoire"
                    >
                      <i className="fas fa-dice"></i>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Annuler
                </button>
                <button
                  className="save-btn"
                  onClick={saveCredentials}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-container ${toast.show ? 'show' : ''}`}>
          <div className={`toast-notification ${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' ? 
                <i className="fas fa-check-circle"></i> : 
                <i className="fas fa-exclamation-circle"></i>
              }
            </div>
            <div className="toast-content">
              <p>{toast.message}</p>
            </div>
            <button className="toast-close" onClick={hideToast}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .credentials-container {
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
        
        .action-buttons {
          display: flex;
          justify-content: flex-end;
          margin-bottom: var(--space-5);
        }
        
        .reset-button {
          background-color: var(--danger);
          color: white;
          border: none;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--font-size-sm);
          transition: var(--transition-fast);
        }
        
        .reset-button:hover {
          background-color: var(--danger-dark);
          transform: translateY(-2px);
        }
        
        .filters {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-5);
          background-color: white;
          padding: var(--space-4);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        
        .filter-group label {
          font-weight: 500;
          color: var(--gray-700);
        }
        
        .select-input, .search-input {
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
        }
        
        .search-input {
          min-width: 300px;
        }
        
        .table-container {
          background-color: white;
          border-radius: var(--radius-md);
          padding: var(--space-4);
          box-shadow: var(--shadow-sm);
          overflow-x: auto;
        }
        
        .credentials-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .credentials-table th,
        .credentials-table td {
          padding: var(--space-3);
          text-align: left;
          border-bottom: 1px solid var(--gray-200);
        }
        
        .credentials-table th {
          background-color: var(--primary);
          color: white;
          font-weight: 600;
        }
        
        .credentials-table tbody tr:hover {
          background-color: var(--gray-100);
        }
        
        .edit-btn {
          background-color: var(--primary);
          color: white;
          border: none;
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--font-size-xs);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .edit-btn:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
        }
        
        .loading-message, .error-message, .no-data-message {
          padding: var(--space-6);
          text-align: center;
          color: var(--gray-600);
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
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal-content {
          background-color: white;
          border-radius: var(--radius-lg);
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--gray-200);
          background-color: var(--primary);
          color: white;
          border-top-left-radius: var(--radius-lg);
          border-top-right-radius: var(--radius-lg);
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: var(--font-size-xl);
          color: white;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: white;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        
        .close-button:hover {
          opacity: 1;
        }
        
        .modal-body {
          padding: var(--space-5);
        }
        
        .trainee-info {
          margin-bottom: var(--space-5);
          background-color: var(--gray-100);
          padding: var(--space-3);
          border-radius: var(--radius-md);
        }
        
        .info-row {
          display: flex;
          margin-bottom: var(--space-2);
        }
        
        .info-item {
          flex: 1;
        }
        
        .info-item strong {
          margin-right: var(--space-2);
          color: var(--gray-700);
        }
        
        .credentials-form {
          margin-bottom: var(--space-5);
        }
        
        .form-group {
          margin-bottom: var(--space-4);
        }
        
        .form-group label {
          display: block;
          margin-bottom: var(--space-2);
          font-weight: 500;
          color: var(--gray-700);
        }
        
        .form-input {
          width: 100%;
          padding: var(--space-3);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          font-size: var(--font-size-md);
        }
        
        .password-input-group {
          display: flex;
          gap: var(--space-2);
        }
        
        .generate-btn {
          background-color: var(--primary-light);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          padding: 0 var(--space-3);
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .generate-btn:hover {
          background-color: var(--primary);
        }
        
        .modal-actions {
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
          transition: all 0.2s ease;
        }
        
        .cancel-btn:hover {
          background-color: var(--gray-300);
        }
        
        .save-btn {
          background-color: var(--primary);
          color: white;
          border: none;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--font-size-sm);
          transition: all 0.2s ease;
        }
        
        .save-btn:hover {
          background-color: var(--primary-dark);
          transform: translateY(-2px);
        }
        
        /* Toast notification styles */
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          max-width: 400px;
          transform: translateX(420px);
          transition: transform 0.3s ease-in-out;
        }
        
        .toast-container.show {
          transform: translateX(0);
        }
        
        .toast-notification {
          display: flex;
          align-items: center;
          padding: 16px;
          border-radius: 8px;
          background-color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          margin-bottom: 10px;
          animation: slideInRight 0.3s, fadeOut 0.3s 4.7s;
          border-left: 4px solid;
        }
        
        .toast-notification.success {
          border-left-color: #28a745;
        }
        
        .toast-notification.error {
          border-left-color: #dc3545;
        }
        
        .toast-icon {
          font-size: 24px;
          margin-right: 12px;
        }
        
        .toast-notification.success .toast-icon {
          color: #28a745;
        }
        
        .toast-notification.error .toast-icon {
          color: #dc3545;
        }
        
        .toast-content {
          flex: 1;
        }
        
        .toast-content p {
          margin: 0;
          font-size: 14px;
          color: #333;
        }
        
        .toast-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          color: #aaa;
          padding: 0;
          margin-left: 8px;
          transition: color 0.2s;
        }
        
        .toast-close:hover {
          color: #666;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        
        /* Additional utilities */
        .mr-1 {
          margin-right: 0.25rem;
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .filters {
            flex-direction: column;
          }
          
          .search-input {
            min-width: unset;
            width: 100%;
          }
          
          .credentials-table {
            font-size: var(--font-size-xs);
          }
          
          .info-row {
            flex-direction: column;
          }
          
          .info-item {
            margin-bottom: var(--space-2);
          }
        }
      `}</style>
    </div>
  );
};

export default TraineeCredentialsPage; 