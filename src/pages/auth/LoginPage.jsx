import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../../index.css"; // Ensure path is correct
import logo from "../../images/Logo-OFPPT.jpg";

const LoginPage = ({ setIsAuthenticated, setUserRole }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Password change modal
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Veuillez entrer un email et un mot de passe");
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError("Veuillez entrer un email valide");
      setLoading(false);
      return;
    }

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    // Check user credentials against localStorage
    setTimeout(() => {
      // First check hardcoded admin and SG accounts
      if (email === "admin@example.com" && password === "admin123") {
        handleSuccessfulLogin("admin");
        navigate("/admin");
        return;
      } else if (email === "sg@example.com" && password === "sg123") {
        handleSuccessfulLogin("sg");
        navigate("/sg");
        return;
      } 
      
      // Then check users in localStorage
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email);
        
        if (user && user.password === password) {
          // If user needs to change password, show the modal
          if (user.mustChangePassword) {
            setCurrentUser(user);
            setShowPasswordChangeModal(true);
            setLoading(false);
            return;
          }
          
          // Normal login for teachers
          handleSuccessfulLogin("teacher", user);
          navigate("/");
          return;
        }
      } catch (e) {
        console.error('Error checking user credentials:', e);
      }
      
      // If we get here, login failed
      setError("Email ou mot de passe incorrect");
      setLoading(false);
    }, 1000);
  };
  
  // Handle successful login
  const handleSuccessfulLogin = (role, userData = null) => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userRole", role);
    
    // If we have user data, store it for use in the app
    if (userData) {
      localStorage.setItem("currentUser", JSON.stringify({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        matricule: userData.matricule,
        groups: userData.groups || []
      }));
    }
    
    setLoading(false);
  };
  
  // Handle password change
  const handlePasswordChange = () => {
    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    
    try {
      // Update users array
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.email === currentUser.email);
      
      if (userIndex >= 0) {
        // Update user password and set mustChangePassword to false
        users[userIndex].password = newPassword;
        users[userIndex].mustChangePassword = false;
        
        // Save back to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        
        // Also update the formateurs array if this is a teacher
        const formateurs = JSON.parse(localStorage.getItem('formateurs') || '[]');
        const formateurIndex = formateurs.findIndex(f => f.email === currentUser.email);
        
        if (formateurIndex >= 0) {
          formateurs[formateurIndex].password = newPassword;
          localStorage.setItem('formateurs', JSON.stringify(formateurs));
        }
        
        // Complete login
        handleSuccessfulLogin("teacher", users[userIndex]);
        setShowPasswordChangeModal(false);
        navigate("/");
      } else {
        setError("Utilisateur non trouvé");
      }
    } catch (e) {
      console.error('Error updating password:', e);
      setError("Une erreur est survenue lors du changement de mot de passe");
    }
  };

  // Styles for password change modal
  const modalStyles = {
    overlay: {
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
    container: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '500px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    },
    title: {
      fontSize: '1.5rem',
      color: '#333',
      marginTop: 0,
      marginBottom: '1rem',
    },
    messageBox: {
      padding: '1rem',
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
      borderRadius: '4px',
      marginBottom: '1.5rem',
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
      justifyContent: 'flex-end',
      gap: '1rem',
      marginTop: '1.5rem',
    },
    button: {
      padding: '0.8rem 1.5rem',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
    },
    saveButton: {
      backgroundColor: '#4CAF50',
      color: 'white',
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img src={logo} alt="OFPPT Logo" className="logo" />
          <h1>ISTA NTIC</h1>
          <p>Système de Gestion des Absences</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Entrez votre email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Entrez votre mot de passe"
                style={{ width: '100%', paddingRight: '40px' }}
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
          </div>

          <div className="form-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">Se souvenir de moi</label>
            </div>
            <a href="#" className="forgot-password">Mot de passe oublié ?</a>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>

          {error && (
            <div className="error-alert">
              <p>{error}</p>
            </div>
          )}
        </form>
      </div>
      
      {/* Password Change Modal */}
      {showPasswordChangeModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.container}>
            <h2 style={modalStyles.title}>Changement de mot de passe requis</h2>
            
            <div style={modalStyles.messageBox}>
              <p>Vous devez changer votre mot de passe lors de votre première connexion.</p>
            </div>
            
            {error && (
              <div className="error-alert">
                <p>{error}</p>
              </div>
            )}
            
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label} htmlFor="newPassword">Nouveau mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={{...modalStyles.input, paddingRight: '40px'}}
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength="8"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
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
                  {showNewPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label} htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={{...modalStyles.input, paddingRight: '40px'}}
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>
            
            <div style={modalStyles.buttonsContainer}>
              <button 
                type="button" 
                style={{...modalStyles.button, ...modalStyles.saveButton}}
                onClick={handlePasswordChange}
              >
                Changer le mot de passe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage; 