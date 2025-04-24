import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../index.css';
import * as XLSX from 'xlsx';

const UploadStagiaire = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const formRef = useRef(null);
  const iframeRef = useRef(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Direct Laravel backend URL
  const BACKEND_URL = 'http://127.0.0.1:8000';

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = selectedFile.name.toLowerCase();
    const isValidType = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (isValidType) {
      setFile(selectedFile);
      setFeedback({ message: `Fichier sélectionné: ${selectedFile.name}`, type: 'info' });
      setUploadSuccess(false);
    } else {
      setFeedback({ message: 'Format de fichier non valide. Veuillez sélectionner un fichier Excel (.xlsx, .xls)', type: 'error' });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleDirectSubmit = () => {
    // Redirect to the test page on the Laravel backend for manual upload
    window.open(`${BACKEND_URL}/test`, '_blank');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setFeedback({ message: 'Veuillez sélectionner un fichier Excel', type: 'error' });
      return;
    }

    setIsLoading(true);
    setFeedback({ message: 'Importation en cours...', type: 'info' });

    // Submit the form directly to the backend using a hidden iframe
    if (formRef.current) {
      // Use the fallback-upload endpoint which is exempted from CSRF protection
      formRef.current.action = `${BACKEND_URL}/fallback-upload`;
      formRef.current.target = "uploadTarget"; // Target the hidden iframe
      formRef.current.submit();
      
      // Handle the iframe load event to detect when the upload is complete
      if (iframeRef.current) {
        iframeRef.current.onload = () => {
          setIsLoading(false);
          setUploadSuccess(true);
          setFeedback({ 
            message: 'Importation réussie! Le fichier a été correctement importé.', 
            type: 'success' 
          });
          
          // Reset the form to allow another upload
          setFile(null);
          if (formRef.current) {
            formRef.current.reset();
          }
        };
      }
    } else {
      setFeedback({ 
        message: 'Erreur lors de la soumission du formulaire.', 
        type: 'error' 
      });
      setIsLoading(false);
    }
  };

  const handleNewUpload = () => {
    setFile(null);
    setFeedback({ message: '', type: '' });
    setUploadSuccess(false);
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  // Add utility function to parse the absence calendar range from Excel
  const extractAbsenceCalendarData = (worksheet, students) => {
    if (!worksheet || !students || students.length === 0) return {};
    
    // Create a mapping of student CEFs for faster lookup
    const studentMap = {};
    students.forEach(student => {
      const cef = student.cef || student.CEF;
      if (cef) {
        studentMap[cef] = student;
      }
    });
    
    // Initialize absence data structure
    const absenceData = {};
    
    try {
      // Define the range for the absence calendar (R2 to LJ354)
      // Column R is 18 (0-indexed would be 17)
      // Column LJ is column 312
      const startCol = 18; // Column R (1-indexed)
      const endCol = 312;  // Column LJ (1-indexed)
      const startRow = 5;  // Row 5 (as per user requirements)
      const endRow = 354;  // Row 354 (as per user requirements)
      
      // Get the header row to extract dates (assuming row 4 contains dates)
      const headerRow = 4;
      const dates = [];
      
      // Extract dates from the header row
      for (let col = startCol; col <= endCol; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRow - 1, c: col - 1 }); // Convert to 0-indexed
        const cell = worksheet[cellRef];
        
        if (cell && cell.v) {
          // Check if it's a date value or a string representation
          let date;
          if (cell.t === 'd') {
            // It's already a date
            date = cell.v;
          } else if (typeof cell.v === 'number' && cell.v > 25000) {
            // Excel date number (days since 1900-01-01)
            date = new Date(Math.round((cell.v - 25569) * 86400 * 1000));
          } else if (typeof cell.v === 'string') {
            // Try to parse as date string
            date = new Date(cell.v);
          }
          
          // Format the date as ISO string for consistency
          const formattedDate = date instanceof Date && !isNaN(date) 
            ? date.toISOString().split('T')[0] 
            : null;
            
          dates.push({ 
            col, 
            date: formattedDate || `Column-${col}` 
          });
        } else {
          dates.push({ col, date: `Column-${col}` });
        }
      }
      
      // Process each row (each student)
      for (let row = startRow; row <= endRow; row++) {
        // Get the student CEF from column B (2)
        const cefCellRef = XLSX.utils.encode_cell({ r: row - 1, c: 1 }); // Column B, 0-indexed
        const cefCell = worksheet[cefCellRef];
        
        if (!cefCell || !cefCell.v) continue;
        
        const studentCef = String(cefCell.v);
        if (!studentMap[studentCef]) continue;
        
        // Initialize absences array for this student
        if (!absenceData[studentCef]) {
          absenceData[studentCef] = [];
        }
        
        // Check each date column for this student
        dates.forEach(({ col, date }) => {
          const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 }); // Convert to 0-indexed
          const cell = worksheet[cellRef];
          
          // If cell has a value that indicates absence (typically "A", "1", "X" or similar)
          if (cell && cell.v) {
            const value = String(cell.v).trim().toUpperCase();
            if (value === 'A' || value === '1' || value === 'X' || value === 'ABS') {
              // Found an absence marker
              // Get student name
              const student = studentMap[studentCef];
              const fullName = `${student.name || student.NOM || ''} ${student.first_name || student.PRENOM || ''}`.trim();
              
              // Create absence record
              absenceData[studentCef].push({
                date,
                status: 'absent',
                fromExcel: true,
                startTime: '08:30', // Default time
                endTime: '18:30',   // Default time
                teacher: 'Import Excel',
                groupe: student.class || student.GROUPE || ''
              });
            }
          }
        });
      }
      
      return absenceData;
    } catch (error) {
      console.error('Error extracting absence calendar data:', error);
      return {};
    }
  };

  // Add this function to clear all localStorage data related to absences
  const clearAllAbsenceData = () => {
    // Clear all absence-related data from localStorage
    localStorage.removeItem('studentAbsences');
    localStorage.removeItem('absenceRecords');
    localStorage.removeItem('absences');
    localStorage.removeItem('traineeAbsenceHistory');
    localStorage.removeItem('traineeAbsenceCalendar');
    
    // Make sure the last data import timestamp is updated
    localStorage.setItem('lastDataImport', new Date().toISOString());
  };

  const handleUpload = async () => {
    if (!file) {
      setFeedback({ type: 'error', message: 'Veuillez sélectionner un fichier' });
      return;
    }

    setIsLoading(true);
    setFeedback({ type: 'info', message: 'Traitement du fichier en cours...' });

    try {
      // First, clear all existing absence data
      clearAllAbsenceData();
      
      // Read the file data
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Extract trainee data - process rows starting from row 5
      const startRow = 5;
      const trainees = [];
      
      // Keep going until we find an empty row
      let row = startRow;
      let isEmpty = false;
      
      while (!isEmpty) {
        // Check CEF (Column B)
        const cefCellRef = XLSX.utils.encode_cell({ r: row - 1, c: 1 }); // Column B, 0-indexed
        const cefCell = worksheet[cefCellRef];
        
        // If no CEF, consider it an empty row and stop
        if (!cefCell || !cefCell.v) {
          isEmpty = true;
          continue;
        }
        
        // Get name (Column C)
        const nameCellRef = XLSX.utils.encode_cell({ r: row - 1, c: 2 }); // Column C, 0-indexed
        const nameCell = worksheet[nameCellRef];
        
        // Get first name (Column D)
        const firstNameCellRef = XLSX.utils.encode_cell({ r: row - 1, c: 3 }); // Column D, 0-indexed
        const firstNameCell = worksheet[firstNameCellRef];
        
        // Get class/group (Column E)
        const classCellRef = XLSX.utils.encode_cell({ r: row - 1, c: 4 }); // Column E, 0-indexed
        const classCell = worksheet[classCellRef];
        
        // Create trainee object with absence_count set to 0
        const trainee = {
          cef: cefCell.v.toString(),
          name: nameCell ? nameCell.v.toString() : '',
          first_name: firstNameCell ? firstNameCell.v.toString() : '',
          class: classCell ? classCell.v.toString() : '',
          GROUPE: classCell ? classCell.v.toString() : '', // Add GROUPE alias for compatibility
          CEF: cefCell.v.toString(), // Add CEF alias for compatibility
          NOM: nameCell ? nameCell.v.toString() : '', // Add NOM alias for compatibility
          PRENOM: firstNameCell ? firstNameCell.v.toString() : '', // Add PRENOM alias for compatibility
          absence_count: 0 // Always initialize to 0
        };
        
        trainees.push(trainee);
        
        // Move to next row
        row++;
      }
      
      // Initialize empty absence data instead of extracting from Excel
      const absenceData = {};
      trainees.forEach(trainee => {
        absenceData[trainee.cef] = [];
      });
      
      // Store trainees data in localStorage with absence_count set to 0
      localStorage.setItem('traineesData', JSON.stringify(trainees));
      localStorage.setItem('lastDataImport', new Date().toISOString());
      
      // Extract unique groups and save them
      const uniqueGroups = [...new Set(trainees.map(trainee => trainee.class).filter(Boolean))];
      localStorage.setItem('availableGroups', JSON.stringify(uniqueGroups.sort()));
      
      // Initialize empty absence data structure
      const emptyAbsences = {};
      trainees.forEach(trainee => {
        emptyAbsences[trainee.cef] = [];
      });
      
      // Save empty absences to localStorage
      localStorage.setItem('studentAbsences', JSON.stringify(emptyAbsences));
      
      // Show success message with counts
      const totalStudents = trainees.length;
      
      setFeedback({
        type: 'success',
        message: `Importation réussie! ${totalStudents} stagiaires importés de l'Excel. Toutes les absences ont été réinitialisées à 0.`
      });
      
      // Reset file input
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Set upload success to show the success screen
      setUploadSuccess(true);
    } catch (error) {
      console.error('Error processing Excel file:', error);
      setFeedback({
        type: 'error',
        message: `Erreur lors du traitement du fichier: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2 className="upload-title">Importer la Liste des Stagiaires</h2>
    
      {/* Hidden iframe for form submission */}
      <iframe 
        ref={iframeRef}
        name="uploadTarget" 
        style={{ display: 'none' }}
        title="Upload Target"
      ></iframe>
      
      {uploadSuccess ? (
        <div className="success-container">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Importation Réussie!</h3>
            <p>Votre fichier a été téléchargé et traité avec succès.</p>
            <div className="button-group">
              <button 
                className="new-upload-btn"
                onClick={handleNewUpload}
              >
                Importer un autre fichier
              </button>
              <button 
                className="view-list-btn"
                onClick={() => navigate('/sg/liste-stagiaires')}
              >
                Voir la liste des stagiaires
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Traditional form that posts directly to Laravel backend */
        <form 
          ref={formRef}
          onSubmit={handleSubmit} 
          method="POST" 
          encType="multipart/form-data" 
          className="upload-form"
        >
          <div 
            className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon">
              <i className="fa fa-cloud-upload"></i>
            </div>
            <p>Glissez et déposez votre fichier Excel ici</p>
            <p>OU</p>
            <label className="upload-btn">
              Sélectionner un fichier
              <input 
                type="file" 
                name="file"
                accept=".xlsx,.xls" 
                onChange={handleFileChange} 
                hidden 
                ref={fileInputRef}
              />
            </label>
            {file && (
              <div className="file-info">
                <p>Fichier: {file.name}</p>
                <p>Taille: {(file.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
          </div>

          {feedback.message && (
            <div className={`feedback-message ${feedback.type}`}>
              {feedback.message}
            </div>
          )}

          <div className="button-group">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => navigate('/sg/liste-stagiaires')}
            >
              Annuler
            </button>
            
            <button
              type="button"
              className="direct-btn"
              onClick={handleDirectSubmit}
            >
              Page d'importation directe
            </button>
            
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={!file || isLoading}
            >
              {isLoading ? 'Importation...' : 'Importer les stagiaires'}
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .upload-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .upload-title {
          text-align: center;
          margin-bottom: 20px;
          color: #333;
        }
        
        .upload-form {
          margin-top: 20px;
        }
        
        .upload-zone {
          border: 2px dashed #ccc;
          border-radius: 5px;
          padding: 40px;
          text-align: center;
          margin-bottom: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .upload-zone.dragover {
          background-color: #f0f8ff;
          border-color: #007bff;
        }
        
        .upload-icon {
          font-size: 48px;
          color: #999;
          margin-bottom: 15px;
        }
        
        .upload-btn {
          background-color: #007bff;
          color: white;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          display: inline-block;
          margin-top: 10px;
          transition: background-color 0.3s;
        }
        
        .upload-btn:hover {
          background-color: #0056b3;
        }
        
        .file-info {
          margin-top: 15px;
          font-size: 14px;
          background: #e8f4ff;
          padding: 10px;
          border-radius: 4px;
          display: inline-block;
        }
        
        .feedback-message {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .info {
          background-color: #e8f4ff;
          color: #0c5460;
        }
        
        .success {
          background-color: #d4edda;
          color: #155724;
        }
        
        .error {
          background-color: #f8d7da;
          color: #721c24;
        }
        
        .button-group {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }
        
        .submit-btn, .cancel-btn, .direct-btn, .new-upload-btn, .view-list-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: background-color 0.3s;
        }
        
        .submit-btn {
          background-color: #4CAF50;
          color: white;
        }
        
        .submit-btn:hover {
          background-color: #45a049;
        }
        
        .submit-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .cancel-btn {
          background-color: #f8f9fa;
          color: #333;
          border: 1px solid #ddd;
        }
        
        .cancel-btn:hover {
          background-color: #e2e6ea;
        }
        
        .direct-btn {
          background-color: #007bff;
          color: white;
        }
        
        .direct-btn:hover {
          background-color: #0069d9;
        }
        
        .success-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 30px 0;
        }
        
        .success-message {
          background-color: #d4edda;
          padding: 30px;
          border-radius: 8px;
          text-align: center;
          max-width: 500px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .success-icon {
          font-size: 48px;
          color: #28a745;
          background-color: #fff;
          width: 80px;
          height: 80px;
          line-height: 80px;
          border-radius: 50%;
          margin: 0 auto 20px;
          box-shadow: 0 2px 10px rgba(40,167,69,0.2);
        }
        
        .success-message h3 {
          color: #155724;
          margin-bottom: 10px;
          font-size: 24px;
        }
        
        .success-message p {
          color: #155724;
          margin-bottom: 20px;
        }
        
        .new-upload-btn {
          background-color: #6c757d;
          color: white;
          margin-right: 10px;
        }
        
        .new-upload-btn:hover {
          background-color: #5a6268;
        }
        
        .view-list-btn {
          background-color: #28a745;
          color: white;
        }
        
        .view-list-btn:hover {
          background-color: #218838;
        }
      `}</style>
    </div>
  );
};

export default UploadStagiaire; 