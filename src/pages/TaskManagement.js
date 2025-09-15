import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceTaskService, authService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import Navbar from '../components/Navbar';

const TaskManagement = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('assign');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Data states
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  
  // Form states
  const [assignForm, setAssignForm] = useState({
    assigned_to: '',
    branch: 'MPC',
    medium: 'english',
    year: '1st_year',
    target_date: '',
    total_students: ''
  });
  
  // Date filter for Today's Tasks section
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [userData, usersData] = await Promise.all([
        authService.getCurrentUser(),
        authService.getAllUsers()
      ]);
      
      setUser(userData);
      setUsers(usersData.filter(u => u.role === 'staff'));
      
      if (userData.role === 'principal') {
        const [statsData, tasksData] = await Promise.all([
          attendanceTaskService.getStats(),
          attendanceTaskService.getAllTasks()
        ]);
        setStats(statsData);
        setTasks(tasksData);
      } else if (userData.role === 'staff') {
        const myTasksData = await attendanceTaskService.getMyTasks();
        setMyTasks(myTasksData);
      }
    } catch (err) {
      setError('Failed to fetch data: ' + (err.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      console.log('DEBUG: Sending task data:', assignForm);
      await attendanceTaskService.assignTask(assignForm);
      setSuccess('Task assigned successfully!');
      setAssignForm({
        assigned_to: '',
        branch: 'MPC',
        medium: 'english',
        year: '1st_year',
        target_date: '',
        total_students: ''
      });
      
      // Only refresh the data that changed, not the entire page
      if (user?.role === 'principal') {
        const [statsData, tasksData] = await Promise.all([
          attendanceTaskService.getStats(),
          attendanceTaskService.getAllTasks()
        ]);
        setStats(statsData);
        setTasks(tasksData);
      }
    } catch (err) {
      console.error('DEBUG: Error response:', err);
      setError('Failed to assign task: ' + (err.detail || err.message));
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      await attendanceTaskService.deleteTask(taskId);
      setSuccess('Task deleted successfully!');
      
      // Refresh the data
      if (user?.role === 'principal') {
        const [statsData, tasksData] = await Promise.all([
          attendanceTaskService.getStats(),
          attendanceTaskService.getAllTasks()
        ]);
        setStats(statsData);
        setTasks(tasksData);
      }
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.detail || err.detail || err.message;
      setError('Failed to delete task: ' + errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#171010]">
        <div className="text-2xl font-semibold animate-pulse text-white">Loading...</div>
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
            <h1 className="text-3xl font-bold text-white">Attendance Task Allotment</h1>
            <p className="mt-2 text-gray-300">Assign and track attendance marking tasks</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg">
              <p className="text-white font-medium">{error}</p>
              <Button onClick={() => setError('')} className="mt-2 text-sm bg-red-700 hover:bg-red-800 text-white border-red-600" variant="outline">
                Dismiss
              </Button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-900/50 border border-green-600 rounded-lg">
              <p className="text-white font-medium">{success}</p>
              <Button onClick={() => setSuccess('')} className="mt-2 text-sm bg-green-700 hover:bg-green-800 text-white border-green-600" variant="outline">
                Dismiss
              </Button>
            </div>
          )}

          {/* Principal Interface */}
          {user?.role === 'principal' && (
            <>

              {/* Assign Task Form */}
              <div className="bg-[#2B2B2B] rounded-lg border border-[#423F3E] p-6 mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">Assign Attendance Task</h3>
                
                <form onSubmit={handleAssignTask} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="assigned_to" className="text-white">Assign To Staff *</Label>
                      <select
                        id="assigned_to"
                        value={assignForm.assigned_to}
                        onChange={(e) => setAssignForm({...assignForm, assigned_to: e.target.value})}
                        className="w-full px-3 py-2 bg-[#362222] text-white rounded-md border border-[#423F3E]"
                        required
                      >
                        <option value="">Select Staff Member</option>
                        {users.map(user => (
                          <option key={user.username} value={user.username}>
                            {user.username} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="target_date" className="text-white">Target Date *</Label>
                      <Input
                        id="target_date"
                        type="date"
                        value={assignForm.target_date}
                        onChange={(e) => setAssignForm({...assignForm, target_date: e.target.value})}
                        className="bg-[#362222] border-[#423F3E] text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="total_students" className="text-white">Total Students in Class *</Label>
                      <Input
                        id="total_students"
                        type="number"
                        min="1"
                        value={assignForm.total_students}
                        onChange={(e) => setAssignForm({...assignForm, total_students: e.target.value})}
                        className="bg-[#362222] border-[#423F3E] text-white"
                        placeholder="Enter total number of students"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="branch" className="text-white">Branch *</Label>
                      <select
                        id="branch"
                        value={assignForm.branch}
                        onChange={(e) => setAssignForm({...assignForm, branch: e.target.value})}
                        className="w-full px-3 py-2 bg-[#362222] text-white rounded-md border border-[#423F3E]"
                        required
                      >
                        <option value="MPC">MPC</option>
                        <option value="BiPC">BiPC</option>
                        <option value="CEC">CEC</option>
                        <option value="MEC">MEC</option>
                        <option value="HEC">HEC</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="medium" className="text-white">Medium *</Label>
                      <select
                        id="medium"
                        value={assignForm.medium}
                        onChange={(e) => setAssignForm({...assignForm, medium: e.target.value})}
                        className="w-full px-3 py-2 bg-[#362222] text-white rounded-md border border-[#423F3E]"
                        required
                      >
                        <option value="english">English</option>
                        <option value="telugu">Telugu</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="year" className="text-white">Year *</Label>
                      <select
                        id="year"
                        value={assignForm.year}
                        onChange={(e) => setAssignForm({...assignForm, year: e.target.value})}
                        className="w-full px-3 py-2 bg-[#362222] text-white rounded-md border border-[#423F3E]"
                        required
                      >
                        <option value="1st_year">1st Year</option>
                        <option value="2nd_year">2nd Year</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="bg-[#423F3E] hover:bg-[#362222] text-white"
                  >
                    Assign Task
                  </Button>
                </form>
              </div>

              {/* Quick Actions */}
              <div className="bg-[#2B2B2B] rounded-lg border border-[#423F3E] p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Task Reports & Analytics</h3>
                
                <Link to="/attendance-reports" className="block">
                  <div className="bg-[#362222] p-6 rounded-lg hover:bg-[#423F3E] transition duration-200 ease-in-out cursor-pointer">
                    <h4 className="text-white font-medium mb-2">Attendance Reports</h4>
                    <p className="text-gray-400 text-sm mb-4">
                      Filter tasks by date, view detailed attendance data, and analyze performance metrics
                    </p>
                    <span className="text-blue-400 text-sm font-medium">
                      View Reports →
                    </span>
                  </div>
                </Link>
              </div>

              {/* Date-Filtered Tasks with Delete Option */}
              <div className="bg-[#2B2B2B] rounded-lg border border-[#423F3E] p-6 mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white mb-4 sm:mb-0">
                    Tasks by Date
                  </h3>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="task-date-filter" className="text-white text-sm font-medium">
                      Select Date:
                    </label>
                    <input
                      id="task-date-filter"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 bg-[#423F3E] border border-[#5A5A5A] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {(() => {
                  console.log('=== DATE FILTERED TASKS DEBUG ===');
                  console.log('Selected date:', selectedDate);
                  console.log('All tasks count:', tasks.length);
                  console.log('All tasks with dates:', tasks.map(t => ({ 
                    id: t.id, 
                    target_date: t.target_date,
                    target_date_type: typeof t.target_date,
                    class: `${t.branch} ${t.medium} ${t.year}`,
                    status: t.status
                  })));
                  
                  const filteredTasks = tasks.filter(task => {
                    // Handle different possible date formats
                    let taskDateStr;
                    if (typeof task.target_date === 'string') {
                      // If it's already a string, use it directly (assuming YYYY-MM-DD format)
                      taskDateStr = task.target_date;
                    } else {
                      // If it's a Date object, convert to string
                      taskDateStr = new Date(task.target_date).toISOString().split('T')[0];
                    }
                    
                    console.log(`Task ${task.id}: target_date="${task.target_date}" -> taskDateStr="${taskDateStr}" vs selectedDate="${selectedDate}" = ${taskDateStr === selectedDate}`);
                    return taskDateStr === selectedDate;
                  });
                  
                  console.log('Filtered tasks count:', filteredTasks.length);
                  console.log('Filtered tasks:', filteredTasks);
                  
                  return filteredTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-lg mb-2">
                        No tasks assigned for {new Date(selectedDate).toLocaleDateString()}
                      </p>
                      <p className="text-gray-500 text-sm">
                        Tasks assigned for the selected date will appear here. Use the form above to assign new tasks.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTasks.map(task => (
                      <div key={task.id} className="bg-[#362222] p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">
                              {task.branch} {task.medium} {task.year.replace('_', ' ')}
                            </h4>
                            <p className="text-gray-400 text-sm">
                              Assigned to: {task.assigned_to} | Target: {new Date(task.target_date).toLocaleDateString()}
                            </p>
                            {task.total_students && (
                              <p className="text-gray-400 text-sm">
                                Total Students: {task.total_students}
                              </p>
                            )}
                            {task.status === 'completed' && (
                              <div className="mt-2 text-sm text-gray-300">
                                {task.total_students ? (
                                  <>
                                    <p>Students Present: {task.students_present} / {task.total_students}</p>
                                    <p>Attendance: {((task.students_present / task.total_students) * 100).toFixed(1)}%</p>
                                  </>
                                ) : (
                                  <p>Students Present: {task.students_present || task.total_students_present}</p>
                                )}
                                {task.completion_notes && <p>Notes: {task.completion_notes}</p>}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className={`px-2 py-1 text-xs rounded-full text-white ${
                              task.status === 'completed' ? 'bg-green-600' : 
                              task.status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'
                            }`}>
                              {task.status}
                            </span>
                            <Button
                              onClick={() => handleDeleteTask(task.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                      ))}
                      
                      <div className="text-center pt-4 border-t border-[#423F3E] mt-4">
                        <Link to="/attendance-reports" className="text-blue-400 hover:text-blue-300">
                          View detailed reports and all dates →
                        </Link>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}

          {/* Staff Interface */}
          {user?.role === 'staff' && (
            <div className="bg-[#2B2B2B] rounded-lg border border-[#423F3E] p-6">
              <h3 className="text-xl font-semibold text-white mb-4">My Attendance Tasks</h3>
              
              <div className="space-y-4">
                {myTasks.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No tasks assigned to you</p>
                ) : (
                  myTasks.map(task => (
                    <div key={task.id} className="bg-[#362222] p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-white font-medium">
                            Mark Attendance: {task.branch} {task.medium} {task.year.replace('_', ' ')}
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Target Date: {new Date(task.target_date).toLocaleDateString()} | 
                            Assigned by: {task.assigned_by}
                          </p>
                          {task.total_students && (
                            <p className="text-gray-400 text-sm">
                              Total Students in Class: {task.total_students}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${
                          task.status === 'completed' ? 'bg-green-600' : 
                          task.status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      
                      {task.status === 'pending' && (
                        <div className="text-sm text-yellow-300">
                          ⏳ Task pending - Complete attendance marking for this class
                        </div>
                      )}
                      
                      {task.status === 'completed' && (
                        <div className="text-sm text-gray-300">
                          <p>✓ Completed on {new Date(task.completed_at).toLocaleDateString()}</p>
                          {task.total_students ? (
                            <>
                              <p>Students Present: {task.students_present} / {task.total_students}</p>
                              <p>Attendance: {((task.students_present / task.total_students) * 100).toFixed(1)}%</p>
                            </>
                          ) : (
                            <p>Students Present: {task.students_present || task.total_students_present}</p>
                          )}
                          {task.completion_notes && <p>Notes: {task.completion_notes}</p>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TaskManagement;