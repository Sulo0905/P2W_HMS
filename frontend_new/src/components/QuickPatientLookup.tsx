import React, { useState } from 'react';

const QuickPatientLookup = ({ onPatientFound }) => {
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!patientId.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/patients/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patientId.trim() })
      });

      const data = await response.json();

      if (data.success && data.exists) {
        setPatient(data.patient);
        if (onPatientFound) {
          onPatientFound(data.patient);
        }
      } else {
        setError('Patient ID not found');
        setPatient(null);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPatientId('');
    setPatient(null);
    setError('');
  };

  return (
    <div style={{ 
      padding: '1rem', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#f8f9fa',
      marginBottom: '1rem'
    }}>
      <h4 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Quick Patient Lookup</h4>
      
      {!patient ? (
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Enter Patient ID (e.g., p857, 7588)"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !patientId.trim()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Checking...' : 'Lookup'}
          </button>
        </form>
      ) : (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1rem', 
          borderRadius: '4px',
          border: '1px solid #28a745'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h5 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>✓ Patient Found</h5>
              <p style={{ margin: '0.25rem 0' }}><strong>Name:</strong> {patient.fullName}</p>
              <p style={{ margin: '0.25rem 0' }}><strong>ID:</strong> {patient.patientId}</p>
              <p style={{ margin: '0.25rem 0' }}><strong>Category:</strong> {patient.category}</p>
            </div>
            <button 
              onClick={handleReset}
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ 
          color: '#dc3545', 
          fontSize: '0.9rem', 
          marginTop: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#f8d7da',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default QuickPatientLookup;
