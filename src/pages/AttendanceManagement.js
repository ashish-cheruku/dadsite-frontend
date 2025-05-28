import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { attendanceService } from '../services/api';
import { authService } from '../services/api';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ErrorDisplay, setSafeError } from '../utils/errorHandler';
import { Helmet } from 'react-helmet';

// Debounce hook for performance optimization
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const AttendanceManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  
  // Filters for class selection
  const [selectedYear, setSelectedYear] = useState('1');
  const [selectedGroup, setSelectedGroup] = useState('mpc');
  const [selectedMedium, setSelectedMedium] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('january');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  
  // Debounced filter values to reduce API calls
  const debouncedYear = useDebounce(selectedYear, 300);
  const debouncedGroup = useDebounce(selectedGroup, 300);
  const debouncedMedium = useDebounce(selectedMedium, 300);
  const debouncedMonth = useDebounce(selectedMonth, 300);
  const debouncedAcademicYear = useDebounce(academicYear, 300);
  
  // Multi-month selection for export
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  
  // Working days state (for principal)
  const [workingDays, setWorkingDays] = useState(0);
  const [isWorkingDaysModalOpen, setIsWorkingDaysModalOpen] = useState(false);
  const [newWorkingDays, setNewWorkingDays] = useState(0);
  
  // Students and attendance data
  const [classAttendance, setClassAttendance] = useState(null);
  // Add state for temporary attendance values
  const [tempAttendance, setTempAttendance] = useState({});
  
  // Add student-specific loading state
  const [savingStudents, setSavingStudents] = useState({});
  
  // Tab state for switching between regular attendance and low attendance view
  const [activeTab, setActiveTab] = useState('attendance');
  
  // Low attendance state
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState([]);
  const [percentageThreshold, setPercentageThreshold] = useState(75);
  const [loadingLowAttendance, setLoadingLowAttendance] = useState(false);
  
  // Cache for API responses to avoid redundant calls
  const [dataCache, setDataCache] = useState(new Map());
  
  // Memoized cache key generator
  const getCacheKey = useCallback((year, group, medium, academicYear, month) => {
    return `${year}-${group}-${medium || 'all'}-${academicYear}-${month}`;
  }, []);
  
  // New state for bulk operations
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [bulkValue, setBulkValue] = useState('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [pendingChanges, setPendingChanges] = useState(new Map());
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [bulkUpdateProgress, setBulkUpdateProgress] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUserRole(user.role);
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    
    getCurrentUser();
  }, []);
  
  const fetchClassAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Generate cache key
      const cacheKey = getCacheKey(debouncedYear, debouncedGroup, debouncedMedium, debouncedAcademicYear, debouncedMonth);
      
      // Check cache first
      if (dataCache.has(cacheKey)) {
        const cachedData = dataCache.get(cacheKey);
        setClassAttendance(cachedData.classAttendance);
        setWorkingDays(cachedData.workingDays);
        setLoading(false);
        return;
      }
      
      // Fetch working days and class attendance in parallel
      const [workingDaysData, classAttendanceData] = await Promise.all([
        attendanceService.getWorkingDays(debouncedAcademicYear, debouncedMonth),
        attendanceService.getClassAttendance(
          parseInt(debouncedYear),
          debouncedGroup,
          debouncedAcademicYear,
          debouncedMonth,
          debouncedMedium || null
        )
      ]);
      
      console.log('Working days data:', workingDaysData);
      console.log('Class attendance data:', classAttendanceData);
      
      setWorkingDays(workingDaysData.working_days);
      setClassAttendance(classAttendanceData);
      
      // Cache the results
      setDataCache(prev => new Map(prev.set(cacheKey, {
        classAttendance: classAttendanceData,
        workingDays: workingDaysData.working_days
      })));
      
      // Double-check to make sure working days are consistent
      if (classAttendanceData.working_days !== workingDaysData.working_days) {
        console.warn('Working days mismatch between API endpoints');
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setSafeError(setError, err, 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  }, [debouncedYear, debouncedGroup, debouncedMedium, debouncedAcademicYear, debouncedMonth, getCacheKey, dataCache]);
  
  const fetchLowAttendanceStudents = useCallback(async () => {
    try {
      setLoadingLowAttendance(true);
      setError('');
      
      const year = debouncedYear ? parseInt(debouncedYear) : null;
      const group = debouncedGroup || null;
      const medium = debouncedMedium || null;
      
      const data = await attendanceService.getStudentsWithLowAttendance(
        debouncedAcademicYear,
        debouncedMonth,
        percentageThreshold,
        year,
        group,
        medium
      );
      
      setLowAttendanceStudents(data.students);
    } catch (err) {
      console.error('Error fetching low attendance data:', err);
      setSafeError(setError, err, 'Failed to fetch students with low attendance');
    } finally {
      setLoadingLowAttendance(false);
    }
  }, [debouncedAcademicYear, debouncedMonth, percentageThreshold, debouncedYear, debouncedGroup, debouncedMedium]);
  
  useEffect(() => {
    if (debouncedYear && debouncedGroup && debouncedMonth && debouncedAcademicYear) {
      fetchClassAttendance();
    }
  }, [debouncedYear, debouncedGroup, debouncedMedium, debouncedMonth, debouncedAcademicYear, fetchClassAttendance]);
  
  // Fetch low attendance data when tab changes to low attendance or when filters change
  useEffect(() => {
    if (activeTab === 'lowAttendance' && percentageThreshold > 0) {
      fetchLowAttendanceStudents();
    }
  }, [activeTab, debouncedAcademicYear, debouncedMonth, percentageThreshold, debouncedYear, debouncedGroup, debouncedMedium, fetchLowAttendanceStudents]);
  
  // Initialize temporary attendance values when class attendance is fetched
  useEffect(() => {
    if (classAttendance && classAttendance.students) {
      const initialValues = {};
      classAttendance.students.forEach(student => {
        initialValues[student.student_id] = student.days_present;
      });
      setTempAttendance(initialValues);
    }
  }, [classAttendance]);
  
  // Auto-save with debouncing
  const useAutoSave = (value, delay = 2000) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    
    return debouncedValue;
  };

  // Track pending changes for auto-save
  const pendingChangesDebounced = useAutoSave(pendingChanges, 2000);

  // Bulk attendance update function with useCallback
  const handleBulkAttendanceUpdate = useCallback(async (attendanceUpdates) => {
    try {
      setIsBulkUpdating(true);
      setBulkUpdateProgress('Preparing updates...');
      
      // Validate all updates first
      for (const [studentId, daysPresent] of attendanceUpdates) {
        if (daysPresent < 0 || (workingDays > 0 && daysPresent > workingDays)) {
          throw new Error(`Invalid attendance value for student ${studentId}: must be between 0 and ${workingDays}`);
        }
      }
      
      // Process in batches of 10 for better performance
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < attendanceUpdates.length; i += batchSize) {
        batches.push(attendanceUpdates.slice(i, i + batchSize));
      }
      
      let processedCount = 0;
      const totalCount = attendanceUpdates.length;
      
      for (const batch of batches) {
        setBulkUpdateProgress(`Updating ${processedCount + 1}-${Math.min(processedCount + batch.length, totalCount)} of ${totalCount} students...`);
        
        // Process batch in parallel
        const batchPromises = batch.map(async ([studentId, daysPresent]) => {
          try {
            const result = await attendanceService.updateStudentAttendance(
              studentId,
              debouncedAcademicYear,
              debouncedMonth,
              daysPresent
            );
            return { studentId, success: true, result };
          } catch (err) {
            console.error(`Failed to update student ${studentId}:`, err);
            return { studentId, success: false, error: err };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        // Update local state with successful results
        batchResults.forEach(({ studentId, success, result }) => {
          if (success) {
            setTempAttendance(prev => ({
              ...prev,
              [studentId]: result.days_present
            }));
          }
        });
        
        processedCount += batch.length;
      }
      
      // Clear cache to force refresh
      const cacheKey = getCacheKey(debouncedYear, debouncedGroup, debouncedMedium, debouncedAcademicYear, debouncedMonth);
      setDataCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(cacheKey);
        return newCache;
      });
      
      setBulkUpdateProgress('Updates completed successfully!');
      setTimeout(() => setBulkUpdateProgress(''), 2000);
      
    } catch (err) {
      console.error('Bulk update failed:', err);
      setSafeError(setError, err, 'Failed to update attendance');
      setBulkUpdateProgress('');
    } finally {
      setIsBulkUpdating(false);
    }
  }, [workingDays, debouncedAcademicYear, debouncedMonth, debouncedYear, debouncedGroup, debouncedMedium, getCacheKey]);

  // Auto-save effect - simplified to avoid circular dependency
  useEffect(() => {
    if (autoSaveEnabled && pendingChangesDebounced.size > 0) {
      const handleAutoSave = async () => {
        try {
          const changesToSave = Array.from(pendingChangesDebounced.entries());
          await handleBulkAttendanceUpdate(changesToSave);
          setPendingChanges(new Map());
          setLastSaveTime(new Date());
        } catch (err) {
          console.error('Auto-save failed:', err);
        }
      };
      
      handleAutoSave();
    }
  }, [pendingChangesDebounced, autoSaveEnabled, handleBulkAttendanceUpdate]);

  // Enhanced attendance input change with auto-save tracking
  const handleAttendanceInputChange = (studentId, value) => {
    const numValue = parseInt(value) || 0;
    
    // Update temp attendance immediately (optimistic update)
    setTempAttendance(prev => ({
      ...prev,
      [studentId]: numValue
    }));
    
    // Track pending changes for auto-save
    if (autoSaveEnabled) {
      setPendingChanges(prev => {
        const newChanges = new Map(prev);
        const originalValue = classAttendance?.students?.find(s => s.student_id === studentId)?.days_present || 0;
        
        if (numValue !== originalValue) {
          newChanges.set(studentId, numValue);
        } else {
          newChanges.delete(studentId);
        }
        
        return newChanges;
      });
    }
  };

  // Student selection functions
  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(studentId)) {
        newSelected.delete(studentId);
      } else {
        newSelected.add(studentId);
      }
      return newSelected;
    });
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.size === classAttendance?.students?.length) {
      setSelectedStudents(new Set());
    } else {
      const allStudentIds = classAttendance?.students?.map(s => s.student_id) || [];
      setSelectedStudents(new Set(allStudentIds));
    }
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedStudents.size === 0) {
      setError('Please select at least one student');
      return;
    }
    
    const selectedStudentIds = Array.from(selectedStudents);
    
    switch (action) {
      case 'mark_present':
        await handleQuickFill(workingDays, selectedStudentIds);
        break;
      case 'mark_absent':
        await handleQuickFill(0, selectedStudentIds);
        break;
      case 'custom_value':
        setIsBulkModalOpen(true);
        break;
      case 'save_selected':
        const selectedChanges = selectedStudentIds
          .map(id => [id, tempAttendance[id] || 0])
          .filter(([id, value]) => {
            const originalValue = classAttendance?.students?.find(s => s.student_id === id)?.days_present || 0;
            return value !== originalValue;
          });
        
        if (selectedChanges.length > 0) {
          await handleBulkAttendanceUpdate(selectedChanges);
        }
        break;
    }
  };

  // Quick fill function
  const handleQuickFill = async (value, studentIds = null) => {
    const targetStudents = studentIds || Array.from(selectedStudents);
    
    if (targetStudents.length === 0) {
      setError('No students selected');
      return;
    }
    
    // Update temp attendance for all selected students
    const updates = targetStudents.map(studentId => {
      setTempAttendance(prev => ({
        ...prev,
        [studentId]: value
      }));
      return [studentId, value];
    });
    
    // If auto-save is enabled, save immediately
    if (autoSaveEnabled) {
      await handleBulkAttendanceUpdate(updates);
    } else {
      // Otherwise, just update the UI
      updates.forEach(([studentId, val]) => {
        setPendingChanges(prev => {
          const newChanges = new Map(prev);
          newChanges.set(studentId, val);
          return newChanges;
        });
      });
    }
    
    setIsBulkModalOpen(false);
    setBulkValue('');
  };

  // Save all pending changes
  const handleSaveAllChanges = async () => {
    if (pendingChanges.size === 0) {
      setError('No changes to save');
      return;
    }
    
    const allChanges = Array.from(pendingChanges.entries());
    await handleBulkAttendanceUpdate(allChanges);
    setPendingChanges(new Map());
  };
  
  const handleUpdateAttendance = async (studentId) => {
    try {
      // Set loading state just for this student
      setSavingStudents(prev => ({ ...prev, [studentId]: true }));
      setError(''); // Clear any previous errors
      
      const daysPresent = tempAttendance[studentId];
      
      if (daysPresent < 0 || (workingDays > 0 && daysPresent > workingDays)) {
        setError(`Days present must be between 0 and ${workingDays}`);
        setSavingStudents(prev => ({ ...prev, [studentId]: false }));
        return;
      }
      
      // Call API to update attendance
      const result = await attendanceService.updateStudentAttendance(
        studentId,
        debouncedAcademicYear,
        debouncedMonth,
        daysPresent
      );
      
      // Update the local state with the returned value to ensure UI consistency
      setTempAttendance(prev => ({
        ...prev,
        [studentId]: result.days_present
      }));
      
      // Clear cache for this specific combination to force refresh on next load
      const cacheKey = getCacheKey(debouncedYear, debouncedGroup, debouncedMedium, debouncedAcademicYear, debouncedMonth);
      setDataCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(cacheKey);
        return newCache;
      });
      
    } catch (err) {
      console.error('Error updating attendance:', err);
      setSafeError(setError, err, 'Failed to update attendance');
    } finally {
      setSavingStudents(prev => ({ ...prev, [studentId]: false }));
    }
  };
  
  const handleSetWorkingDays = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      if (newWorkingDays < 0 || newWorkingDays > 31) {
        setError('Working days must be between 0 and 31');
        setLoading(false);
        return;
      }
      
      await attendanceService.setWorkingDays(
        debouncedAcademicYear,
        debouncedMonth,
        newWorkingDays
      );
      
      setWorkingDays(newWorkingDays);
      setIsWorkingDaysModalOpen(false);
      
      // Clear cache to force refresh
      setDataCache(new Map());
      
      // Refresh the attendance data
      await fetchClassAttendance();
    } catch (err) {
      console.error('Error setting working days:', err);
      setSafeError(setError, err, 'Failed to set working days');
    } finally {
      setLoading(false);
    }
  };
  
  const formatMonthName = (month) => {
    return month.charAt(0).toUpperCase() + month.slice(1);
  };
  
  const handleMonthToggle = (month) => {
    if (selectedMonths.includes(month)) {
      setSelectedMonths(selectedMonths.filter(m => m !== month));
    } else {
      setSelectedMonths([...selectedMonths, month]);
    }
  };
  
  const handleSelectAllMonths = () => {
    const allMonths = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
    setSelectedMonths(allMonths);
  };
  
  const handleClearMonthSelection = () => {
    setSelectedMonths([]);
  };
  
  // Optimized export function with better progress tracking
  const exportAttendanceData = async () => {
    if (selectedMonths.length === 0) {
      setError('Please select at least one month to export');
      return;
    }
    
    try {
      setExportLoading(true);
      setError('');
      setExportProgress('Initializing export...');
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Process months in batches to improve performance
      const batchSize = 3;
      const monthBatches = [];
      for (let i = 0; i < selectedMonths.length; i += batchSize) {
        monthBatches.push(selectedMonths.slice(i, i + batchSize));
      }
      
      let processedMonths = 0;
      const totalMonths = selectedMonths.length;
      
      for (const batch of monthBatches) {
        setExportProgress(`Processing months ${processedMonths + 1}-${Math.min(processedMonths + batch.length, totalMonths)} of ${totalMonths}...`);
        
        // Process batch in parallel
        const batchPromises = batch.map(async (month) => {
          try {
            const data = await attendanceService.getClassAttendance(
              parseInt(debouncedYear),
              debouncedGroup,
              debouncedAcademicYear,
              month,
              debouncedMedium || null
            );
            return { month, data };
          } catch (err) {
            console.error(`Error fetching data for ${month}:`, err);
            return { month, data: null };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        // Process results
        batchResults.forEach(({ month, data }) => {
          if (!data || !data.students || data.students.length === 0) {
            return;
          }
          
          // Create headers
          const headers = [
            'Admission Number',
            'Student Name',
            'Days Present',
            'Working Days',
            'Attendance Percentage'
          ];
          
          // Create data rows
          const rows = data.students.map(student => [
            student.admission_number,
            student.student_name,
            student.days_present,
            data.working_days,
            `${student.attendance_percentage.toFixed(1)}%`
          ]);
          
          // Add headers as first row
          const sheetData = [headers, ...rows];
          
          // Create worksheet
          const ws = XLSX.utils.aoa_to_sheet(sheetData);
          
          // Set column widths
          ws['!cols'] = [
            { wch: 15 }, // Admission Number
            { wch: 25 }, // Student Name
            { wch: 12 }, // Days Present
            { wch: 12 }, // Working Days
            { wch: 20 }  // Attendance Percentage
          ];
          
          // Add worksheet to workbook (sheet name is capitalized month name)
          XLSX.utils.book_append_sheet(wb, ws, formatMonthName(month));
        });
        
        processedMonths += batch.length;
      }
      
      // Check if any data was added
      if (wb.SheetNames.length === 0) {
        setError('No data available for the selected months');
        setExportLoading(false);
        setExportProgress('');
        return;
      }
      
      setExportProgress('Generating Excel file...');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create filename with class and date info
      const filename = `attendance_${debouncedYear}_${debouncedGroup}${debouncedMedium ? '_' + debouncedMedium : ''}_${debouncedAcademicYear}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      setExportProgress('Downloading file...');
      
      // Save file
      saveAs(blob, filename);
      
      // Close modal after successful export
      setIsExportModalOpen(false);
      setExportProgress('');
    } catch (err) {
      console.error('Error exporting attendance data:', err);
      setSafeError(setError, err, 'Failed to export attendance data');
    } finally {
      setExportLoading(false);
      setExportProgress('');
    }
  };
  
  // Export low attendance data
  const exportLowAttendanceData = async () => {
    try {
      setExportLoading(true);
      setError('');
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Create headers
      const headers = [
        'Admission Number',
        'Student Name',
        'Year',
        'Group',
        'Days Present',
        'Working Days',
        'Attendance Percentage'
      ];
      
      // Create data rows
      const rows = lowAttendanceStudents.map(student => [
        student.admission_number,
        student.student_name,
        student.year,
        student.group.toUpperCase(),
        student.days_present,
        student.working_days,
        `${student.attendance_percentage.toFixed(1)}%`
      ]);
      
      // Add headers as first row
      const sheetData = [headers, ...rows];
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // Admission Number
        { wch: 25 }, // Student Name
        { wch: 8 },  // Year
        { wch: 10 }, // Group
        { wch: 12 }, // Days Present
        { wch: 12 }, // Working Days
        { wch: 20 }  // Attendance Percentage
      ];
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, `Low Attendance Below ${percentageThreshold}%`);
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create filename with info
      const filename = `low_attendance_below_${percentageThreshold}pct_${debouncedMonth}_${debouncedAcademicYear}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      // Save file
      saveAs(blob, filename);
    } catch (err) {
      console.error('Error exporting low attendance data:', err);
      setSafeError(setError, err, 'Failed to export low attendance data');
    } finally {
      setExportLoading(false);
    }
  };
  
  // Memoized student table rows for better performance
  const studentTableRows = useMemo(() => {
    if (!classAttendance || !classAttendance.students) return [];
    
    return classAttendance.students.map((student) => (
      <tr key={student.student_id} className={`hover:bg-[#362222] ${selectedStudents.has(student.student_id) ? 'bg-[#2a1f1f]' : ''}`}>
        <td className="px-6 py-4 whitespace-nowrap text-center">
          <input
            type="checkbox"
            checked={selectedStudents.has(student.student_id)}
            onChange={() => handleSelectStudent(student.student_id)}
            className="h-4 w-4 text-[#362222] bg-[#171010] border-[#423F3E] rounded focus:ring-0"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
          {student.admission_number}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
          {student.student_name}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max={workingDays}
              value={tempAttendance[student.student_id] || 0}
              onChange={(e) => handleAttendanceInputChange(student.student_id, e.target.value)}
              className={`w-20 px-2 py-1 bg-[#171010] border rounded text-white text-center ${
                pendingChanges.has(student.student_id) 
                  ? 'border-yellow-500 bg-yellow-900/20' 
                  : 'border-[#423F3E]'
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
              }}
            />
            {!autoSaveEnabled && (
              <Button
                onClick={() => handleUpdateAttendance(student.student_id)}
                disabled={savingStudents[student.student_id] || tempAttendance[student.student_id] === student.days_present}
                className="px-3 py-1 text-xs"
                style={{ 
                  backgroundColor: tempAttendance[student.student_id] === student.days_present ? '#666' : '#362222', 
                  color: 'white' 
                }}
              >
                {savingStudents[student.student_id] ? 'Saving...' : 'Save'}
              </Button>
            )}
            {pendingChanges.has(student.student_id) && autoSaveEnabled && (
              <div className="flex items-center text-yellow-400 text-xs">
                <div className="animate-pulse h-2 w-2 bg-yellow-400 rounded-full mr-1"></div>
                Pending
              </div>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
          {workingDays}
        </td>
        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
          student.attendance_percentage >= 75 ? 'text-green-400' : 
          student.attendance_percentage >= 50 ? 'text-yellow-400' : 
          'text-red-400'
        }`}>
          {student.attendance_percentage.toFixed(1)}%
        </td>
      </tr>
    ));
  }, [classAttendance, tempAttendance, workingDays, savingStudents, selectedStudents, pendingChanges, autoSaveEnabled, handleAttendanceInputChange, handleUpdateAttendance, handleSelectStudent]);
  
  if (loading && !classAttendance && activeTab === 'attendance') {
    return (
      <div className="min-h-screen bg-[#171010]">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-2xl font-semibold animate-pulse text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#171010]">
      <Helmet>
        <title>Attendance Management | Government Junior College</title>
        <link rel="icon" type="image/png" href="/images/logo.png" />
      </Helmet>
      <Navbar />
      
      <main className="flex-1 container py-8 mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#423F3E]">
            <div>
              <h1 className="text-3xl font-bold text-white">Attendance Management</h1>
              <p className="mt-2 text-gray-300">Track and manage student attendance records</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => setIsExportModalOpen(true)}
                className="py-2 px-4 rounded-lg"
                style={{ backgroundColor: '#362222', color: 'white' }}
              >
                Export Attendance
              </Button>
              {userRole === 'principal' && (
                <Button 
                  onClick={() => {
                    // Initialize the new working days input with the current working days value
                    setNewWorkingDays(workingDays);
                    setIsWorkingDaysModalOpen(true);
                  }}
                  className="py-2 px-4 rounded-lg"
                  style={{ backgroundColor: '#362222', color: 'white' }}
                >
                  Set Working Days
                </Button>
              )}
            </div>
          </div>
          
          <ErrorDisplay error={error} />
          
          {/* Auto-save Status */}
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-save"
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    className="h-4 w-4 text-[#362222] bg-[#171010] border-[#423F3E] rounded focus:ring-0"
                  />
                  <label htmlFor="auto-save" className="text-white text-sm font-medium">
                    Auto-save enabled
                  </label>
                </div>
                
                {pendingChanges.size > 0 && (
                  <div className="flex items-center space-x-2 text-yellow-400 text-sm">
                    <div className="animate-pulse h-2 w-2 bg-yellow-400 rounded-full"></div>
                    <span>{pendingChanges.size} pending changes</span>
                  </div>
                )}
                
                {lastSaveTime && (
                  <div className="text-green-400 text-sm">
                    Last saved: {lastSaveTime.toLocaleTimeString()}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                {!autoSaveEnabled && pendingChanges.size > 0 && (
                  <Button
                    onClick={handleSaveAllChanges}
                    className="px-4 py-2 text-sm"
                    style={{ backgroundColor: '#362222', color: 'white' }}
                    disabled={isBulkUpdating}
                  >
                    Save All Changes ({pendingChanges.size})
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Bulk Update Progress */}
          {isBulkUpdating && bulkUpdateProgress && (
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                <span className="text-white font-medium">{bulkUpdateProgress}</span>
              </div>
              <div className="w-full bg-[#171010] rounded-full h-2 mt-2">
                <div className="bg-[#362222] h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          )}
          
          {/* Loading indicator for filter changes */}
          {loading && classAttendance && (
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-4 mb-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white mr-3"></div>
                <span className="text-white">Updating attendance data...</span>
              </div>
            </div>
          )}
          
          {/* Class Selection */}
          <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-4 mb-6">
            <h3 className="text-white font-semibold mb-3">Select Class and Month</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Year</label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                  disabled={loading}
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">Group</label>
                <select 
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                  disabled={loading}
                >
                  <option value="mpc">MPC</option>
                  <option value="bipc">BiPC</option>
                  <option value="cec">CEC</option>
                  <option value="hec">HEC</option>
                  <option value="thm">T&HM</option>
                  <option value="oas">OAS</option>
                  <option value="mphw">MPHW</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">Medium</label>
                <select 
                  value={selectedMedium}
                  onChange={(e) => setSelectedMedium(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                  disabled={loading}
                >
                  <option value="">All Mediums</option>
                  <option value="english">English</option>
                  <option value="telugu">Telugu</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">Month</label>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                  disabled={loading}
                >
                  <option value="january">January</option>
                  <option value="february">February</option>
                  <option value="march">March</option>
                  <option value="april">April</option>
                  <option value="may">May</option>
                  <option value="june">June</option>
                  <option value="july">July</option>
                  <option value="august">August</option>
                  <option value="september">September</option>
                  <option value="october">October</option>
                  <option value="november">November</option>
                  <option value="december">December</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-1">Academic Year</label>
                <select 
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                  disabled={loading}
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Working Days Summary */}
          <div className="bg-[#1e1e1e] rounded-lg shadow-md border border-[#423F3E] p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-semibold">
                  Working Days for {formatMonthName(selectedMonth)} {academicYear}
                </h3>
                <p className="text-gray-300 mt-1">
                  Total working days: <span className="font-bold">{workingDays}</span>
                </p>
              </div>
              {userRole === 'principal' && (
                <Button 
                  onClick={() => {
                    setNewWorkingDays(workingDays);
                    setIsWorkingDaysModalOpen(true);
                  }}
                  className="py-2 px-4 rounded-lg"
                  style={{ backgroundColor: '#362222', color: 'white' }}
                >
                  Update Working Days
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedStudents.size > 0 && (
            <div className="bg-[#362222] rounded-lg shadow-md border border-[#423F3E] p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="text-white">
                  <span className="font-medium">{selectedStudents.size}</span> student{selectedStudents.size !== 1 ? 's' : ''} selected
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleBulkAction('mark_present')}
                    className="px-3 py-1 text-sm"
                    style={{ backgroundColor: '#22c55e', color: 'white' }}
                    disabled={isBulkUpdating}
                  >
                    Mark Present ({workingDays})
                  </Button>
                  <Button
                    onClick={() => handleBulkAction('mark_absent')}
                    className="px-3 py-1 text-sm"
                    style={{ backgroundColor: '#ef4444', color: 'white' }}
                    disabled={isBulkUpdating}
                  >
                    Mark Absent (0)
                  </Button>
                  <Button
                    onClick={() => handleBulkAction('custom_value')}
                    className="px-3 py-1 text-sm"
                    style={{ backgroundColor: '#3b82f6', color: 'white' }}
                    disabled={isBulkUpdating}
                  >
                    Custom Value
                  </Button>
                  {!autoSaveEnabled && (
                    <Button
                      onClick={() => handleBulkAction('save_selected')}
                      className="px-3 py-1 text-sm"
                      style={{ backgroundColor: '#362222', color: 'white' }}
                      disabled={isBulkUpdating}
                    >
                      Save Selected
                    </Button>
                  )}
                  <Button
                    onClick={() => setSelectedStudents(new Set())}
                    className="px-3 py-1 text-sm"
                    style={{ backgroundColor: '#6b7280', color: 'white' }}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Table */}
          {classAttendance && classAttendance.students && classAttendance.students.length > 0 ? (
            <>
              {/* Regular Attendance Table */}
              <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#423F3E] bg-[#362222]">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">
                      Class Attendance - {formatMonthName(selectedMonth)} {academicYear}
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-300">
                        {classAttendance.students.length} students
                      </div>
                      <Button
                        onClick={handleSelectAllStudents}
                        className="px-3 py-1 text-sm"
                        style={{ backgroundColor: '#171010', color: 'white' }}
                      >
                        {selectedStudents.size === classAttendance.students.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#423F3E]">
                    <thead className="bg-[#362222]">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={classAttendance.students.length > 0 && selectedStudents.size === classAttendance.students.length}
                            onChange={handleSelectAllStudents}
                            className="h-4 w-4 text-[#362222] bg-[#171010] border-[#423F3E] rounded focus:ring-0"
                          />
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Admission No.
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Days Present
                          {autoSaveEnabled && (
                            <div className="text-xs text-yellow-400 font-normal mt-1">Auto-save enabled</div>
                          )}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Working Days
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Attendance %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#2B2B2B] divide-y divide-[#423F3E]">
                      {studentTableRows}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-8 text-center">
              <div className="text-gray-300">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <h3 className="text-lg font-medium text-white mb-2">No Students Found</h3>
                <p className="text-gray-400">
                  No students found in this class or no attendance records available for the selected filters.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Set Working Days Modal */}
      {isWorkingDaysModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Set Working Days</h2>
            <p className="text-gray-300 mb-4">
              Set the total working days for {formatMonthName(selectedMonth)} {academicYear}
            </p>
            
            <form onSubmit={handleSetWorkingDays}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Working Days</label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  value={newWorkingDays}
                  onChange={(e) => setNewWorkingDays(e.target.value)}
                  className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsWorkingDaysModalOpen(false)}
                  className="px-4 py-2 bg-[#171010] text-white rounded-md hover:bg-[#362222]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#362222] text-white rounded-md hover:bg-[#423F3E]"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Export Attendance Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold text-white mb-4">Export Attendance Data</h2>
            <p className="text-gray-300 mb-6">
              Select the months to include in the export for {selectedYear}st Year, {selectedGroup.toUpperCase()}
              {selectedMedium && ` (${selectedMedium.charAt(0).toUpperCase() + selectedMedium.slice(1)} Medium)`} ({academicYear})
            </p>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Months</h3>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleSelectAllMonths}
                    className="px-3 py-1 text-sm bg-[#362222] text-white rounded-md hover:bg-[#423F3E]"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClearMonthSelection}
                    className="px-3 py-1 text-sm bg-[#171010] text-white rounded-md hover:bg-[#2B2B2B]"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {['january', 'february', 'march', 'april', 'may', 'june', 
                  'july', 'august', 'september', 'october', 'november', 'december'].map((month) => (
                  <div key={month} 
                    className={`p-3 rounded-lg cursor-pointer border ${
                      selectedMonths.includes(month) 
                        ? 'bg-[#362222] text-white border-[#423F3E]' 
                        : 'bg-[#171010] text-gray-300 border-[#2B2B2B] hover:bg-[#202020]'
                    }`}
                    onClick={() => handleMonthToggle(month)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedMonths.includes(month)}
                        onChange={() => {}} // Handled by div onClick
                        className="h-4 w-4 rounded border-gray-600 bg-[#171010] checked:bg-[#362222]"
                      />
                      <span className="ml-2">{formatMonthName(month)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 bg-[#171010] text-white rounded-md hover:bg-[#362222]"
                disabled={exportLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={exportAttendanceData}
                className="px-4 py-2 bg-[#362222] text-white rounded-md hover:bg-[#423F3E] flex items-center"
                disabled={exportLoading || selectedMonths.length === 0}
              >
                {exportLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                    Exporting...
                  </>
                ) : (
                  <>Export</>
                )}
              </button>
            </div>
            
            {/* Export Progress */}
            {exportLoading && exportProgress && (
              <div className="mt-4 p-3 bg-[#171010] rounded-lg border border-[#423F3E]">
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                  <span className="text-white text-sm">{exportProgress}</span>
                </div>
                <div className="w-full bg-[#2B2B2B] rounded-full h-2 mt-2">
                  <div className="bg-[#362222] h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Value Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2B2B2B] rounded-lg shadow-xl border border-[#423F3E] p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Set Custom Attendance</h2>
            <p className="text-gray-300 mb-4">
              Set attendance for {selectedStudents.size} selected student{selectedStudents.size !== 1 ? 's' : ''}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Days Present</label>
              <input
                type="number"
                min="0"
                max={workingDays}
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                className="w-full px-3 py-2 bg-[#171010] border border-[#423F3E] rounded-md text-white"
                placeholder={`Enter value (0-${workingDays})`}
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkValue('');
                }}
                className="px-4 py-2"
                style={{ backgroundColor: '#6b7280', color: 'white' }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleQuickFill(parseInt(bulkValue) || 0)}
                disabled={!bulkValue || parseInt(bulkValue) < 0 || parseInt(bulkValue) > workingDays}
                className="px-4 py-2"
                style={{ backgroundColor: '#362222', color: 'white' }}
              >
                Apply to Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement; 