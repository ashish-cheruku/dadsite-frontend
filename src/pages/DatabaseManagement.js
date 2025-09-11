import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import Navbar from '../components/Navbar';
import { authService } from '../services/api';

// Use the same API URL configuration as the rest of the app
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1821';

const DatabaseManagement = () => {
  const [user, setUser] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [switchingDb, setSwitchingDb] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingDualWrite, setTogglingDualWrite] = useState(false);
  
  // Password protection states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
  const navigate = useNavigate();
  
  // The correct password
  const CORRECT_PASSWORD = "ashish@5568";

  // Handle password submission
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (isLocked) {
      setPasswordError('Too many failed attempts. Please refresh the page to try again.');
      return;
    }
    
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError('');
      setAttemptCount(0);
      // Store authentication in sessionStorage (will be cleared when browser is closed)
      sessionStorage.setItem('dbManagerAuth', 'true');
    } else {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      
      if (newAttemptCount >= 3) {
        setIsLocked(true);
        setPasswordError('Too many failed attempts. Access locked. Please refresh the page to try again.');
      } else {
        setPasswordError(`Incorrect password. ${3 - newAttemptCount} attempts remaining.`);
      }
      setPassword('');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('dbManagerAuth');
    setPassword('');
    setPasswordError('');
    setAttemptCount(0);
    setIsLocked(false);
  };

  // Check if user is already authenticated from sessionStorage
  useEffect(() => {
    const storedAuth = sessionStorage.getItem('dbManagerAuth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Only fetch data if authenticated
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get current user using the auth service (same as other pages)
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (authError) {
          console.log('Auth error, but continuing...');
          // Set a default user for testing
          setUser({ role: 'principal', username: 'principal' });
        }

        // Fetch database status
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const dbResponse = await fetch(`${API_URL}/api/database/status`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (dbResponse.ok) {
              const dbStatusData = await dbResponse.json();
              setDbStatus(dbStatusData);
            }
          } catch (dbError) {
            console.log('Database status fetch failed, showing fallback UI');
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, isAuthenticated]);

  const handleDatabaseSwitch = async (newDatabase) => {
    if (switchingDb) return;
    
    setSwitchingDb(true);
    try {
      const response = await fetch(`${API_URL}/api/database/switch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          database_type: newDatabase
        })
      });

      if (response.ok) {
        // Refresh database status
        const statusResponse = await fetch(`${API_URL}/api/database/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (statusResponse.ok) {
          const dbStatusData = await statusResponse.json();
          setDbStatus(dbStatusData);
        }
      } else {
        const errorData = await response.json();
        setError(`Failed to switch database: ${errorData.detail}`);
      }
    } catch (err) {
      console.error('Database switch error:', err);
      setError('Failed to switch database. Please try again.');
    } finally {
      setSwitchingDb(false);
    }
  };

  const handleDualWriteToggle = async () => {
    if (togglingDualWrite) return;
    
    setTogglingDualWrite(true);
    try {
      const token = localStorage.getItem('token');
      const newDualWriteState = !dbStatus?.dual_write_enabled;
      
      const response = await fetch(`${API_URL}/api/database/dual-write/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: newDualWriteState
        })
      });

      if (response.ok) {
        // Refresh database status after successful toggle
        const statusResponse = await fetch(`${API_URL}/api/database/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setDbStatus(statusData);
        }
      } else {
        const errorData = await response.json();
        setError(`Failed to toggle dual write: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Error toggling dual write:', error);
      setError('Failed to toggle dual write mode');
    } finally {
      setTogglingDualWrite(false);
    }
  };

  // Show password prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-[#171010]">
        <Navbar />
        <div className="flex items-center justify-center flex-1">
          <div className="max-w-md w-full mx-4">
            <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-8">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-white mb-2">Database Manager Access</h2>
                <p className="text-gray-300">Enter the password to access the database management dashboard</p>
              </div>
              
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 bg-[#423F3E] text-white border border-[#544E4E] rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? '👁️' : '⏜'}
                    </button>
                  </div>
                </div>
                
                {passwordError && (
                  <div className="mb-4 p-3 bg-red-900/50 border border-red-600 text-red-200 rounded-lg text-sm">
                    {passwordError}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLocked}
                  className={`w-full py-3 px-4 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#2B2B2B] ${
                    isLocked 
                      ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isLocked ? 'Access Locked' : 'Access Dashboard'}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/')}
                  className="text-white hover:text-white text-sm transition-colors duration-200"
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#171010]">
        <Navbar />
        <div className="flex items-center justify-center flex-1">
          <div className="text-2xl font-semibold animate-pulse text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#171010]">
      <Navbar />
      
      <main className="flex-1 container py-8 mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 pb-4 border-b border-[#423F3E]">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-white">Database Management</h1>
                <p className="mt-2 text-gray-300">
                  Switch between databases and manage academic years
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                🔒 Logout
              </button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded-lg">
                <p className="text-red-200">{error}</p>
              </div>
            )}
          </div>

          {/* Database Status Cards */}
          {dbStatus ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-6">
                  <h3 className="text-xl font-semibold mb-4 text-white">Current Database</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold text-white capitalize">
                      {dbStatus.current_database}
                    </p>
                    {dbStatus.current_database === 'postgresql' && (
                      <span className="text-sm bg-blue-600 px-3 py-1 rounded-full text-white">
                        Neon DB
                      </span>
                    )}
                    {dbStatus.current_database === 'mongodb' && (
                      <span className="text-sm bg-green-600 px-3 py-1 rounded-full text-white">
                        Atlas
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-6">
                  <h3 className="text-xl font-semibold mb-4 text-white">Academic Year</h3>
                  <p className="text-3xl font-bold text-white">{dbStatus.current_academic_year}</p>
                  <p className="text-gray-400 mt-2">Current active year</p>
                </div>
              </div>

              {/* Dual Write Status and Control */}
              <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-6 mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="mb-4 lg:mb-0">
                    <h3 className="text-xl font-semibold text-white mb-2">Dual Database Writing</h3>
                    <p className="text-gray-300 text-sm mb-2">
                      When enabled, all new data will be saved to both MongoDB and PostgreSQL simultaneously
                    </p>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${dbStatus.dual_write_enabled ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                      <span className="text-white font-medium">
                        {dbStatus.dual_write_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      {dbStatus.dual_write_enabled && (
                        <span className="px-2 py-1 bg-green-900 text-green-300 text-xs rounded-full">
                          Writing to both databases
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleDualWriteToggle}
                    disabled={togglingDualWrite}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors duration-300 ${
                      dbStatus.dual_write_enabled
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    } disabled:opacity-50`}
                  >
                    {togglingDualWrite ? 'Processing...' : (dbStatus.dual_write_enabled ? 'Disable Dual Write' : 'Enable Dual Write')}
                  </button>
                </div>
              </div>

              {/* Database Switching Section */}
              <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-8 mb-8">
                <h3 className="text-2xl font-semibold mb-6 text-white">Switch Database</h3>
                <p className="text-gray-300 mb-6">
                  Choose between MongoDB and PostgreSQL databases. All your data has been migrated to both databases.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleDatabaseSwitch('mongodb')}
                    disabled={switchingDb || dbStatus.current_database === 'mongodb'}
                    className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all duration-300 ${
                      dbStatus.current_database === 'mongodb'
                        ? 'bg-green-600 text-white cursor-not-allowed shadow-lg'
                        : 'bg-[#362222] hover:bg-green-600 text-white hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-2xl">🍃</div>
                      <div>
                        <div className="font-bold">MongoDB Atlas</div>
                        <div className="text-sm opacity-80">NoSQL Database</div>
                      </div>
                      {switchingDb && dbStatus.current_database !== 'mongodb' && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      )}
                      {dbStatus.current_database === 'mongodb' && <span className="text-xl">✓</span>}
                    </div>
                  </button>

                  <button
                    onClick={() => handleDatabaseSwitch('postgresql')}
                    disabled={switchingDb || dbStatus.current_database === 'postgresql'}
                    className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all duration-300 ${
                      dbStatus.current_database === 'postgresql'
                        ? 'bg-blue-600 text-white cursor-not-allowed shadow-lg'
                        : 'bg-[#362222] hover:bg-blue-600 text-white hover:shadow-lg transform hover:scale-105'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-2xl">🐘</div>
                      <div>
                        <div className="font-bold">PostgreSQL (Neon)</div>
                        <div className="text-sm opacity-80">Relational Database</div>
                      </div>
                      {switchingDb && dbStatus.current_database !== 'postgresql' && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      )}
                      {dbStatus.current_database === 'postgresql' && <span className="text-xl">✓</span>}
                    </div>
                  </button>
                </div>
              </div>

              {/* Academic Years Section */}
              {dbStatus.available_academic_years && dbStatus.available_academic_years.length > 0 && (
                <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-8">
                  <h3 className="text-2xl font-semibold mb-6 text-white">Academic Years</h3>
                  <p className="text-gray-300 mb-6">
                    Available academic years in the current database system
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {dbStatus.available_academic_years.map((year, index) => (
                      <div
                        key={year.year || index}
                        className={`p-4 rounded-xl text-center transition-all duration-300 ${
                          year.is_current
                            ? 'bg-green-600 text-white shadow-lg transform scale-105'
                            : 'bg-[#362222] text-white hover:bg-[#423F3E]'
                        }`}
                      >
                        <div className="font-bold text-lg">{year.year}</div>
                        {year.is_current && (
                          <div className="text-xs mt-1 bg-white bg-opacity-20 rounded-full px-2 py-1">
                            Current
                          </div>
                        )}
                        {year.start_date && year.end_date && (
                          <div className="text-xs mt-2 opacity-80">
                            {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Fallback interface when database status is not available
            <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-8">
              <h3 className="text-2xl font-semibold mb-6 text-white">Database Management</h3>
              <p className="text-gray-300 mb-6">
                Database status is not available. You can still switch between databases manually.
              </p>
              
              <div className="bg-[#362222] rounded-lg p-6 mb-6">
                <h4 className="text-lg font-medium text-white mb-4">Database Switching</h4>
                <p className="text-gray-400 mb-4">
                  Switch between MongoDB and PostgreSQL databases:
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleDatabaseSwitch('mongodb')}
                    disabled={switchingDb}
                    className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-300 disabled:opacity-50"
                  >
                    {switchingDb ? 'Switching...' : 'Use MongoDB'}
                  </button>
                  
                  <button
                    onClick={() => handleDatabaseSwitch('postgresql')}
                    disabled={switchingDb}
                    className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-300 disabled:opacity-50"
                  >
                    {switchingDb ? 'Switching...' : 'Use PostgreSQL'}
                  </button>
                </div>
              </div>
              
              <div className="bg-[#362222] rounded-lg p-6 mb-6">
                <h4 className="text-lg font-medium text-white mb-4">Dual Database Writing</h4>
                <p className="text-gray-400 mb-4">
                  Enable dual write to save all new data to both databases automatically:
                </p>
                
                <button
                  onClick={handleDualWriteToggle}
                  disabled={togglingDualWrite}
                  className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-300 disabled:opacity-50"
                >
                  {togglingDualWrite ? 'Processing...' : 'Toggle Dual Write'}
                </button>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-[#423F3E] hover:bg-[#4a453e] text-white rounded-lg transition-colors duration-300"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DatabaseManagement;
