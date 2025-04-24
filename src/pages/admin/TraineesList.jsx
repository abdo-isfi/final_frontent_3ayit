import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TraineesList = () => {
  const [trainees, setTrainees] = useState([]);
  const [allTrainees, setAllTrainees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    cef: '',
    name: '',
    firstName: '',
    class: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  
  const navigate = useNavigate();

  // Fetch all trainees on initial load
  useEffect(() => {
    fetchAllTrainees();
    fetchClasses();
  }, []);

  const fetchAllTrainees = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching all trainees...');
      const response = await axios.get('/api/trainees');
      // Ensure we always have an array
      const traineesArray = Array.isArray(response.data) ? response.data : [];
      console.log('Trainees fetched:', traineesArray.length);
      setTrainees(traineesArray);
      setAllTrainees(traineesArray);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching trainees:', err);
      setError('Erreur lors du chargement des stagiaires. Veuillez réessayer.');
      setTrainees([]);
      setAllTrainees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/trainees/classes');
      const classesArray = Array.isArray(response.data) ? response.data : [];
      setClasses(classesArray);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setClasses([]);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = (e) => {
    e.preventDefault();
    setIsFiltering(true);
    
    // Filter trainees client-side
    const filteredTrainees = allTrainees.filter(trainee => {
      const matchCef = !filters.cef || 
        (trainee.cef && trainee.cef.toLowerCase().includes(filters.cef.toLowerCase()));
      
      const matchName = !filters.name || 
        (trainee.name && trainee.name.toLowerCase().includes(filters.name.toLowerCase()));
      
      const matchFirstName = !filters.firstName || 
        (trainee.first_name && trainee.first_name.toLowerCase().includes(filters.firstName.toLowerCase()));
      
      const matchClass = !filters.class || 
        (trainee.class && trainee.class === filters.class);
      
      return matchCef && matchName && matchFirstName && matchClass;
    });
    
    setTrainees(filteredTrainees);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const resetFilters = () => {
    setFilters({
      cef: '',
      name: '',
      firstName: '',
      class: ''
    });
    setTrainees(allTrainees); // Restore all trainees
    setIsFiltering(false);
    setCurrentPage(1); // Reset to first page
  };
  
  const handleViewDetails = (trainee) => {
    setSelectedTrainee(trainee);
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
    setSelectedTrainee(null);
  };

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };
  
  // Pagination logic - ensure trainees is an array before slicing
  const traineesList = Array.isArray(trainees) ? trainees : [];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTrainees = traineesList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(traineesList.length / itemsPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  const refreshList = () => {
    fetchAllTrainees();
  };

  // Styles
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem'
    },
    title: {
      color: '#333',
      fontSize: '2rem',
      textAlign: 'center',
      marginBottom: '2rem'
    },
    errorMessage: {
      backgroundColor: '#ffebee',
      color: '#c62828',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1rem',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    filterSection: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '2rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
    },
    filterTitle: {
      fontSize: '1.4rem',
      marginBottom: '1.2rem',
      color: '#2c3e50'
    },
    filterGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem'
    },
    filterItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    label: {
      fontSize: '0.9rem',
      fontWeight: 'bold',
      color: '#555'
    },
    input: {
      padding: '0.8rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '0.9rem',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      outline: 'none',
      '&:focus': {
        borderColor: '#3498db',
        boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)'
      }
    },
    select: {
      padding: '0.8rem',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '0.9rem',
      height: '2.8rem',
      backgroundColor: 'white',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      outline: 'none',
      '&:focus': {
        borderColor: '#3498db',
        boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.2)'
      }
    },
    filterButtons: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem'
    },
    applyButton: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: '0.8rem 1.5rem',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      transition: 'background-color 0.3s ease, transform 0.2s ease',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    resetButton: {
      backgroundColor: '#95a5a6',
      color: 'white',
      border: 'none',
      padding: '0.8rem 1.5rem',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      transition: 'background-color 0.3s ease, transform 0.2s ease',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    tableContainer: {
      overflowX: 'auto',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      marginBottom: '2rem'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left'
    },
    th: {
      backgroundColor: '#3498db',
      color: 'white',
      padding: '1.2rem 1rem',
      fontWeight: 'bold',
      borderBottom: '2px solid #2980b9'
    },
    td: {
      padding: '1.2rem 1rem',
      borderBottom: '1px solid #eee',
      color: '#333'
    },
    actionButton: {
      backgroundColor: '#2ecc71',
      color: 'white',
      border: 'none',
      padding: '0.6rem 1.2rem',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      transition: 'background-color 0.3s ease, transform 0.2s ease',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      gap: '0.5rem',
      marginTop: '1.5rem'
    },
    pageButton: {
      padding: '0.6rem 1rem',
      border: '1px solid #ddd',
      backgroundColor: 'white',
      cursor: 'pointer',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      fontWeight: 'bold'
    },
    activePageButton: {
      padding: '0.6rem 1rem',
      backgroundColor: '#3498db',
      color: 'white',
      borderColor: '#3498db',
      cursor: 'pointer',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      fontWeight: 'bold',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    backButton: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: '0.8rem 1.5rem',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'background-color 0.3s ease, transform 0.2s ease',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    refreshButton: {
      backgroundColor: '#9b59b6',
      color: 'white',
      border: 'none',
      padding: '0.8rem 1.5rem',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'background-color 0.3s ease, transform 0.2s ease',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
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
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '2rem',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      borderBottom: '1px solid #eee',
      paddingBottom: '1rem'
    },
    closeButton: {
      backgroundColor: 'transparent',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#555'
    },
    detailRow: {
      display: 'flex',
      marginBottom: '1rem',
      borderBottom: '1px solid #f0f0f0',
      paddingBottom: '1rem'
    },
    detailLabel: {
      fontWeight: 'bold',
      width: '30%',
      color: '#555'
    },
    detailValue: {
      width: '70%'
    },
    emptyState: {
      backgroundColor: '#f8f9fa',
      padding: '2rem',
      textAlign: 'center',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    },
    emptyStateText: {
      fontSize: '1.1rem',
      color: '#6c757d'
    },
    loadingState: {
      textAlign: 'center',
      padding: '3rem'
    },
    loadingText: {
      fontSize: '1.2rem',
      color: '#666'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button 
          style={styles.backButton} 
          onClick={() => navigate('/admin')}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2980b9'} 
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3498db'}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ← Retour au tableau de bord
        </button>
        
        <button 
          style={styles.refreshButton} 
          onClick={refreshList}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#8e44ad'} 
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#9b59b6'}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🔄 Rafraîchir
        </button>
      </div>
      
      <h1 style={styles.title}>Liste des Stagiaires</h1>
      
      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}
      
      <div style={styles.filterSection}>
        <h2 style={styles.filterTitle}>Filtres</h2>
        <form onSubmit={applyFilters}>
          <div style={styles.filterGrid}>
            <div style={styles.filterItem}>
              <label style={styles.label} htmlFor="cef">CEF</label>
              <input
                style={styles.input}
                type="text"
                id="cef"
                name="cef"
                value={filters.cef}
                onChange={handleFilterChange}
                placeholder="CEF"
              />
            </div>
            
            <div style={styles.filterItem}>
              <label style={styles.label} htmlFor="name">Nom</label>
              <input
                style={styles.input}
                type="text"
                id="name"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                placeholder="Nom"
              />
            </div>
            
            <div style={styles.filterItem}>
              <label style={styles.label} htmlFor="firstName">Prénom</label>
              <input
                style={styles.input}
                type="text"
                id="firstName"
                name="firstName"
                value={filters.firstName}
                onChange={handleFilterChange}
                placeholder="Prénom"
              />
            </div>
            
            <div style={styles.filterItem}>
              <label style={styles.label} htmlFor="class">Classe</label>
              <select
                style={styles.select}
                id="class"
                name="class"
                value={filters.class}
                onChange={handleFilterChange}
              >
                <option value="">Toutes les classes</option>
                {classes.map((className, index) => (
                  <option key={index} value={className}>{className}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={styles.filterButtons}>
            <button 
              type="button" 
              onClick={resetFilters} 
              style={styles.resetButton}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7f8c8d'} 
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#95a5a6'}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Réinitialiser
            </button>
            <button 
              type="submit" 
              style={styles.applyButton}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2980b9'} 
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3498db'}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Appliquer
            </button>
          </div>
        </form>
      </div>
      
      {loading ? (
        <div style={styles.loadingState}>
          <p style={styles.loadingText}>Chargement des données...</p>
        </div>
      ) : currentTrainees.length > 0 ? (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>CEF</th>
                  <th style={styles.th}>Nom</th>
                  <th style={styles.th}>Prénom</th>
                  <th style={styles.th}>Classe</th>
                  <th style={styles.th}>Date d'inscription</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentTrainees.map((trainee, index) => (
                  <tr key={trainee.id || index}>
                    <td style={styles.td}>{trainee.cef || 'N/A'}</td>
                    <td style={styles.td}>{trainee.name || 'N/A'}</td>
                    <td style={styles.td}>{trainee.first_name || 'N/A'}</td>
                    <td style={styles.td}>{trainee.class || 'N/A'}</td>
                    <td style={styles.td}>{formatDate(trainee.registration_date)}</td>
                    <td style={styles.td}>
                      <button 
                        style={styles.actionButton}
                        onClick={() => handleViewDetails(trainee)}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#27ae60'} 
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2ecc71'}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        Voir détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div style={styles.pagination}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => paginate(i + 1)}
                style={currentPage === i + 1 ? styles.activePageButton : styles.pageButton}
                onMouseOver={(e) => {
                  if(currentPage !== i + 1) {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }
                }}
                onMouseOut={(e) => {
                  if(currentPage !== i + 1) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>
            Aucun stagiaire trouvé. {isFiltering ? 'Essayez de modifier vos filtres.' : ''}
          </p>
        </div>
      )}
      
      {/* Modal for trainee details */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>Détails du stagiaire</h2>
              <button style={styles.closeButton} onClick={closeModal}>×</button>
            </div>
            
            <div>
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>CEF</div>
                <div style={styles.detailValue}>{selectedTrainee.cef || 'N/A'}</div>
              </div>
              
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>Nom</div>
                <div style={styles.detailValue}>{selectedTrainee.name || 'N/A'}</div>
              </div>
              
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>Prénom</div>
                <div style={styles.detailValue}>{selectedTrainee.first_name || 'N/A'}</div>
              </div>
              
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>Classe</div>
                <div style={styles.detailValue}>{selectedTrainee.class || 'N/A'}</div>
              </div>
              
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>Date d'inscription</div>
                <div style={styles.detailValue}>{formatDate(selectedTrainee.registration_date)}</div>
              </div>
              
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>Absences</div>
                <div style={styles.detailValue}>{selectedTrainee.absence_count || 0}</div>
              </div>
              
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>Source</div>
                <div style={styles.detailValue}>{selectedTrainee.import_source || 'Saisie manuelle'}</div>
              </div>
              
              <div style={styles.detailRow}>
                <div style={styles.detailLabel}>Date d'import</div>
                <div style={styles.detailValue}>{formatDate(selectedTrainee.imported_at)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraineesList; 