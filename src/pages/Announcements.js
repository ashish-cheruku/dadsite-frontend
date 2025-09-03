import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { announcementService, collegeAnnouncementService } from '../services/api';
import { authService } from '../services/api';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [collegeAnnouncements, setCollegeAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collegeLoading, setCollegeLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collegeError, setCollegeError] = useState(null);
  const isPrincipal = authService.hasRole('principal');
  const isStaff = authService.hasRole('staff') || authService.hasRole('principal');

  useEffect(() => {
    // Fetch announcements when component mounts
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const data = await announcementService.getAllAnnouncements();
        setAnnouncements(data);
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError('Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };

    // Fetch college announcements if user is staff or principal
    const fetchCollegeAnnouncements = async () => {
      if (!isStaff) {
        setCollegeLoading(false);
        return;
      }

      try {
        setCollegeLoading(true);
        const data = await collegeAnnouncementService.getAllCollegeAnnouncements();
        setCollegeAnnouncements(data);
      } catch (err) {
        console.error('Error fetching college announcements:', err);
        setCollegeError('Failed to load college announcements');
      } finally {
        setCollegeLoading(false);
      }
    };

    fetchAnnouncements();
    fetchCollegeAnnouncements();
  }, [isStaff]);

  return (
    <div className="min-h-screen bg-[#171010]">
      <Navbar />
      
      <main className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Announcements</h1>
          {isPrincipal && (
            <div className="flex gap-3">
              <Link 
                to="/announcement-management" 
                className="px-4 py-2 bg-[#362222] text-white rounded-md hover:bg-[#423F3E]"
              >
                Manage Public Announcements
              </Link>
              <Link 
                to="/college-announcement-management" 
                className="px-4 py-2 bg-[#362222] text-white rounded-md hover:bg-[#423F3E]"
              >
                Manage College Announcements
              </Link>
            </div>
          )}
        </div>
        
        {/* General Announcements Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            General Announcements
          </h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg">
              {error}
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 bg-[#2B2B2B] rounded-lg border border-[#423F3E]">
              <p className="text-gray-300 text-xl">No general announcements available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {announcements.map((announcement) => (
                <div 
                  key={announcement.id} 
                  className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6"
                >
                  <h3 className="text-xl font-bold text-white mb-2">{announcement.title}</h3>
                  <p className="text-gray-300 mb-4 whitespace-pre-wrap">{announcement.content}</p>
                  
                  {announcement.link && (
                    <div className="mb-4 p-3 bg-[#362222] rounded-md border border-[#423F3E]">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <a 
                          href={announcement.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-400 hover:text-blue-300 font-medium"
                        >
                          {announcement.link_text || "Important Link"}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-gray-400 text-sm">
                    <span>Posted: {new Date(announcement.created_at).toLocaleDateString()}</span>
                    {announcement.updated_at && (
                      <span>Updated: {new Date(announcement.updated_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* College Announcements Section - Only visible to staff and principal */}
        {isStaff && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              College Announcements
              <span className="ml-2 px-2 py-1 text-xs bg-gray-700/50 text-gray-300 rounded-full border border-gray-600">
                Staff Only
              </span>
            </h2>
            
            {collegeLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-400"></div>
              </div>
            ) : collegeError ? (
              <div className="bg-red-900/30 border border-red-700 text-red-300 p-4 rounded-lg">
                {collegeError}
              </div>
            ) : collegeAnnouncements.length === 0 ? (
              <div className="text-center py-12 bg-[#2B2B2B] rounded-lg border border-[#423F3E]">
                <p className="text-gray-300 text-xl">No college announcements available</p>
              </div>
            ) : (
              <div className="space-y-6">
                {collegeAnnouncements.map((announcement) => (
                  <div 
                    key={announcement.id} 
                    className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 relative"
                  >
                    {/* Priority indicator */}
                    <div className={`absolute top-4 right-4 px-2 py-1 text-xs rounded-full font-medium ${
                      announcement.priority === 'high' 
                        ? 'bg-red-900/50 text-red-300 border border-red-700' 
                        : announcement.priority === 'low'
                        ? 'bg-gray-900/50 text-gray-300 border border-gray-700'
                        : 'bg-gray-800/50 text-gray-300 border border-gray-600'
                    }`}>
                      {announcement.priority?.toUpperCase() || 'MEDIUM'} PRIORITY
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2 pr-24">{announcement.title}</h3>
                    <p className="text-gray-300 mb-4 whitespace-pre-wrap">{announcement.content}</p>
                    
                    {announcement.link && (
                      <div className="mb-4 p-3 bg-[#362222] rounded-md border border-[#423F3E]">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <a 
                            href={announcement.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-400 hover:text-blue-300 font-medium"
                          >
                            {announcement.link_text || "Important Link"}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-gray-400 text-sm">
                      <div className="flex items-center gap-4">
                        <span>Posted: {new Date(announcement.created_at).toLocaleDateString()}</span>
                        <span className="text-gray-300">By: {announcement.created_by}</span>
                      </div>
                      {announcement.updated_at && (
                        <span>Updated: {new Date(announcement.updated_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Announcements; 