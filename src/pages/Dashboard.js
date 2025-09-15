import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authService, attendanceTaskService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [principalStats, setPrincipalStats] = useState(null);
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Staff attendance task states
  const [myTasks, setMyTasks] = useState([]);
  const [completionForms, setCompletionForms] = useState({});
  
  // Date filter for completed tasks
  const [completedTasksDate, setCompletedTasksDate] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Fetch user data when component mounts
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await authService.getCurrentUser();
        setUser(userData);
        
        // Determine data to fetch based on current route or user role
        const currentPath = location.pathname;
        
        if (currentPath.includes('principal') || userData.role === 'principal') {
          const principalData = await authService.getPrincipalDashboard();
          setPrincipalStats(principalData.statistics);
        }
        
        if (currentPath.includes('staff') || userData.role === 'staff') {
          const [staffDashboardData, myTasksData] = await Promise.all([
            authService.getStaffDashboard(),
            attendanceTaskService.getMyTasks()
          ]);
          setStaffData(staffDashboardData);
          setMyTasks(myTasksData);
        }
      } catch (err) {
        setError('Failed to fetch user data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = '/';
  };

  const handleCompleteTask = async (taskId) => {
    const formData = completionForms[taskId];
    if (!formData?.students_present) {
      setError('Please enter the number of students present');
      return;
    }

    try {
      await attendanceTaskService.completeTask(taskId, {
        students_present: parseInt(formData.students_present),
        completion_notes: formData.completion_notes || ''
      });
      
      setSuccess('Attendance task completed successfully!');
      
      // Clear the form
      setCompletionForms(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
      
      // Refresh tasks
      const myTasksData = await attendanceTaskService.getMyTasks();
      setMyTasks(myTasksData);
    } catch (err) {
      setError('Failed to complete task: ' + (err.detail || err.message));
    }
  };

  const updateCompletionForm = (taskId, field, value) => {
    setCompletionForms(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value
      }
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'pending': return 'bg-yellow-600';
      case 'overdue': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#171010]">
        <div className="text-2xl font-semibold animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#171010]">
        <div className="max-w-md p-8 rounded-2xl shadow-xl border bg-[#2B2B2B] border-[#423F3E]">
          <h2 className="text-2xl font-bold mb-4 text-white">Error</h2>
          <p className="text-gray-300">{error}</p>
          <Button 
            className="mt-6" 
            onClick={() => navigate('/login')}
            style={{ backgroundColor: '#423F3E', color: 'white' }}
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  // Render different dashboard content based on user role
  const renderRoleBasedContent = () => {
    switch (user?.role) {
      case 'principal':
        return (
          <>
            <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-8 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Principal Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#362222] p-6 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-2">Total Students</h4>
                  <p className="text-3xl font-bold text-white">{principalStats?.total_students || 0}</p>
                </div>
                <div className="bg-[#362222] p-6 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-2">Total Staff</h4>
                  <p className="text-3xl font-bold text-white">{principalStats?.total_staff || 0}</p>
                </div>
              </div>
            </div>
            

            
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Administrative Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/user-management" className="block w-full">
                  <button className="w-full py-3 px-4 bg-[#362222] hover:bg-[#423F3E] text-white rounded-md transition-colors duration-300">
                    Manage Users & Roles
                  </button>
                </Link>
                <Link to="/announcement-management" className="block w-full">
                  <button className="w-full py-3 px-4 bg-[#362222] hover:bg-[#423F3E] text-white rounded-md transition-colors duration-300">
                    Manage Announcements
                  </button>
                </Link>
                <Link to="/staff-management" className="block w-full">
                  <button className="w-full py-3 px-4 bg-[#362222] hover:bg-[#423F3E] text-white rounded-md transition-colors duration-300">
                    Manage Staff
                  </button>
                </Link>
                <Link to="/permissions-management" className="block w-full">
                  <button className="w-full py-3 px-4 bg-[#362222] hover:bg-[#423F3E] text-white rounded-md transition-colors duration-300">
                    Manage Permissions
                  </button>
                </Link>
                <Link to="/database-management" className="block w-full">
                  <button className="w-full py-3 px-4 bg-[#362222] hover:bg-[#423F3E] text-white rounded-md transition-colors duration-300">
                    Database Management
                  </button>
                </Link>
                <Link to="/subject-marks-config" className="block w-full">
                  <button className="w-full py-3 px-4 bg-[#362222] hover:bg-[#423F3E] text-white rounded-md transition-colors duration-300">
                    Subject Marks Config
                  </button>
                </Link>
                <Link to="/image-management" className="block w-full">
                  <button className="w-full py-3 px-4 bg-[#362222] hover:bg-[#423F3E] text-white rounded-md transition-colors duration-300">
                    Image Management
                  </button>
                </Link>
                <Link to="/task-management" className="block w-full">
                  <button className="w-full py-3 px-4 bg-[#362222] hover:bg-[#423F3E] text-white rounded-md transition-colors duration-300">
                    Attendance Task Allotment
                  </button>
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-[#362222] p-6 rounded-lg hover:bg-[#423F3E] transition duration-200 ease-in-out">
                <Link to="/student-management" className="text-white block h-full">
                  <h3 className="text-xl font-semibold mb-2">Student Management</h3>
                  <p className="text-gray-300 mb-4">Manage student records, enrollments, and information</p>
                  <span className="text-white flex items-center mt-auto">
                    Access Student Records <span className="ml-2">→</span>
                  </span>
                </Link>
              </div>
              
              <div className="bg-[#362222] p-6 rounded-lg hover:bg-[#423F3E] transition duration-200 ease-in-out">
                <Link to="/attendance-management" className="text-white block h-full">
                  <h3 className="text-xl font-semibold mb-2">Attendance Management</h3>
                  <p className="text-gray-300 mb-4">Set working days, record attendance and track reports</p>
                  <span className="text-white flex items-center mt-auto">
                    Manage Attendance <span className="ml-2">→</span>
                  </span>
                </Link>
              </div>
              
              <div className="bg-[#362222] p-6 rounded-lg hover:bg-[#423F3E] transition duration-200 ease-in-out">
                <Link to="/exam-management" className="text-white block h-full">
                  <h3 className="text-xl font-semibold mb-2">Exam Management</h3>
                  <p className="text-gray-300 mb-4">Enter and manage student marks for different exams</p>
                  <span className="text-white flex items-center mt-auto">
                    Manage Exams <span className="ml-2">→</span>
                  </span>
                </Link>
              </div>
            </div>
          </>
        );
      
      case 'staff':
        return (
          <>
            <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-8 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Staff Dashboard</h3>
            </div>
            
            {/* Success/Error Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg">
                <p className="text-white font-medium">{error}</p>
                <Button 
                  onClick={() => setError('')} 
                  className="mt-2 text-sm bg-red-700 hover:bg-red-800 text-white border-red-600"
                  variant="outline"
                >
                  Dismiss
                </Button>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-900/50 border border-green-600 rounded-lg">
                <p className="text-white font-medium">{success}</p>
                <Button 
                  onClick={() => setSuccess('')} 
                  className="mt-2 text-sm bg-green-700 hover:bg-green-800 text-white border-green-600"
                  variant="outline"
                >
                  Dismiss
                </Button>
              </div>
            )}

            {/* Pending Tasks Section */}
            {myTasks && myTasks.filter(task => task.status === 'pending').length > 0 && (
              <div className="bg-[#2B2B2B] rounded-lg border border-[#423F3E] p-6 mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Pending Tasks
                  <span className="ml-2 text-sm bg-yellow-600 px-2 py-1 rounded-full">
                    {myTasks.filter(task => task.status === 'pending').length}
                  </span>
                </h3>
                
                <div className="space-y-4">
                  {myTasks.filter(task => task.status === 'pending').map(task => (
                    <div key={task.id} className="bg-[#362222] p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-white font-medium">
                            Mark Attendance: {task.branch} {task.medium} {task.year.replace('_', ' ')}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Target Date: {formatDate(task.target_date)} | 
                            Assigned by: {task.assigned_by}
                          </p>
                          {task.total_students && (
                            <p className="text-gray-400 text-sm">
                              Total Students in Class: {task.total_students}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      
                      {task.status === 'pending' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`students_${task.id}`} className="text-white">
                                Students Present * {task.total_students ? `(Max: ${task.total_students})` : ''}
                              </Label>
                              <Input
                                id={`students_${task.id}`}
                                type="number"
                                min="0"
                                max={task.total_students || undefined}
                                value={completionForms[task.id]?.students_present || ''}
                                onChange={(e) => updateCompletionForm(task.id, 'students_present', e.target.value)}
                                className="bg-[#423F3E] border-[#423F3E] text-white"
                                placeholder={task.total_students ? `Enter number (0-${task.total_students})` : 'Enter number of students present'}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`notes_${task.id}`} className="text-white">
                                Notes (Optional)
                              </Label>
                              <Input
                                id={`notes_${task.id}`}
                                value={completionForms[task.id]?.completion_notes || ''}
                                onChange={(e) => updateCompletionForm(task.id, 'completion_notes', e.target.value)}
                                className="bg-[#423F3E] border-[#423F3E] text-white"
                                placeholder="Any additional notes"
                              />
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => handleCompleteTask(task.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={!completionForms[task.id]?.students_present}
                          >
                            Mark Attendance Complete
                          </Button>
                        </div>
                      )}
                      
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks Section */}
            {myTasks && myTasks.filter(task => task.status === 'completed').length > 0 && (
              <div className="bg-[#2B2B2B] rounded-lg border border-[#423F3E] p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white mb-4 sm:mb-0">
                    Recent Completions
                    <span className="ml-2 text-sm bg-green-600 px-2 py-1 rounded-full">
                      {(() => {
                        const filteredCompletedTasks = myTasks.filter(task => {
                          if (task.status !== 'completed') return false;
                          if (!completedTasksDate) return true; // Show all if no date selected
                          
                          // Get the completion date in YYYY-MM-DD format
                          let completionDateStr;
                          if (task.completed_at) {
                            completionDateStr = new Date(task.completed_at).toISOString().split('T')[0];
                          } else {
                            return false;
                          }
                          
                          return completionDateStr === completedTasksDate;
                        });
                        return filteredCompletedTasks.length;
                      })()}
                    </span>
                  </h3>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="completed-tasks-date-filter" className="text-white text-sm font-medium">
                      Filter by Date:
                    </label>
                    <input
                      id="completed-tasks-date-filter"
                      type="date"
                      value={completedTasksDate}
                      onChange={(e) => setCompletedTasksDate(e.target.value)}
                      className="px-3 py-2 bg-[#423F3E] border border-[#5A5A5A] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {completedTasksDate && (
                      <button
                        onClick={() => setCompletedTasksDate('')}
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                
                {(() => {
                  const filteredCompletedTasks = myTasks.filter(task => {
                    if (task.status !== 'completed') return false;
                    if (!completedTasksDate) return true; // Show all if no date selected
                    
                    // Get the completion date in YYYY-MM-DD format
                    let completionDateStr;
                    if (task.completed_at) {
                      completionDateStr = new Date(task.completed_at).toISOString().split('T')[0];
                    } else {
                      return false;
                    }
                    
                    return completionDateStr === completedTasksDate;
                  });

                  return filteredCompletedTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-lg mb-2">
                        {completedTasksDate 
                          ? `No tasks completed on ${new Date(completedTasksDate).toLocaleDateString()}`
                          : 'No completed tasks found'
                        }
                      </p>
                      <p className="text-gray-500 text-sm">
                        {completedTasksDate 
                          ? 'Try selecting a different date or clear the filter to see all completed tasks.'
                          : 'Completed tasks will appear here once you finish your assignments.'
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCompletedTasks.slice(0, 6).map(task => (
                    <div key={task.id} className="bg-[#1a3a1a] p-4 rounded-lg border border-green-800">
                      <div className="mb-3">
                        <h4 className="text-white font-medium text-sm">
                          {task.branch} {task.medium} {task.year.replace('_', ' ')}
                        </h4>
                        <p className="text-gray-400 text-xs">
                          {formatDate(task.target_date)}
                        </p>
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-300">
                        <p>✓ Completed {formatDate(task.completed_at)}</p>
                        {task.total_students ? (
                          <>
                            <p>Present: {task.students_present} / {task.total_students}</p>
                            <p className="font-medium text-green-400">
                              {((task.students_present / task.total_students) * 100).toFixed(1)}% Attendance
                            </p>
                          </>
                        ) : (
                          <p>Present: {task.students_present || task.total_students_present}</p>
                        )}
                        {task.completion_notes && (
                          <p className="text-gray-400 italic">"{task.completion_notes}"</p>
                        )}
                      </div>
                    </div>
                        ))}
                      </div>
                      
                      {filteredCompletedTasks.length > 6 && (
                        <div className="mt-4 text-center">
                          <p className="text-gray-400 text-sm">
                            Showing 6 of {filteredCompletedTasks.length} completed tasks
                            {completedTasksDate && ` for ${new Date(completedTasksDate).toLocaleDateString()}`}
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#362222] p-6 rounded-lg hover:bg-[#423F3E] transition duration-200 ease-in-out">
                <Link to="/student-management" className="text-white block h-full">
                  <h3 className="text-xl font-semibold mb-2">Student Management</h3>
                  <p className="text-gray-300 mb-4">Access and manage student information records</p>
                  <span className="text-white flex items-center mt-auto">
                    View Students <span className="ml-2">→</span>
                  </span>
                </Link>
              </div>
              
              <div className="bg-[#362222] p-6 rounded-lg hover:bg-[#423F3E] transition duration-200 ease-in-out">
                <Link to="/attendance-management" className="text-white block h-full">
                  <h3 className="text-xl font-semibold mb-2">Attendance Management</h3>
                  <p className="text-gray-300 mb-4">Record attendance and identify students with low attendance</p>
                  <span className="text-white flex items-center mt-auto">
                    Record Attendance <span className="ml-2">→</span>
                  </span>
                </Link>
              </div>
              
              <div className="bg-[#362222] p-6 rounded-lg hover:bg-[#423F3E] transition duration-200 ease-in-out">
                <Link to="/exam-management" className="text-white block h-full">
                  <h3 className="text-xl font-semibold mb-2">Exam Management</h3>
                  <p className="text-gray-300 mb-4">Enter and manage student marks for different exams</p>
                  <span className="text-white flex items-center mt-auto">
                    Manage Exams <span className="ml-2">→</span>
                  </span>
                </Link>
              </div>
            </div>
          </>
        );
      
      default: // Student view
        return (
          <>
            <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-8 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Student Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#362222] p-5 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-3">Course Schedule</h4>
                  <p className="text-gray-300">No courses available yet. Please check back later.</p>
                </div>
                
                <div className="bg-[#362222] p-5 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-3">Upcoming Exams</h4>
                  <p className="text-gray-300">No scheduled exams at this time.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-white">Academic Resources</h3>
              <div className="bg-[#362222] p-5 rounded-lg">
                <h4 className="text-lg font-medium text-white mb-3">Available Resources</h4>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Library access</li>
                  <li>Online learning materials</li>
                  <li>Study groups</li>
                </ul>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#171010]">
      <Navbar />
      
      <main className="flex-1 container py-8 mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 pb-4 border-b border-[#423F3E]">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 text-gray-300">
              Welcome to your personal dashboard, {user?.username}
              {user?.role && <span className="ml-2 inline-block px-2 py-1 text-xs bg-[#362222] rounded-full">{user.role}</span>}
            </p>
          </div>
          
          <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center mb-6">
              <div className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-semibold bg-[#362222] text-white mb-4 md:mb-0 md:mr-6">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-white">{user?.username}</h2>
                <p className="text-gray-400">{user?.email}</p>
              </div>
              <div className="ml-auto mt-4 md:mt-0">
                <Button 
                  variant="outline" 
                  onClick={handleLogout} 
                  className="border text-white hover:bg-[#423F3E]/20"
                  style={{ borderColor: '#423F3E', backgroundColor: 'transparent' }}
                >
                  Sign Out
                </Button>
              </div>
            </div>
            
            <div className="pt-6 border-t border-[#423F3E]">
              <h3 className="text-xl font-semibold mb-4 text-white">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <span className="text-gray-400 mb-1">Username</span>
                  <span className="font-medium text-white">{user?.username}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 mb-1">Email</span>
                  <span className="font-medium text-white">{user?.email}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 mb-1">Role</span>
                  <span className="font-medium text-white capitalize">{user?.role || 'Student'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Role-specific content */}
          {renderRoleBasedContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 