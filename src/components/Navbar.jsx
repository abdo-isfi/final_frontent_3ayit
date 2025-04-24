import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import "../index.css";
import icon from "../images/Logo-OFPPT.jpg";

const Navbar = ({ onLogout }) => {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <img src={icon} alt="OFPPT Logo" />
        </div>
        <ul className="nav-menu">
          <li className="nav-item">
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              end
            >
              Acceuil
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink 
              to="/emploi-du-temps" 
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              Emploi du Temps
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink 
              to="/gerer-absence" 
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              Gérer les Absences
            </NavLink>
          </li>
        </ul>
        <button onClick={onLogout} className="logout-button">
          Déconnexion
        </button>
      </div>
    </nav>
  );
};

Navbar.propTypes = {
  onLogout: PropTypes.func.isRequired
};

export default Navbar;