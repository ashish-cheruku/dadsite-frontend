import React, { useState, useEffect } from 'react';
import { collegeAnnouncementService } from '../services/api';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';

const CollegeAnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New announcement form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    link: '',
    link_text: '',
    priority: 'medium'
  });
  
  // Edit announcement modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editLinkText, setEditLinkText] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  
  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);

  // Fetch all college announcements on component mount
  useEffect(() => {
    fetchCollegeAnnouncements();
  }, []);

  const fetchCollegeAnnouncements = async () => {
    try {
      setLoading(true);
      const allAnnouncements = await collegeAnnouncementService.getAllCollegeAnnouncements();
      setAnnouncements(allAnnouncements);
    } catch (err) {
      setError('Failed to fetch college announcements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle create announcement form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAnnouncement(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit new announcement
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setError('');
      await collegeAnnouncementService.createCollegeAnnouncement(
        newAnnouncement.title,
        newAnnouncement.content,
        newAnnouncement.link || null,
        newAnnouncement.link_text || null,
        newAnnouncement.priority
      );
      
      // Reset form and close modal
      setNewAnnouncement({ title: '', content: '', link: '', link_text: '', priority: 'medium' });
      setIsAddModalOpen(false);
      
      // Refresh announcements
      fetchCollegeAnnouncements();
    } catch (err) {
      setError('Failed to create college announcement: ' + (err.detail || 'Unknown error'));
      console.error(err);
    }
  };

  // Handle edit announcement
  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setEditTitle(announcement.title);
    setEditContent(announcement.content);
    setEditLink(announcement.link || '');
    setEditLinkText(announcement.link_text || '');
    setEditPriority(announcement.priority || 'medium');
    setIsEditModalOpen(true);
  };

  // Submit edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setError('');
      await collegeAnnouncementService.updateCollegeAnnouncement(
        editingAnnouncement.id,
        editTitle,
        editContent,
        editLink || null,
        editLinkText || null,
        editPriority,
        null // is_active - keep current value
      );
      
      // Reset form and close modal
      setIsEditModalOpen(false);
      setEditingAnnouncement(null);
      
      // Refresh announcements
      fetchCollegeAnnouncements();
    } catch (err) {
      setError('Failed to update college announcement: ' + (err.detail || 'Unknown error'));
      console.error(err);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (announcement) => {
    setAnnouncementToDelete(announcement);
    setIsDeleteModalOpen(true);
  };

  // Execute delete
  const handleDelete = async () => {
    try {
      setError('');
      await collegeAnnouncementService.deleteCollegeAnnouncement(announcementToDelete.id);
      
      // Close modal and refresh
      setIsDeleteModalOpen(false);
      setAnnouncementToDelete(null);
      fetchCollegeAnnouncements();
    } catch (err) {
      setError('Failed to delete college announcement: ' + (err.detail || 'Unknown error'));
      console.error(err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-900/50 text-red-300 border-red-700';
      case 'low': return 'bg-gray-900/50 text-gray-300 border-gray-700';
      default: return 'bg-gray-800/50 text-gray-300 border-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#171010]">
      <Navbar />
      
      <main className="flex-1 container py-8 mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#423F3E]">
            <div>
              <h1 className="text-3xl font-bold text-white">College Announcement Management</h1>
              <p className="mt-2 text-gray-300">Manage internal college announcements visible only to staff and faculty</p>
            </div>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="py-2 px-4 rounded-lg"
              style={{ backgroundColor: '#362222', color: 'white' }}
            >
              Add New College Announcement
            </Button>
          </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* College Announcements Table */}
        <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#423F3E]">
              <thead className="bg-[#362222]">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Content
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Priority
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Important Link
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Updated At
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#2B2B2B] divide-y divide-[#423F3E]">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-400"></div>
                        <span className="ml-3 text-gray-300">Loading college announcements...</span>
                      </div>
                    </td>
                  </tr>
                ) : announcements.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="text-gray-400 text-6xl mb-4">📢</div>
                      <h3 className="text-xl text-gray-300 mb-2">No College Announcements</h3>
                      <p className="text-gray-400 mb-4">Start by creating your first college announcement</p>
                      <Button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-[#362222] hover:bg-[#423F3E] text-white"
                      >
                        Create First Announcement
                      </Button>
                    </td>
                  </tr>
                ) : (
                  announcements.map((announcement) => (
                    <tr key={announcement.id} className="hover:bg-[#362222]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white max-w-xs">
                          <div className="truncate" title={announcement.title}>
                            {announcement.title}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            By: {announcement.created_by}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300 max-w-sm">
                          <div className="line-clamp-2" title={announcement.content}>
                            {announcement.content}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium border ${getPriorityColor(announcement.priority)}`}>
                          {announcement.priority?.toUpperCase() || 'MEDIUM'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {announcement.link ? (
                          <a 
                            href={announcement.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {announcement.link_text || "Link"}
                          </a>
                        ) : (
                          <span className="text-gray-500 text-sm">No link</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {announcement.updated_at ? new Date(announcement.updated_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            onClick={() => handleEdit(announcement)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteConfirm(announcement)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Announcement Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#2B2B2B] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Add New College Announcement</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="title" className="block text-white font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={newAnnouncement.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-[#423F3E] border border-[#423F3E] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter announcement title"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="priority" className="block text-white font-medium mb-2">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={newAnnouncement.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-[#423F3E] border border-[#423F3E] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="content" className="block text-white font-medium mb-2">Content *</label>
                  <textarea
                    id="content"
                    name="content"
                    value={newAnnouncement.content}
                    onChange={handleInputChange}
                    rows="6"
                    className="w-full px-3 py-2 bg-[#423F3E] border border-[#423F3E] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter announcement content"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="link" className="block text-white font-medium mb-2">Link (Optional)</label>
                  <input
                    type="url"
                    id="link"
                    name="link"
                    value={newAnnouncement.link}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-[#423F3E] border border-[#423F3E] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="link_text" className="block text-white font-medium mb-2">Link Text (Optional)</label>
                  <input
                    type="text"
                    id="link_text"
                    name="link_text"
                    value={newAnnouncement.link_text}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-[#423F3E] border border-[#423F3E] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Click here to view"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-[#362222] hover:bg-[#423F3E] text-white"
                  >
                    Create College Announcement
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Announcement Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#2B2B2B] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Edit College Announcement</h2>
              
              <form onSubmit={handleEditSubmit}>
                <div className="mb-4">
                  <label htmlFor="editTitle" className="block text-white font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    id="editTitle"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#423F3E] border border-[#423F3E] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter announcement title"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="editPriority" className="block text-white font-medium mb-2">Priority</label>
                  <select
                    id="editPriority"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-[#423F3E] border border-[#423F3E] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="editContent" className="block text-white font-medium mb-2">Content *</label>
                  <textarea
                    id="editContent"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows="6"
                    className="w-full px-3 py-2 bg-[#423F3E] border border-[#423F3E] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Enter announcement content"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="editLink" className="block text-white font-medium mb-2">Link (Optional)</label>
                  <input
                    type="url"
                    id="editLink"
                    value={editLink}
                    onChange={(e) => setEditLink(e.target.value)}
                    className="w-full px-3 py-2 bg-[#423F3E] border border-[#423F3E] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="editLinkText" className="block text-white font-medium mb-2">Link Text (Optional)</label>
                  <input
                    type="text"
                    id="editLinkText"
                    value={editLinkText}
                    onChange={(e) => setEditLinkText(e.target.value)}
                    className="w-full px-3 py-2 bg-[#423F3E] border border-[#423F3E] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Click here to view"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Update College Announcement
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#2B2B2B] rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-4">Delete College Announcement</h2>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete "{announcementToDelete?.title}"? This action cannot be undone.
              </p>
              
              <div className="flex gap-4">
                <Button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
                <Button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default CollegeAnnouncementManagement;
