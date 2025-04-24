import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import logo from "../images/Logo-OFPPT.jpg";
import '../index.css'; // Use the main CSS file

const AdminNavbar = ({ onLogout }) => {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <img src={logo} alt="Logo Admin" />
        </div>

        <nav className="nav-menu">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Accueil
          </NavLink>
          <NavLink to="/admin/Gerer" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Gerer Groupes
          </NavLink>
          <NavLink to="/admin/Ajouter" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Formateurs
          </NavLink>
        </nav>

        <button onClick={onLogout} className="logout-button">
          Déconnexion
        </button>
      </div>
    </header>
  );
};

AdminNavbar.propTypes = {
  onLogout: PropTypes.func.isRequired,
};

export default AdminNavbar;
