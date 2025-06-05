import React, { useState, useEffect } from 'react';
import { subjectMarksConfigService, authService, examService } from '../services/api';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { ErrorDisplay, setSafeError } from '../utils/errorHandler';

const SubjectMarksConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingExamType, setEditingExamType] = useState('ut1');
  const [editMarks, setEditMarks] = useState({});
  const [saving, setSaving] = useState(false);

  const groups = [
    { code: 'MPC', name: 'Mathematics, Physics, Chemistry' },
    { code: 'BIPC', name: 'Biology, Physics, Chemistry' },
    { code: 'CEC', name: 'Commerce, Economics, Civics' },
    { code: 'HEC', name: 'History, Economics, Commerce' },
    { code: 'THM', name: 'Tourism & Hotel Management' },
    { code: 'OAS', name: 'Office Administration & Secretarial Practice' },
    { code: 'MPHW', name: 'Multi Purpose Health Worker' }
  ];

  const examTypes = [
    { code: 'ut1', name: 'Unit Test 1' },
    { code: 'ut2', name: 'Unit Test 2' },
    { code: 'ut3', name: 'Unit Test 3' },
    { code: 'ut4', name: 'Unit Test 4' },
    { code: 'half-yearly', name: 'Half Yearly' },
    { code: 'final', name: 'Final' }
  ];

  useEffect(() => {
    // Check if user is principal
    if (!authService.hasRole('principal')) {
      setError('Access denied. Principal role required.');
      return;
    }

    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await subjectMarksConfigService.getAllConfigs();
      setConfigs(data);
    } catch (err) {
      setSafeError(setError, err, 'Failed to fetch subject marks configurations');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaults = async () => {
    try {
      setSaving(true);
      const result = await subjectMarksConfigService.initializeDefaults();
      setSuccess(result.message);
      await fetchConfigs();
    } catch (err) {
      setSafeError(setError, err, 'Failed to initialize default configurations');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (groupCode) => {
    try {
      setLoading(true);
      const config = await subjectMarksConfigService.getConfig(groupCode);
      setEditingGroup(groupCode);
      setEditingExamType('ut1'); // Default to UT1
      
      // Initialize editMarks with the full exam_configs structure
      let editMarksData = config.exam_configs || {};
      
      // Ensure all exam types exist with proper subject structure
      const examTypes = ['ut1', 'ut2', 'ut3', 'ut4', 'half-yearly', 'final'];
      
      // If exam_configs is missing or incomplete, fetch subjects and create default structure
      if (!editMarksData || Object.keys(editMarksData).length === 0) {
        try {
          const subjectsData = await examService.getSubjectsForGroup(groupCode);
          const subjects = subjectsData.subjects || [];
          
          editMarksData = {};
          examTypes.forEach(examType => {
            editMarksData[examType] = {};
            subjects.forEach(subject => {
              // Unit tests get 50 marks, others get 100
              editMarksData[examType][subject] = examType.startsWith('ut') ? 50 : 100;
            });
          });
        } catch (err) {
          console.error('Failed to fetch subjects for group:', err);
          setError(`Failed to initialize configuration for ${groupCode}`);
          setLoading(false);
          return;
        }
      } else {
        // Ensure all exam types exist in the data
        try {
          const subjectsData = await examService.getSubjectsForGroup(groupCode);
          const subjects = subjectsData.subjects || [];
          
          examTypes.forEach(examType => {
            if (!editMarksData[examType]) {
              editMarksData[examType] = {};
              subjects.forEach(subject => {
                editMarksData[examType][subject] = examType.startsWith('ut') ? 50 : 100;
              });
            } else {
              // Ensure all subjects exist for this exam type
              subjects.forEach(subject => {
                if (editMarksData[examType][subject] === undefined) {
                  editMarksData[examType][subject] = examType.startsWith('ut') ? 50 : 100;
                }
              });
            }
          });
        } catch (err) {
          console.error('Failed to validate configuration structure:', err);
        }
      }
      
      setEditMarks(editMarksData);
      setError('');
      setSuccess('');
    } catch (err) {
      setSafeError(setError, err, `Failed to fetch configuration for ${groupCode}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (examType, subject, value) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) {
      value = 1;
    } else if (numValue > 1000) {
      value = 1000;
    }
    
    setEditMarks(prev => ({
      ...prev,
      [examType]: {
        ...prev[examType],
        [subject]: parseInt(value, 10)
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const configData = {
        group: editingGroup,
        exam_configs: editMarks
      };
      
      await subjectMarksConfigService.updateConfig(editingGroup, { exam_configs: editMarks });
      setSuccess(`Configuration updated successfully for ${editingGroup}`);
      setEditingGroup(null);
      setEditMarks({});
      await fetchConfigs();
    } catch (err) {
      setSafeError(setError, err, 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingGroup(null);
    setEditMarks({});
    setEditingExamType('ut1');
    setError('');
    setSuccess('');
  };

  const getConfigForGroup = (groupCode) => {
    return configs.find(config => config.group === groupCode);
  };

  const formatSubjectName = (subject) => {
    return subject.replace(/_/g, '/').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatExamTypeName = (examType) => {
    const examTypeObj = examTypes.find(et => et.code === examType);
    return examTypeObj ? examTypeObj.name : examType.toUpperCase();
  };

  if (!authService.hasRole('principal')) {
    return (
      <div className="min-h-screen bg-[#2A2A2A]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Access denied. Principal role required.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2A2A2A]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Subject Marks Configuration</h1>
          <Button 
            onClick={initializeDefaults}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? 'Initializing...' : 'Initialize Defaults'}
          </Button>
        </div>

        <div className="mb-4 text-gray-300">
          <p>Configure maximum marks for each subject across all groups and exam types. This will affect how exam percentages are calculated.</p>
        </div>

        {error && <ErrorDisplay error={error} />}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center text-white">Loading configurations...</div>
        ) : (
          <div className="grid gap-6">
            {groups.map((group) => {
              const config = getConfigForGroup(group.code);
              const isEditing = editingGroup === group.code;
              
              return (
                <div key={group.code} className="bg-[#423F3E] rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{group.code}</h2>
                      <p className="text-gray-300 text-sm">{group.name}</p>
                    </div>
                    {!isEditing && (
                      <Button 
                        onClick={() => handleEdit(group.code)}
                        className="bg-[#544E4E] hover:bg-[#6B5B5B] text-white"
                      >
                        Edit
                      </Button>
                    )}
                  </div>

                  {config ? (
                    <div>
                      {isEditing ? (
                        <div>
                          {/* Exam Type Selector */}
                          <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-medium mb-2">
                              Select Exam Type to Edit:
                            </label>
                            <select
                              value={editingExamType}
                              onChange={(e) => setEditingExamType(e.target.value)}
                              className="p-2 bg-[#544E4E] text-white border border-[#6B5B5B] rounded focus:outline-none focus:border-blue-500"
                            >
                              {examTypes.map(examType => (
                                <option key={examType.code} value={examType.code}>
                                  {examType.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Subject Marks for Selected Exam Type */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {editMarks[editingExamType] && Object.entries(editMarks[editingExamType]).map(([subject, marks]) => (
                              <div key={subject} className="bg-[#544E4E] p-3 rounded">
                                <label className="block text-gray-300 text-sm font-medium mb-1">
                                  {formatSubjectName(subject)}
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="1000"
                                  value={marks}
                                  onChange={(e) => handleMarkChange(editingExamType, subject, e.target.value)}
                                  className="w-full p-2 bg-[#423F3E] text-white border border-[#6B5B5B] rounded focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          {/* Display all exam types */}
                          {examTypes.map(examType => {
                            const examConfig = config.exam_configs?.[examType.code];
                            return examConfig ? (
                              <div key={examType.code} className="mb-6">
                                <h4 className="text-lg font-medium text-white mb-3">{examType.name}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {Object.entries(examConfig).map(([subject, marks]) => (
                                    <div key={subject} className="bg-[#544E4E] p-3 rounded">
                                      <div className="text-gray-300 text-sm font-medium mb-1">
                                        {formatSubjectName(subject)}
                                      </div>
                                      <div className="text-white font-semibold text-lg">{marks}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-center py-4">
                      No configuration found. Click "Edit" to create one.
                    </div>
                  )}

                  {isEditing && (
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button 
                        onClick={handleCancel}
                        className="bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {saving ? 'Saving...' : 'Save All Exam Types'}
                      </Button>
                    </div>
                  )}

                  {config && (
                    <div className="mt-4 text-xs text-gray-400">
                      Last updated: {config.updated_at ? new Date(config.updated_at).toLocaleString() : new Date(config.created_at).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectMarksConfig; 