import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import '../../index.css';

const Gerer = () => {
  const [formateurs, setFormateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormateur, setSelectedFormateur] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [scheduleFile, setScheduleFile] = useState(null);
  const [schedulePreview, setSchedulePreview] = useState(null);
  
  const navigate = useNavigate();

  // Load data from localStorage on component mount
  useEffect(() => {
    // Try to get groups from localStorage
    let storedGroups = [];
    try {
      // Try to get groups from localStorage - might come from Excel import
      const storedGroupsJson = localStorage.getItem('availableGroups');
      if (storedGroupsJson) {
        storedGroups = JSON.parse(storedGroupsJson);
      }
    } catch (e) {
      console.error('Error loading groups from localStorage:', e);
    }
    
    // If no groups in localStorage, use default groups
    if (!storedGroups || storedGroups.length === 0) {
      storedGroups = [
        'DEV101', 'DEV102', 'DEVOWFS201', 'DEVOWFS202', 'DEVOWFS203', 
        'DEVOWFS204', 'DEVOWFS205', 'ID101', 'ID102', 'ID103', 'ID104',
        'IDOSR201', 'IDOSR202', 'IDOSR203'
      ];
      localStorage.setItem('availableGroups', JSON.stringify(storedGroups));
    }
    
    setAvailableGroups(storedGroups);
    
    // Load teachers from localStorage instead of using mock data
    try {
      const storedFormateurs = localStorage.getItem('formateurs');
      if (storedFormateurs) {
        setFormateurs(JSON.parse(storedFormateurs));
      }
    } catch (e) {
      console.error('Error loading formateurs from localStorage:', e);
    }
    
    setLoading(false);
  }, []);

  // Save formateurs to localStorage whenever they change
  useEffect(() => {
    if (formateurs.length > 0) {
      localStorage.setItem('formateurs', JSON.stringify(formateurs));
      
      // Also update the users data for login
      updateUsersForLogin();
    }
  }, [formateurs]);
  
  // Update users data for login
  const updateUsersForLogin = () => {
    try {
      // Get existing users or create empty array
      const existingUsersJson = localStorage.getItem('users') || '[]';
      const existingUsers = JSON.parse(existingUsersJson);
      
      // Map formateurs to users format
      formateurs.forEach(formateur => {
        const existingUserIndex = existingUsers.findIndex(user => user.email === formateur.email);
        
        if (existingUserIndex >= 0) {
          // Update existing user's groups and password
          existingUsers[existingUserIndex].groups = formateur.groups || [];
          existingUsers[existingUserIndex].password = formateur.password;
          existingUsers[existingUserIndex].firstName = formateur.firstName;
          existingUsers[existingUserIndex].lastName = formateur.lastName;
          existingUsers[existingUserIndex].matricule = formateur.matricule;
        } else {
          // Add new user
          existingUsers.push({
            email: formateur.email,
            password: formateur.password,
            role: 'teacher',
            firstName: formateur.firstName,
            lastName: formateur.lastName,
            matricule: formateur.matricule,
            groups: formateur.groups || [],
            mustChangePassword: true
          });
        }
      });
      
      // Save updated users back to localStorage
      localStorage.setItem('users', JSON.stringify(existingUsers));
    } catch (e) {
      console.error('Error updating users for login:', e);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredFormateurs = formateurs.filter(formateur => 
    `${formateur.firstName} ${formateur.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formateur.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formateur.matricule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (formateur) => {
    setSelectedFormateur(formateur);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    // Remove from formateurs
    const updatedFormateurs = formateurs.filter(f => f.id !== selectedFormateur.id);
    setFormateurs(updatedFormateurs);
    
    // Save immediately to localStorage to prevent reappearing on refresh
    localStorage.setItem('formateurs', JSON.stringify(updatedFormateurs));
    
    // Also remove from users
    try {
      const usersJson = localStorage.getItem('users') || '[]';
      const users = JSON.parse(usersJson);
      const updatedUsers = users.filter(user => user.email !== selectedFormateur.email);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
    } catch (e) {
      console.error('Error removing user from login data:', e);
    }
    
    setShowDeleteModal(false);
    setSelectedFormateur(null);
  };

  const handleEdit = (formateur) => {
    setSelectedFormateur(formateur);
    setEditFormData({ ...formateur });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    
    // Update formateur in the state
    const updatedFormateurs = formateurs.map(f => 
      f.id === selectedFormateur.id ? { ...editFormData } : f
    );
    setFormateurs(updatedFormateurs);
    
    // Update in localStorage will happen via the useEffect
    
    setShowEditModal(false);
    setSelectedFormateur(null);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('formateurs-table').outerHTML;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(
      '<html>' +
        '<head>' +
          '<title>Liste des Formateurs</title>' +
          '<style>' +
            'body { font-family: Arial, sans-serif; }' +
            'table { width: 100%; border-collapse: collapse; }' +
            'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }' +
            'th { background-color: #00ed53; color: white; }' +
            'tr:nth-child(even) { background-color: #f2f2f2; }' +
            '.no-groups-message { color: #7f8c8d; font-style: italic; }' +
            '.groupes-list { list-style-type: none; padding: 0; margin: 0; }' +
            '.groupes-list li { background-color: #e3f2fd; color: #1976d2; padding: 3px 6px; border-radius: 4px; display: inline-block; margin: 2px; font-size: 0.9rem; }' +
            '.actions-cell, th:last-child, td:last-child { display: none; }' +
          '</style>' +
        '</head>' +
        '<body>' +
          '<h1 style="text-align: center; margin-bottom: 20px;">Liste des Formateurs</h1>' +
          printContent +
        '</body>' +
      '</html>'
    );
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };

  const handleDownloadPDF = () => {
    // Create a clean version of the table without the action column
    const tableClone = document.getElementById('formateurs-table').cloneNode(true);
    
    // Hide the last column (Actions)
    const headerCells = tableClone.querySelectorAll('th');
    const lastHeaderCell = headerCells[headerCells.length - 1];
    if (lastHeaderCell) lastHeaderCell.style.display = 'none';
    
    // Hide action cells in each row
    const rows = tableClone.querySelectorAll('tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length > 0) {
        const lastCell = cells[cells.length - 1];
        if (lastCell) lastCell.style.display = 'none';
      }
    });
    
    // Create a container with the table
    const container = document.createElement('div');
    container.innerHTML = '<h1 style="text-align: center; margin-bottom: 20px;">Liste des Formateurs</h1>';
    container.appendChild(tableClone);
    
    // Set PDF options
    const options = {
      margin: 10,
      filename: 'formateurs_table.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    
    // Generate and download PDF
    html2pdf().from(container).set(options).save();
  };

  const handleGroupManagement = (formateur) => {
    setSelectedFormateur(formateur);
    setSelectedGroups(formateur.groups || []);
    setShowGroupModal(true);
  };
  
  const handleGroupCheckboxChange = (group) => {
    setSelectedGroups(prevSelectedGroups => {
      if (prevSelectedGroups.includes(group)) {
        return prevSelectedGroups.filter(g => g !== group);
      } else {
        return [...prevSelectedGroups, group];
      }
    });
  };
  
  const saveGroupAssignments = () => {
    // Update formateur in the state
    const updatedFormateurs = formateurs.map(f => 
      f.id === selectedFormateur.id ? { ...f, groups: selectedGroups } : f
    );
    setFormateurs(updatedFormateurs);
    
    // Also update users for login to ensure groups are available to teachers
    // This will happen via the useEffect
    
    setShowGroupModal(false);
    setSelectedFormateur(null);
  };
  
  // Generate unique ID for new formateurs
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };
  
  // Handle add formateur button click
  const handleAddFormateur = () => {
    navigate('/admin/ajouter');
  };

  const handleScheduleUpload = (formateur) => {
    setSelectedFormateur(formateur);
    setScheduleFile(null);
    setSchedulePreview(null);
    
    // Check if teacher already has a schedule
    try {
      const schedulesJson = localStorage.getItem('teacherSchedules') || '{}';
      const schedules = JSON.parse(schedulesJson);
      
      if (schedules[formateur.id]) {
        setSchedulePreview(schedules[formateur.id]);
      }
    } catch (e) {
      console.error('Error loading existing schedule:', e);
    }
    
    setShowScheduleModal(true);
  };
  
  const handleScheduleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Allow images and PDF files
    if (!file.type.match('image.*') && file.type !== 'application/pdf') {
      alert('Veuillez sélectionner une image (PNG, JPEG) ou un fichier PDF');
      return;
    }
    
    setScheduleFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setSchedulePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  const saveSchedule = () => {
    if (!schedulePreview) {
      alert('Veuillez sélectionner une image de l\'emploi du temps');
      return;
    }
    
    try {
      // Get existing schedules or create empty object
      const schedulesJson = localStorage.getItem('teacherSchedules') || '{}';
      const schedules = JSON.parse(schedulesJson);
      
      // Save the schedule for this teacher
      schedules[selectedFormateur.id] = schedulePreview;
      
      // Save back to localStorage
      localStorage.setItem('teacherSchedules', JSON.stringify(schedules));
      
      // Update the user data as well
      const usersJson = localStorage.getItem('users') || '[]';
      let users = JSON.parse(usersJson);
      
      // Find the user corresponding to this teacher
      const userIndex = users.findIndex(u => u.email === selectedFormateur.email);
      if (userIndex >= 0) {
        // Add the schedule information and ID to the user
        users[userIndex].hasSchedule = true;
        users[userIndex].id = selectedFormateur.id; // Ensure the ID is saved for easier lookup
        localStorage.setItem('users', JSON.stringify(users));
      }
      
      // Close modal
      setShowScheduleModal(false);
      setSelectedFormateur(null);
      
      alert('Emploi du temps enregistré avec succès !');
    } catch (e) {
      console.error('Error saving schedule:', e);
      alert('Erreur lors de l\'enregistrement de l\'emploi du temps');
    }
  };

  // Styles
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
    },
    header: {
      marginBottom: '2rem',
      textAlign: 'center',
      position: 'relative',
    },
    navigationBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
    },
    backButton: {
      backgroundColor: '#2196F3',
      color: 'white',
      border: 'none',
      padding: '0.6rem 1.2rem',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '1rem',
      fontWeight: 'bold',
    },
    rightButtonsContainer: {
      display: 'flex',
      gap: '12px',
    },
    actionIconButton: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    },
    printButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
    },
    pdfButton: {
      backgroundColor: '#2196F3',
      color: 'white',
    },
    title: {
      color: '#333',
      fontSize: '2rem',
      margin: 0,
    },
    actionsContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
    },
    searchContainer: {
      flex: '1',
      maxWidth: '400px',
    },
    searchInput: {
      width: '100%',
      padding: '0.8rem 1rem',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '1rem',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    addButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      padding: '0.8rem 1.5rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'background-color 0.2s',
    },
    tableContainer: {
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      backgroundColor: '#4CAF50',
      color: 'white',
      fontWeight: 'bold',
      padding: '1rem',
      textAlign: 'left',
      borderBottom: '2px solid #e9ecef',
    },
    td: {
      padding: '1rem',
      borderBottom: '1px solid #e9ecef',
      color: '#444',
    },
    actionButtonsContainer: {
      display: 'flex',
      gap: '8px',
    },
    editButton: {
      backgroundColor: '#2196F3',
      color: 'white',
      border: 'none',
      padding: '0.4rem 0.8rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.85rem',
    },
    deleteButton: {
      backgroundColor: '#F44336',
      color: 'white',
      border: 'none',
      padding: '0.4rem 0.8rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.85rem',
    },
    groupButton: {
      backgroundColor: '#2196F3',
      color: 'white',
      border: 'none',
      padding: '0.4rem 0.8rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      transition: 'all 0.2s ease',
    },
    noAssignedGroups: {
      fontStyle: 'italic',
      color: '#999',
    },
    groupBadge: {
      display: 'inline-block',
      backgroundColor: '#e3f2fd',
      color: '#1976d2',
      padding: '6px 12px',
      borderRadius: '16px',
      margin: '0 4px 4px 0',
      fontSize: '0.85rem',
      border: '1px solid #bbdefb',
    },
    groupsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '2rem',
    },
    errorMessage: {
      backgroundColor: '#ffebee',
      color: '#c62828',
      padding: '1rem',
      borderRadius: '4px',
      marginBottom: '1.5rem',
      textAlign: 'center',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContainer: {
      backgroundColor: 'white',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '500px',
      padding: '2rem',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
    modalHeader: {
      marginBottom: '1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: '1.5rem',
      color: '#333',
      marginTop: 0,
      marginBottom: '0.5rem',
    },
    modalText: {
      marginBottom: '1.5rem',
      fontSize: '1rem',
      lineHeight: '1.5',
      color: '#555',
    },
    modalButtonsContainer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem',
      marginTop: '1.5rem',
    },
    cancelButton: {
      backgroundColor: '#9E9E9E',
      color: 'white',
      border: 'none',
      padding: '0.6rem 1.2rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
    },
    confirmDeleteButton: {
      backgroundColor: '#F44336',
      color: 'white',
      border: 'none',
      padding: '0.6rem 1.2rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
    },
    saveButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      padding: '0.6rem 1.2rem',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
    },
    formGroup: {
      marginBottom: '1rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: 'bold',
      color: '#333',
    },
    input: {
      width: '100%',
      padding: '0.8rem',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '1rem',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#888',
    },
    checkboxGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: '1rem',
      marginTop: '1rem',
      maxHeight: '300px',
      overflowY: 'auto',
      padding: '10px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      background: '#f9f9f9',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      padding: '10px 12px',
      borderRadius: '6px',
      transition: 'all 0.3s ease',
      fontWeight: 'bold',
    },
    checkboxLabelSelected: {
      backgroundColor: '#e3f2fd',
      border: '1px solid #2196F3',
      boxShadow: '0 2px 4px rgba(33, 150, 243, 0.2)',
    },
    checkboxLabelUnselected: {
      backgroundColor: 'white',
      border: '1px solid #ddd',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
    checkboxInput: {
      marginRight: '8px',
      transform: 'scale(1.2)',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.navigationBar}>
        <button 
          style={styles.backButton} 
          onClick={() => navigate('/admin')}
        >
          ← Retour
        </button>
        <div style={styles.rightButtonsContainer}>
          <button 
            style={{...styles.actionIconButton, ...styles.printButton}} 
            onClick={handlePrint}
            title="Imprimer"
          >
            <i className="fas fa-print"></i>
          </button>
          <button 
            style={{...styles.actionIconButton, ...styles.pdfButton}} 
            onClick={handleDownloadPDF}
            title="Télécharger PDF"
          >
            <i className="fas fa-file-pdf"></i>
          </button>
        </div>
      </div>

      <div style={styles.header}>
        <h1 style={styles.title}>Liste des Formateurs</h1>
      </div>
      
      <div style={styles.actionsContainer}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Rechercher par nom ou matricule..."
            value={searchTerm}
            onChange={handleSearch}
            style={styles.searchInput}
          />
        </div>
        
        <button 
          style={styles.addButton} 
          onClick={handleAddFormateur}
        >
          Ajouter un formateur
        </button>
      </div>
      
      {loading ? (
        <div style={styles.loadingContainer}>
          <p>Chargement des formateurs...</p>
        </div>
      ) : error ? (
        <div style={styles.errorMessage}>{error}</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table} id="formateurs-table">
            <thead>
              <tr>
                <th style={styles.th}>Matricule</th>
                <th style={styles.th}>Nom et Prénom</th>
                <th style={styles.th}>Groupes</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFormateurs.length > 0 ? (
                filteredFormateurs.map((formateur) => (
                  <tr key={formateur.id}>
                    <td style={styles.td}>{formateur.matricule}</td>
                    <td style={styles.td}>{`${formateur.lastName} ${formateur.firstName}`}</td>
                    <td style={styles.td}>
                      {formateur.groups && formateur.groups.length > 0 ? (
                        <div style={styles.groupsContainer}>
                          {formateur.groups.map(group => (
                            <span key={group} style={styles.groupBadge}>
                              {group}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={styles.noAssignedGroups}>Ce formateur n'a pas encore de groupes assignés</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtonsContainer}>
                        <button 
                          style={styles.editButton} 
                          onClick={() => handleEdit(formateur)}
                        >
                          Edit
                        </button>
                        <button 
                          style={styles.deleteButton} 
                          onClick={() => handleDelete(formateur)}
                        >
                          Supprimer
                        </button>
                        <button 
                          style={styles.groupButton} 
                          onClick={() => handleGroupManagement(formateur)}
                        >
                          Gérer groupe
                        </button>
                        <button 
                          style={{
                            ...styles.editButton,
                            backgroundColor: '#9C27B0',
                          }} 
                          onClick={() => handleScheduleUpload(formateur)}
                          title="Télécharger l'emploi du temps"
                        >
                          Emploi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    Aucun formateur n'a été ajouté. Cliquez sur "Ajouter un formateur" pour commencer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedFormateur && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Confirmer la suppression</h2>
            </div>
            <p style={styles.modalText}>
              Êtes-vous sûr de vouloir supprimer le formateur <strong>{`${selectedFormateur.lastName} ${selectedFormateur.firstName}`}</strong> ?
              Cette action ne peut pas être annulée.
            </p>
            <div style={styles.modalButtonsContainer}>
              <button 
                style={styles.cancelButton} 
                onClick={() => setShowDeleteModal(false)}
              >
                Annuler
              </button>
              <button 
                style={styles.confirmDeleteButton} 
                onClick={confirmDelete}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && selectedFormateur && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Modifier le formateur</h2>
            </div>
            <form onSubmit={handleUpdate}>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="edit-matricule">Matricule</label>
                <input
                  style={{
                    ...styles.input,
                    width: '100%',
                    boxSizing: 'border-box',
                    display: 'block'
                  }}
                  type="text"
                  id="edit-matricule"
                  name="matricule"
                  value={editFormData.matricule || ''}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="edit-lastName">Nom</label>
                <input
                  style={{
                    ...styles.input,
                    width: '100%',
                    boxSizing: 'border-box',
                    display: 'block'
                  }}
                  type="text"
                  id="edit-lastName"
                  name="lastName"
                  value={editFormData.lastName || ''}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="edit-firstName">Prénom</label>
                <input
                  style={{
                    ...styles.input,
                    width: '100%',
                    boxSizing: 'border-box',
                    display: 'block'
                  }}
                  type="text"
                  id="edit-firstName"
                  name="firstName"
                  value={editFormData.firstName || ''}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="edit-email">Email</label>
                <input
                  style={{
                    ...styles.input,
                    width: '100%',
                    boxSizing: 'border-box',
                    display: 'block'
                  }}
                  type="email"
                  id="edit-email"
                  name="email"
                  value={editFormData.email || ''}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="edit-password">Mot de passe</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    style={{
                      ...styles.input,
                      paddingRight: '40px',
                      width: '100%',
                      boxSizing: 'border-box',
                      display: 'block'
                    }}
                    type={showPassword ? "text" : "password"}
                    id="edit-password"
                    name="password"
                    value={editFormData.password || ''}
                    onChange={handleEditInputChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      color: '#555',
                      padding: '0',
                      margin: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '30px',
                      height: '30px'
                    }}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>
              <div style={styles.modalButtonsContainer}>
                <button 
                  type="button" 
                  style={styles.cancelButton} 
                  onClick={() => setShowEditModal(false)}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  style={styles.saveButton}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Group Management Modal */}
      {showGroupModal && selectedFormateur && (
        <div style={styles.modalOverlay}>
          <div style={{
            ...styles.modalContainer,
            maxWidth: '600px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>
            <div style={{
              ...styles.modalHeader,
              borderBottom: '1px solid #e0e0e0',
              paddingBottom: '15px',
            }}>
              <h2 style={{
                ...styles.modalTitle,
                fontSize: '1.6rem',
                color: '#1565C0',
              }}>Groupes - {selectedFormateur.firstName} {selectedFormateur.lastName}</h2>
              <button 
                style={{
                  ...styles.closeButton,
                  fontSize: '1.8rem',
                  color: '#555',
                }}
                onClick={() => setShowGroupModal(false)}
              >
                ×
              </button>
            </div>
            
            <div style={{marginBottom: '15px', marginTop: '15px'}}>
              <p style={{color: '#555', fontSize: '1rem', marginBottom: '15px'}}>
                Sélectionnez les groupes à assigner à ce formateur:
              </p>
              
              <div style={{marginBottom: '10px'}}>
                <span style={{fontWeight: 'bold', color: '#1976D2'}}>
                  {selectedGroups.length} groupe(s) sélectionné(s)
                </span>
              </div>
            </div>

            <div style={styles.checkboxGrid}>
              {availableGroups.map(group => {
                const isSelected = selectedGroups.includes(group);
                return (
                  <label
                    key={group}
                    style={{
                      ...styles.checkboxLabel,
                      ...(isSelected ? styles.checkboxLabelSelected : styles.checkboxLabelUnselected)
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleGroupCheckboxChange(group)}
                      style={styles.checkboxInput}
                    />
                    {group}
                  </label>
                );
              })}
            </div>
            
            <div style={{
              ...styles.modalButtonsContainer,
              marginTop: '25px',
            }}>
              <button 
                style={{
                  ...styles.cancelButton,
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  padding: '10px 20px',
                }}
                onClick={() => setShowGroupModal(false)}
              >
                Annuler
              </button>
              <button 
                style={{
                  ...styles.saveButton,
                  backgroundColor: '#1976D2',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  padding: '10px 20px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                }}
                onClick={saveGroupAssignments}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Schedule Upload Modal */}
      {showScheduleModal && selectedFormateur && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContainer, maxWidth: '600px'}}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                Emploi du temps pour {selectedFormateur.firstName} {selectedFormateur.lastName}
              </h2>
              <button 
                style={styles.closeButton} 
                onClick={() => setShowScheduleModal(false)}
              >
                ×
              </button>
            </div>
            
            <div style={{padding: '20px'}}>
              <p style={{marginBottom: '20px'}}>
                Téléchargez l'emploi du temps pour ce formateur. Les étudiants pourront le consulter depuis leur interface.
              </p>
              
              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontWeight: 'bold'
                }}>
                  Sélectionnez une image de l'emploi du temps (PNG, JPEG, PDF)
                </label>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={handleScheduleFileChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              {schedulePreview && (
                <div style={{
                  marginBottom: '20px',
                  textAlign: 'center',
                  border: '1px solid #eee',
                  padding: '10px',
                  borderRadius: '4px'
                }}>
                  <p style={{marginBottom: '10px', fontWeight: 'bold'}}>Aperçu :</p>
                  <img 
                    src={schedulePreview} 
                    alt="Aperçu de l'emploi du temps" 
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              )}
              
              <div style={styles.modalButtonsContainer}>
                <button 
                  style={styles.cancelButton} 
                  onClick={() => setShowScheduleModal(false)}
                >
                  Annuler
                </button>
                <button 
                  style={styles.saveButton} 
                  onClick={saveSchedule}
                  disabled={!schedulePreview}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gerer;