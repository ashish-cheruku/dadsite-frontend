import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { authService } from '../services/api';

// Use the same API URL configuration as the rest of the app
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1821';

const DailyAttendanceAdmin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('assignments');
  
  // Class assignment states
  const [staffMembers, setStaffMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState({
    staff_id: '',
    class_name: '',
    year: 1,
    group: 'mpc',
    section: 'A',
    total_students: ''
  });
  
  // Approval states
  const [pendingApprovals, setPendingApprovals] = useState([]);
  
  // Dashboard states
  const [dashboardData, setDashboardData] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const userData = await authService.getCurrentUser();
        setUser(userData);
        
        // Only principal can access this page
        if (!userData || userData.role !== 'principal') {
          setError('Access denied. Only principals can access this page.');
          return;
        }
        
        // Fetch initial data
        await Promise.all([
          fetchStaffMembers(),
          fetchAssignments(),
          fetchPendingApprovals(),
          fetchDashboardData()
        ]);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch users with staff role
      const response = await fetch(`${API_URL}/users?role=staff`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStaffMembers(data);
      }
    } catch (err) {
      console.error('Error fetching staff members:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/daily-attendance/class/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/daily-attendance/staff/attendance/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingApprovals(data);
      }
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/daily-attendance/dashboard/principal`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Generate class name
      const className = `${newAssignment.year}${newAssignment.year === 1 ? 'st' : 'nd'} Year ${newAssignment.group.toUpperCase()} ${newAssignment.section}`;
      
      const assignmentData = {
        ...newAssignment,
        class_name: className,
        year: parseInt(newAssignment.year, 10),
        total_students: parseInt(newAssignment.total_students, 10)
      };
      
      const response = await fetch(`${API_URL}/daily-attendance/class/assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignmentData)
      });
      
      if (response.ok) {
        setSuccess('Class assignment created successfully');
        setError('');
        
        // Reset form
        setNewAssignment({
          staff_id: '',
          class_name: '',
          year: 1,
          group: 'mpc',
          section: 'A',
          total_students: ''
        });
        
        // Refresh assignments
        await fetchAssignments();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create assignment');
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (attendanceId, approvalStatus, remarks = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/daily-attendance/staff/attendance/${attendanceId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approval_status: approvalStatus,
          remarks: remarks
        })
      });
      
      if (response.ok) {
        setSuccess(`Attendance ${approvalStatus} successfully`);
        setError('');
        
        // Refresh pending approvals
        await fetchPendingApprovals();
        await fetchDashboardData();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || `Failed to ${approvalStatus} attendance`);
      }
    } catch (err) {
      console.error('Error processing approval:', err);
      setError(`Failed to ${approvalStatus} attendance`);
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignmentStatus = async (assignmentId, currentStatus) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/daily-attendance/class/assignments/${assignmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });
      
      if (response.ok) {
        setSuccess(`Assignment ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        setError('');
        await fetchAssignments();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update assignment');
      }
    } catch (err) {
      console.error('Error updating assignment:', err);
      setError('Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-400';
      case 'absent': return 'text-red-400';
      case 'late': return 'text-yellow-400';
      case 'half_day': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#171010]">
        <Navbar />
        <div className="flex items-center justify-center flex-1">
          <div className="text-2xl font-semibold animate-pulse text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#171010]">
        <Navbar />
        <div className="flex items-center justify-center flex-1">
          <div className="max-w-md p-8 rounded-2xl shadow-xl border bg-[#2B2B2B] border-[#423F3E]">
            <h2 className="text-2xl font-bold mb-4 text-white">Access Denied</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <Button 
              className="bg-[#423F3E] hover:bg-[#544E4E] text-white" 
              onClick={() => navigate('/')}
            >
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#171010]">
      <Navbar />
      
      <main className="flex-1 container py-8 mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 pb-4 border-b border-[#423F3E]">
            <h1 className="text-3xl font-bold text-white">Daily Attendance Administration</h1>
            <p className="mt-2 text-gray-300">
              Manage class assignments and approve staff attendance
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-600 text-red-200 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-900/50 border border-green-600 text-green-200 rounded-lg">
              {success}
            </div>
          )}

          {/* Dashboard Summary */}
          {dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-[#2B2B2B] rounded-lg p-6 border border-[#423F3E]">
                <h3 className="text-lg font-medium text-white mb-2">Total Staff</h3>
                <p className="text-3xl font-bold text-blue-400">{dashboardData.total_staff}</p>
              </div>
              <div className="bg-[#2B2B2B] rounded-lg p-6 border border-[#423F3E]">
                <h3 className="text-lg font-medium text-white mb-2">Present Today</h3>
                <p className="text-3xl font-bold text-green-400">{dashboardData.present_staff}</p>
              </div>
              <div className="bg-[#2B2B2B] rounded-lg p-6 border border-[#423F3E]">
                <h3 className="text-lg font-medium text-white mb-2">Pending Approvals</h3>
                <p className="text-3xl font-bold text-yellow-400">{dashboardData.pending_approvals}</p>
              </div>
              <div className="bg-[#2B2B2B] rounded-lg p-6 border border-[#423F3E]">
                <h3 className="text-lg font-medium text-white mb-2">Classes Marked</h3>
                <p className="text-3xl font-bold text-purple-400">{dashboardData.classes_marked}/{dashboardData.total_classes}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-[#2B2B2B] rounded-lg p-1">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
                  activeTab === 'assignments'
                    ? 'bg-[#423F3E] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Class Assignments
              </button>
              <button
                onClick={() => setActiveTab('approvals')}
                className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors relative ${
                  activeTab === 'approvals'
                    ? 'bg-[#423F3E] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Staff Approvals
                {pendingApprovals.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingApprovals.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'assignments' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Assignment Form */}
              <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-6">
                <h2 className="text-2xl font-semibold mb-6 text-white">Create Class Assignment</h2>
                
                <form onSubmit={handleCreateAssignment}>
                  <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Staff Member
                    </label>
                    <select
                      value={newAssignment.staff_id}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, staff_id: e.target.value }))}
                      className="w-full p-3 bg-[#423F3E] text-white border border-[#544E4E] rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">Select Staff Member</option>
                      {staffMembers.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.username} ({staff.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Year
                      </label>
                      <select
                        value={newAssignment.year}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, year: parseInt(e.target.value, 10) }))}
                        className="w-full p-3 bg-[#423F3E] text-white border border-[#544E4E] rounded-lg focus:outline-none focus:border-blue-500"
                        required
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Group
                      </label>
                      <select
                        value={newAssignment.group}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, group: e.target.value }))}
                        className="w-full p-3 bg-[#423F3E] text-white border border-[#544E4E] rounded-lg focus:outline-none focus:border-blue-500"
                        required
                      >
                        <option value="mpc">MPC</option>
                        <option value="bipc">BIPC</option>
                        <option value="cec">CEC</option>
                        <option value="hec">HEC</option>
                        <option value="thm">THM</option>
                        <option value="oas">OAS</option>
                        <option value="mphw">MPHW</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Section
                      </label>
                      <select
                        value={newAssignment.section}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, section: e.target.value }))}
                        className="w-full p-3 bg-[#423F3E] text-white border border-[#544E4E] rounded-lg focus:outline-none focus:border-blue-500"
                        required
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Total Students
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newAssignment.total_students}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, total_students: e.target.value }))}
                      className="w-full p-3 bg-[#423F3E] text-white border border-[#544E4E] rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="Enter number of students"
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Assignment'}
                  </Button>
                </form>
              </div>

              {/* Existing Assignments */}
              <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-6">
                <h2 className="text-2xl font-semibold mb-6 text-white">Current Assignments</h2>
                
                {assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="text-gray-400">No class assignments yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="bg-[#362222] rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-medium text-white">{assignment.class_name}</h3>
                            <p className="text-sm text-gray-400">
                              Staff: {assignment.staff_name} | Students: {assignment.total_students}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              assignment.is_active 
                                ? 'bg-green-900/30 text-green-400' 
                                : 'bg-gray-900/30 text-gray-400'
                            }`}>
                              {assignment.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <Button
                              onClick={() => toggleAssignmentStatus(assignment.id, assignment.is_active)}
                              disabled={loading}
                              className={`text-xs px-3 py-1 ${
                                assignment.is_active
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : 'bg-green-600 hover:bg-green-700'
                              } text-white`}
                            >
                              {assignment.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-6">
              <h2 className="text-2xl font-semibold mb-6 text-white">Pending Staff Attendance Approvals</h2>
              
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="text-gray-400">No pending approvals.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((attendance) => (
                    <div key={attendance.id} className="bg-[#362222] rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-white">{attendance.staff_name}</h3>
                          <p className="text-sm text-gray-400">
                            Date: {new Date(attendance.date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded font-medium ${getStatusColor(attendance.status)}`}>
                          {attendance.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-400">Check-in:</span>
                          <span className="ml-2 text-white">{attendance.check_in_time || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Check-out:</span>
                          <span className="ml-2 text-white">{attendance.check_out_time || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Submitted:</span>
                          <span className="ml-2 text-white">{new Date(attendance.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      
                      {attendance.remarks && (
                        <div className="mb-4 p-3 bg-[#423F3E] rounded">
                          <span className="text-gray-400 text-sm">Remarks:</span>
                          <p className="text-white mt-1">{attendance.remarks}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApproval(attendance.id, 'approved')}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleApproval(attendance.id, 'rejected')}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DailyAttendanceAdmin;
