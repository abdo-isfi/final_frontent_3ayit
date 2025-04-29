import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import logo from "../images/Logo-OFPPT.jpg";
import "./SGNavbar.css";

const SGNavbar = ({ onLogout }) => {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <img src={logo} alt="Logo SG" />
        </div>

        <nav className="nav-menu">
          <NavLink to="/sg" end className="nav-link">
            Acceuil
          </NavLink>
          <NavLink to="/sg/dashboard" className="nav-link">
            Tableau de Bord
          </NavLink>
          <NavLink to="/sg/gerer-stagiaires" className="nav-link">
            Stagiaires
          </NavLink>
          <NavLink to="/sg/trainees-list" className="nav-link">
            Liste Stagiaires
          </NavLink>
          <NavLink to="/sg/gerer-formateurs" className="nav-link">
            Formateurs
          </NavLink>
          <NavLink to="/sg/absence" className="nav-link">
            Absences
          </NavLink>
        </nav>

        <button onClick={onLogout} className="nav-logout-btn">
          Déconnexion
        </button>
      </div>
    </header>
  );
};

SGNavbar.propTypes = {
  onLogout: PropTypes.func.isRequired,
};

export default SGNavbar;
