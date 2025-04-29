import React from 'react';
import PropTypes from 'prop-types';
import '../index.css';

const TraineesTable = ({ 
  trainees, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="trainees-table-container">
      <div className="table-wrapper">
        <table className="trainees-table">
          <thead>
            <tr>
              <th width="15%">CEF</th>
              <th width="32%">NOM & PRÉNOM</th>
              <th width="15%">TÉLÉPHONE</th>
              <th width="20%">GROUPE</th>
              <th width="18%">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {trainees.length > 0 ? (
              trainees.map((trainee, index) => (
                <tr key={trainee.cef || trainee.CEF || index}>
                  <td>{trainee.cef || trainee.CEF}</td>
                  <td>
                    <div className="full-name">
                      <span className="lastname">{trainee.name || trainee.NOM}</span>
                      <span className="firstname">{trainee.first_name || trainee.PRENOM}</span>
                    </div>
                  </td>
                  <td>{trainee.phone || trainee.TEL || trainee.TELEPHONE || trainee.GSM || trainee.PORTABLE || "-"}</td>
                  <td>{trainee.class || trainee.GROUPE}</td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn edit-btn" 
                      onClick={() => onEdit(trainee)}
                      title="Modifier"
                    >
                      <i className="fas fa-edit"></i> Modifier
                    </button>
                    <button 
                      className="action-btn delete-btn" 
                      onClick={() => onDelete(trainee)}
                      title="Supprimer"
                    >
                      <i className="fas fa-trash"></i> Supprimer
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  Aucun stagiaire trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .trainees-table-container {
          width: 100%;
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: white;
        }
        
        .table-wrapper {
          flex: 1;
          overflow-x: auto;
          overflow-y: auto;
          width: 100%;
          border-radius: 6px;
          max-width: 100%;
        }
        
        .trainees-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 0.95rem;
        }
        
        .trainees-table th,
        .trainees-table td {
          padding: 0.85rem 1rem;
          text-align: left;
          border-bottom: 1px solid #e9ecef;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .full-name {
          display: flex;
          flex-direction: column;
        }
        
        .lastname {
          font-weight: 600;
          color: #333;
        }
        
        .firstname {
          color: #555;
          margin-top: 2px;
        }
        
        .trainees-table th {
          background: linear-gradient(135deg, #4568dc, #3f5efb);
          color: white;
          font-weight: 600;
          position: sticky;
          top: 0;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .trainees-table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .trainees-table tr:hover {
          background-color: #e3eaff;
          transition: background-color 0.2s ease;
        }
        
        .actions-cell {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-start;
          flex-wrap: nowrap;
        }
        
        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          min-width: auto;
          height: 30px;
          border-radius: 6px;
          border: none;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.75rem;
          padding: 0 0.6rem;
          font-weight: 500;
          white-space: nowrap;
        }
        
        .edit-btn {
          background: linear-gradient(135deg, #4568dc, #3f5efb);
          box-shadow: 0 2px 4px rgba(69, 104, 220, 0.2);
        }
        
        .edit-btn:hover {
          background: linear-gradient(135deg, #3f5efb, #3452c7);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(69, 104, 220, 0.3);
        }
        
        .delete-btn {
          background: linear-gradient(135deg, #dc3545, #c82333);
          box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
        }
        
        .delete-btn:hover {
          background: linear-gradient(135deg, #c82333, #bd2130);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
        }
        
        .no-data {
          text-align: center;
          color: #6c757d;
          padding: 2rem !important;
          font-size: 1.1rem;
          background-color: #f8f9fa;
        }
        
        @media (max-width: 768px) {
          .trainees-table th,
          .trainees-table td {
            padding: 0.75rem 0.6rem;
            font-size: 0.8rem;
          }
          
          .trainees-table th:nth-child(1),
          .trainees-table td:nth-child(1) {
            width: 20%;
          }
          
          .trainees-table th:nth-child(2),
          .trainees-table td:nth-child(2) {
            width: 32%;
          }
          
          .trainees-table th:nth-child(3),
          .trainees-table td:nth-child(3) {
            width: 15%;
          }
          
          .trainees-table th:nth-child(4),
          .trainees-table td:nth-child(4) {
            width: 15%;
          }
          
          .trainees-table th:nth-child(5),
          .trainees-table td:nth-child(5) {
            width: 18%;
          }
          
          .actions-cell {
            flex-direction: row;
            gap: 0.3rem;
            justify-content: flex-start;
          }
          
          .action-btn {
            width: auto;
            padding: 0 0.4rem;
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
};

TraineesTable.propTypes = {
  trainees: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default TraineesTable; 