import React, { useState, useEffect } from 'react';
import { attendanceTaskService, authService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import * as XLSX from 'xlsx';

const AttendanceReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    date: ''
  });
  
  // Data states
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Summary states
  const [summary, setSummary] = useState({
    totalStudents: 0,
    studentsAttended: 0,
    attendancePercentage: 0,
    totalTasks: 0,
    completedTasks: 0
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    // Don't automatically show all tasks - wait for user to apply filters
    // Initialize with empty filtered tasks
    setFilteredTasks([]);
    calculateSummary([]);
  }, [tasks]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [userData, usersData, tasksData, recordsData] = await Promise.all([
        authService.getCurrentUser(),
        authService.getAllUsers(),
        attendanceTaskService.getAllTasks(),
        attendanceTaskService.getAttendanceRecords()
      ]);
      
      setUser(userData);
      setUsers(usersData.filter(u => u.role === 'staff'));
      setTasks(tasksData);
      setAttendanceRecords(recordsData);
    } catch (err) {
      setError('Failed to fetch data: ' + (err.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Require a date to show results
    if (!filters.date) {
      alert('Please select a date to filter tasks.');
      return;
    }

    console.log('Applying filters:', filters);
    console.log('All tasks:', tasks.map(t => ({ id: t.id, target_date: t.target_date, class: `${t.branch} ${t.medium} ${t.year}` })));

    let filtered = [...tasks];
    
    // Date filter - exact date match
    if (filters.date) {
      const selectedDate = new Date(filters.date);
      selectedDate.setHours(0, 0, 0, 0); // Set to start of day
      
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.target_date);
        taskDate.setHours(0, 0, 0, 0); // Set to start of day
        console.log(`Date filter: ${task.target_date} (${taskDate.toISOString()}) === ${filters.date} (${selectedDate.toISOString()}) = ${taskDate.getTime() === selectedDate.getTime()}`);
        return taskDate.getTime() === selectedDate.getTime();
      });
    }
    
    // No other filters needed - only date filter
    
    console.log('Filtered tasks:', filtered.map(t => ({ id: t.id, target_date: t.target_date, class: `${t.branch} ${t.medium} ${t.year}` })));
    
    setFilteredTasks(filtered);
    calculateSummary(filtered);
  };

  const calculateSummary = (taskList) => {
    const totalTasks = taskList.length;
    const completedTasks = taskList.filter(t => t.status === 'completed').length;
    
    // Calculate total students from all filtered tasks (both completed and pending)
    const totalStudents = taskList.reduce((sum, task) => {
      return sum + (task.total_students || 0);
    }, 0);
    
    // Calculate students attended from completed tasks only
    const completedTasksWithData = taskList.filter(t => {
      if (t.status !== 'completed') return false;
      
      // New format: has both students_present and total_students
      if (t.students_present !== null && t.total_students) return true;
      
      // Old format: has total_students_present
      if (t.total_students_present !== null) return true;
      
      return false;
    });
    
    const studentsAttended = completedTasksWithData.reduce((sum, task) => {
      // Prefer new format, fallback to old format
      const present = task.students_present || task.total_students_present || 0;
      return sum + present;
    }, 0);
    
    // Calculate attendance percentage
    const attendancePercentage = totalStudents > 0 
      ? (studentsAttended / totalStudents) * 100 
      : 0;

    setSummary({
      totalStudents,
      studentsAttended,
      attendancePercentage: attendancePercentage.toFixed(1),
      totalTasks,
      completedTasks
    });
  };

  const clearFilters = () => {
    setFilters({
      date: ''
    });
    // Clear the results - don't show any tasks until new filters are applied
    setFilteredTasks([]);
    calculateSummary([]);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      await attendanceTaskService.deleteTask(taskId);
      setError(''); // Clear any existing errors
      
      // Refresh the data
      const [tasksData, recordsData] = await Promise.all([
        attendanceTaskService.getAllTasks(),
        attendanceTaskService.getAttendanceRecords()
      ]);
      setTasks(tasksData);
      setAttendanceRecords(recordsData);
      
      // Re-apply current filters
      if (filters.date) {
        applyFilters();
      }
    } catch (err) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.detail || err.detail || err.message;
      setError('Failed to delete task: ' + errorMessage);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const exportToExcel = () => {
    if (!filters.date) {
      alert('Please select a date first to export data.');
      return;
    }

    if (filteredTasks.length === 0) {
      alert('No data available to export for the selected date.');
      return;
    }

    // Prepare data for Excel export
    const excelData = filteredTasks.map(task => ({
      'Date': formatDate(task.target_date),
      'Branch': task.branch,
      'Medium': task.medium,
      'Year': task.year.replace('_', ' '),
      'Class': `${task.branch} ${task.medium} ${task.year.replace('_', ' ')}`,
      'Assigned To': task.assigned_to,
      'Status': task.status,
      'Total Students': task.total_students || 'N/A',
      'Students Present': task.status === 'completed' ? 
        (task.students_present || task.total_students_present || 'N/A') : 
        'Not Completed',
      'Students Absent': task.status === 'completed' && task.total_students && task.students_present !== null ? 
        (task.total_students - task.students_present) : 
        'N/A',
      'Attendance Percentage': task.status === 'completed' && task.total_students && task.students_present !== null ? 
        `${((task.students_present / task.total_students) * 100).toFixed(1)}%` : 
        'N/A',
      'Completion Notes': task.completion_notes || 'No notes',
      'Assigned By': task.assigned_by,
      'Created At': formatDate(task.created_at),
      'Completed At': task.completed_at ? formatDate(task.completed_at) : 'Not completed'
    }));

    // Add summary row at the end
    const summaryRow = {
      'Date': 'SUMMARY',
      'Branch': '',
      'Medium': '',
      'Year': '',
      'Class': 'Total for ' + formatDate(filters.date),
      'Assigned To': '',
      'Status': '',
      'Total Students': summary.totalStudents,
      'Students Present': summary.studentsAttended,
      'Students Absent': summary.totalStudents - summary.studentsAttended,
      'Attendance Percentage': `${summary.attendancePercentage}%`,
      'Completion Notes': '',
      'Assigned By': '',
      'Created At': '',
      'Completed At': ''
    };

    excelData.push({}, summaryRow); // Empty row before summary

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 8 },  // Branch
      { wch: 8 },  // Medium
      { wch: 10 }, // Year
      { wch: 20 }, // Class
      { wch: 15 }, // Assigned To
      { wch: 10 }, // Status
      { wch: 12 }, // Total Students
      { wch: 15 }, // Students Present
      { wch: 15 }, // Students Absent
      { wch: 18 }, // Attendance Percentage
      { wch: 20 }, // Completion Notes
      { wch: 15 }, // Assigned By
      { wch: 12 }, // Created At
      { wch: 12 }  // Completed At
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');

    // Generate filename with date
    const fileName = `Attendance_Report_${filters.date.replace(/-/g, '_')}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'pending': return 'bg-yellow-600';
      case 'overdue': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#171010]">
        <div className="text-2xl font-semibold animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  // Since this route is already protected by ProtectedRoute in App.js, 
  // we don't need additional role validation here

  return (
    <div className="min-h-screen bg-[#171010] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Attendance Reports</h1>
          <p className="text-gray-400">Filter and analyze attendance task data</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg">
            <p className="text-black">{error}</p>
            <Button 
              onClick={() => setError('')} 
              className="mt-2 text-sm"
              variant="outline"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-[#2B2B2B] p-6 rounded-lg border border-[#423F3E]">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Total Students</h3>
            <p className="text-3xl font-bold text-blue-400">{summary.totalStudents}</p>
            <p className="text-xs text-gray-500 mt-1">Students in filtered classes</p>
          </div>
          <div className="bg-[#2B2B2B] p-6 rounded-lg border border-[#423F3E]">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Students Attended</h3>
            <p className="text-3xl font-bold text-green-400">{summary.studentsAttended}</p>
            <p className="text-xs text-gray-500 mt-1">From completed tasks</p>
          </div>
          <div className="bg-[#2B2B2B] p-6 rounded-lg border border-[#423F3E]">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Attendance Rate</h3>
            <p className="text-3xl font-bold text-purple-400">{summary.attendancePercentage}%</p>
            <p className="text-xs text-gray-500 mt-1">Overall attendance percentage</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#2B2B2B] rounded-lg border border-[#423F3E] p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Filters</h3>
            <div className="flex gap-2">
              <Button 
                onClick={applyFilters} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Show Tasks
              </Button>
              <Button 
                onClick={exportToExcel} 
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!filters.date || filteredTasks.length === 0}
              >
                Export to Excel
              </Button>
              <Button 
                onClick={clearFilters} 
                variant="outline" 
                className="border-gray-400 text-black hover:bg-gray-500"
              >
                Clear Date
              </Button>
            </div>
          </div>
          
          <div className="max-w-md">
            <Label htmlFor="date" className="text-white text-lg mb-3 block">Select Date *</Label>
            <Input
              id="date"
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({date: e.target.value})}
              className="bg-[#362222] border-[#423F3E] text-white text-lg p-3"
              placeholder="Select a specific date"
            />
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-[#2B2B2B] rounded-lg border border-[#423F3E] p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Attendance Tasks ({filteredTasks.length} results)
          </h3>
          
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-2">
                {!filters.date ? 
                  'Please select a date and click "Show Tasks" to view attendance data' :
                  'No attendance tasks found for this date'
                }
              </p>
              <p className="text-gray-500 text-sm">
                {!filters.date ? 
                  'Choose a specific date to see all attendance tasks for that day.' :
                  'Try selecting a different date to see attendance data.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#423F3E]">
                    <th className="pb-3 text-gray-300 font-medium">Class</th>
                    <th className="pb-3 text-gray-300 font-medium">Assigned To</th>
                    <th className="pb-3 text-gray-300 font-medium">Target Date</th>
                    <th className="pb-3 text-gray-300 font-medium">Status</th>
                    <th className="pb-3 text-gray-300 font-medium">Total Students</th>
                    <th className="pb-3 text-gray-300 font-medium">Attendance</th>
                    <th className="pb-3 text-gray-300 font-medium">Percentage</th>
                    <th className="pb-3 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => (
                    <tr key={task.id} className="border-b border-[#423F3E]/50">
                      <td className="py-3 text-white">
                        {task.branch} {task.medium} {task.year.replace('_', ' ')}
                      </td>
                      <td className="py-3 text-gray-300">{task.assigned_to}</td>
                      <td className="py-3 text-gray-300">{formatDate(task.target_date)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded-full text-white ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-300">
                        {task.total_students || 'N/A'}
                      </td>
                      <td className="py-3 text-gray-300">
                        {task.status === 'completed' ? (
                          task.total_students ? 
                            `${task.students_present} / ${task.total_students}` :
                            (task.students_present || task.total_students_present || 'N/A')
                        ) : '-'}
                      </td>
                      <td className="py-3 text-gray-300">
                        {task.status === 'completed' ? (
                          task.total_students && task.students_present !== null ? 
                            `${((task.students_present / task.total_students) * 100).toFixed(1)}%` :
                            'N/A'
                        ) : '-'}
                      </td>
                      <td className="py-3">
                        <Button
                          onClick={() => handleDeleteTask(task.id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceReports;
