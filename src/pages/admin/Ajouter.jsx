import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Ajouter = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    matricule: '',
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  // Generate unique ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    // Validation
    if (!formData.matricule || !formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs obligatoires');
      setIsSubmitting(false);
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide');
      setIsSubmitting(false);
      return;
    }
    
    // Password validation - at least 8 characters
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setIsSubmitting(false);
      return;
    }
    
    // Check if email already exists
    try {
      // Check in formateurs
      const formateurList = JSON.parse(localStorage.getItem('formateurs') || '[]');
      if (formateurList.some(f => f.email === formData.email)) {
        setError('Cette adresse email est déjà utilisée par un autre formateur');
        setIsSubmitting(false);
        return;
      }
      
      // Check in users
      const usersList = JSON.parse(localStorage.getItem('users') || '[]');
      if (usersList.some(u => u.email === formData.email)) {
        setError('Cette adresse email est déjà utilisée par un autre utilisateur');
        setIsSubmitting(false);
        return;
      }
    } catch (e) {
      console.error('Error checking existing users:', e);
    }
    
    // Add new formateur with ID
    try {
      const newFormateur = {
        ...formData,
        id: generateId(),
        groups: []
      };
      
      // Add to formateurs list
      const formateurs = JSON.parse(localStorage.getItem('formateurs') || '[]');
      formateurs.push(newFormateur);
      localStorage.setItem('formateurs', JSON.stringify(formateurs));
      
      // Add to users list for login
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      users.push({
        email: newFormateur.email,
        password: newFormateur.password,
        role: 'teacher',
        firstName: newFormateur.firstName,
        lastName: newFormateur.lastName,
        matricule: newFormateur.matricule,
        groups: [],
        mustChangePassword: true
      });
      localStorage.setItem('users', JSON.stringify(users));
      
      setSuccessMessage('Le formateur a été ajouté avec succès!');
      setIsSubmitting(false);
      
      // Reset form after successful submission
      setFormData({
        matricule: '',
        firstName: '',
        lastName: '',
        email: '',
        password: ''
      });
      
      // Redirect after a short delay to see the success message
      setTimeout(() => {
        navigate('/admin/gerer');
      }, 2000);
    } catch (e) {
      console.error('Error saving formateur:', e);
      setError('Une erreur est survenue lors de l\'ajout du formateur');
      setIsSubmitting(false);
    }
  };
  
  // Styles
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
    },
    header: {
      marginBottom: '2rem',
      textAlign: 'center',
    },
    title: {
      color: '#333',
      fontSize: '2rem',
      margin: 0,
    },
    form: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    formGroup: {
      marginBottom: '1.5rem',
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
      boxSizing: 'border-box',
    },
    buttonsContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '2rem',
    },
    button: {
      padding: '0.8rem 1.5rem',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'background-color 0.2s',
    },
    backButton: {
      backgroundColor: '#9E9E9E',
      color: 'white',
    },
    submitButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
    },
    errorMessage: {
      backgroundColor: '#ffebee',
      color: '#c62828',
      padding: '1rem',
      borderRadius: '4px',
      marginBottom: '1.5rem',
    },
    successMessage: {
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
      padding: '1rem',
      borderRadius: '4px',
      marginBottom: '1.5rem',
    },
    requiredIndicator: {
      color: '#F44336',
      marginLeft: '0.2rem',
    },
    passwordHelp: {
      fontSize: '0.8rem',
      color: '#666',
      marginTop: '0.5rem',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Ajouter un Formateur</h1>
      </div>
      
      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}
      
      {successMessage && (
        <div style={styles.successMessage}>
          {successMessage}
        </div>
      )}
      
      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="matricule">
            Matricule<span style={styles.requiredIndicator}>*</span>
          </label>
          <input
            style={styles.input}
            type="text"
            id="matricule"
            name="matricule"
            value={formData.matricule}
            onChange={handleChange}
            required
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="lastName">
            Nom<span style={styles.requiredIndicator}>*</span>
          </label>
          <input
            style={styles.input}
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="firstName">
            Prénom<span style={styles.requiredIndicator}>*</span>
          </label>
          <input
            style={styles.input}
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="email">
            Email<span style={styles.requiredIndicator}>*</span>
          </label>
          <input
            style={styles.input}
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label} htmlFor="password">
            Mot de passe<span style={styles.requiredIndicator}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              style={{...styles.input, paddingRight: '40px'}}
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
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
                color: '#555'
              }}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          <p style={styles.passwordHelp}>
            Le mot de passe doit contenir au moins 8 caractères.
          </p>
        </div>
        
        <div style={styles.buttonsContainer}>
          <button 
            type="button" 
            style={{...styles.button, ...styles.backButton}} 
            onClick={() => navigate('/admin/gerer')}
          >
            Retour
          </button>
          
          <button 
            type="submit" 
            style={{...styles.button, ...styles.submitButton}}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Ajout en cours...' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Ajouter;