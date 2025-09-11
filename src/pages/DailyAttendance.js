import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { authService } from '../services/api';

// Use the same API URL configuration as the rest of the app
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:1821';

const DailyAttendance = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Staff attendance states
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [remarks, setRemarks] = useState('');
  
  // Class attendance states
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [classAttendance, setClassAttendance] = useState({});
  const [classRemarks, setClassRemarks] = useState({});
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const userData = await authService.getCurrentUser();
        setUser(userData);
        
        // Only staff and principal can access this page
        if (!userData || !['staff', 'principal'].includes(userData.role)) {
          setError('Access denied. Only staff members can access daily attendance.');
          return;
        }
        
        // Fetch today's attendance and assigned classes
        await Promise.all([
          fetchTodayAttendance(userData.id),
          fetchAssignedClasses(userData.id)
        ]);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchTodayAttendance = async (staffId) => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${API_URL}/daily-attendance/staff/attendance/${staffId}?start_date=${today}&end_date=${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const attendance = data[0];
          setTodayAttendance(attendance);
          setCheckInTime(attendance.check_in_time || '');
          setCheckOutTime(attendance.check_out_time || '');
          setAttendanceStatus(attendance.status);
          setRemarks(attendance.remarks || '');
        }
      }
    } catch (err) {
      console.error('Error fetching today attendance:', err);
    }
  };

  const fetchAssignedClasses = async (staffId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/daily-attendance/class/assignments?staff_id=${staffId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssignedClasses(data);
        
        // Initialize class attendance state
        const initialAttendance = {};
        const initialRemarks = {};
        data.forEach(assignment => {
          initialAttendance[assignment.id] = '';
          initialRemarks[assignment.id] = '';
        });
        setClassAttendance(initialAttendance);
        setClassRemarks(initialRemarks);
      }
    } catch (err) {
      console.error('Error fetching assigned classes:', err);
    }
  };

  const handleStaffAttendance = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      
      const attendanceData = {
        staff_id: user.id,
        date: today,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        status: attendanceStatus,
        remarks: remarks
      };
      
      let response;
      if (todayAttendance) {
        // Update existing attendance
        response = await fetch(`${API_URL}/daily-attendance/staff/attendance/${todayAttendance.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            check_in_time: checkInTime,
            check_out_time: checkOutTime,
            status: attendanceStatus,
            remarks: remarks
          })
        });
      } else {
        // Create new attendance
        response = await fetch(`${API_URL}/daily-attendance/staff/attendance`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(attendanceData)
        });
      }
      
      if (response.ok) {
        const updatedAttendance = await response.json();
        setTodayAttendance(updatedAttendance);
        setSuccess('Staff attendance marked successfully! Waiting for principal approval.');
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to mark attendance');
      }
    } catch (err) {
      console.error('Error marking staff attendance:', err);
      setError('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleClassAttendance = async (assignmentId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      
      const presentCount = parseInt(classAttendance[assignmentId], 10);
      if (isNaN(presentCount) || presentCount < 0) {
        setError('Please enter a valid number of present students');
        return;
      }
      
      const assignment = assignedClasses.find(a => a.id === assignmentId);
      if (presentCount > assignment.total_students) {
        setError(`Present count cannot exceed total students (${assignment.total_students})`);
        return;
      }
      
      const attendanceData = {
        assignment_id: assignmentId,
        date: today,
        present_count: presentCount,
        remarks: classRemarks[assignmentId]
      };
      
      const response = await fetch(`${API_URL}/daily-attendance/class/attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(attendanceData)
      });
      
      if (response.ok) {
        setSuccess(`Class attendance marked for ${assignment.class_name}`);
        setError('');
        // Clear the form for this class
        setClassAttendance(prev => ({ ...prev, [assignmentId]: '' }));
        setClassRemarks(prev => ({ ...prev, [assignmentId]: '' }));
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to mark class attendance');
      }
    } catch (err) {
      console.error('Error marking class attendance:', err);
      setError('Failed to mark class attendance');
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

  const getApprovalStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-900/30';
      case 'rejected': return 'text-red-400 bg-red-900/30';
      case 'pending': return 'text-yellow-400 bg-yellow-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 pb-4 border-b border-[#423F3E]">
            <h1 className="text-3xl font-bold text-white">Daily Attendance</h1>
            <p className="mt-2 text-gray-300">
              Mark your attendance and manage class attendance for today
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Staff Self Attendance */}
            <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-6">
              <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-3">
                👤 My Attendance
              </h2>
              
              {todayAttendance && (
                <div className="mb-6 p-4 bg-[#362222] rounded-lg">
                  <h3 className="text-lg font-medium text-white mb-2">Today's Status</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span className={`ml-2 font-medium ${getStatusColor(todayAttendance.status)}`}>
                        {todayAttendance.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Approval:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getApprovalStatusColor(todayAttendance.approval_status)}`}>
                        {todayAttendance.approval_status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleStaffAttendance}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Check-in Time
                    </label>
                    <input
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full p-3 bg-[#423F3E] text-white border border-[#544E4E] rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Check-out Time
                    </label>
                    <input
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="w-full p-3 bg-[#423F3E] text-white border border-[#544E4E] rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Attendance Status
                  </label>
                  <select
                    value={attendanceStatus}
                    onChange={(e) => setAttendanceStatus(e.target.value)}
                    className="w-full p-3 bg-[#423F3E] text-white border border-[#544E4E] rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="half_day">Half Day</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full p-3 bg-[#423F3E] text-white border border-[#544E4E] rounded-lg focus:outline-none focus:border-blue-500"
                    rows="3"
                    placeholder="Any additional notes..."
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={loading || (todayAttendance && todayAttendance.approval_status !== 'pending')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {loading ? 'Marking...' : (todayAttendance ? 'Update Attendance' : 'Mark Attendance')}
                </Button>
                
                {todayAttendance && todayAttendance.approval_status !== 'pending' && (
                  <p className="mt-2 text-sm text-gray-400 text-center">
                    Attendance has been {todayAttendance.approval_status} and cannot be modified
                  </p>
                )}
              </form>
            </div>

            {/* Class Attendance */}
            <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-6">
              <h2 className="text-2xl font-semibold mb-6 text-white flex items-center gap-3">
                🏫 Class Attendance
              </h2>
              
              {assignedClasses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📚</div>
                  <p className="text-gray-400">No classes assigned to you yet.</p>
                  <p className="text-sm text-gray-500 mt-2">Contact the principal to get class assignments.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {assignedClasses.map((assignment) => (
                    <div key={assignment.id} className="bg-[#362222] rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-white">{assignment.class_name}</h3>
                          <p className="text-sm text-gray-400">
                            Total Students: {assignment.total_students} | Year: {assignment.year} | Group: {assignment.group.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-2">
                            Present Count
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={assignment.total_students}
                            value={classAttendance[assignment.id]}
                            onChange={(e) => setClassAttendance(prev => ({
                              ...prev,
                              [assignment.id]: e.target.value
                            }))}
                            className="w-full p-3 bg-[#423F3E] text-white border border-[#544E4E] rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder={`0 - ${assignment.total_students}`}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-2">
                            Remarks (Optional)
                          </label>
                          <input
                            type="text"
                            value={classRemarks[assignment.id]}
                            onChange={(e) => setClassRemarks(prev => ({
                              ...prev,
                              [assignment.id]: e.target.value
                            }))}
                            className="w-full p-3 bg-[#423F3E] text-white border border-[#544E4E] rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Any notes..."
                          />
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleClassAttendance(assignment.id)}
                        disabled={loading || !classAttendance[assignment.id]}
                        className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                      >
                        {loading ? 'Marking...' : 'Mark Class Attendance'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DailyAttendance;
