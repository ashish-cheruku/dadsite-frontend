import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { facultyService } from '../services/api';

const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setLoading(true);
        const data = await facultyService.getAllFaculty();
        setFaculty(data);
      } catch (err) {
        setError('Failed to fetch faculty data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#171010]">
      <Navbar />
      
      <main className="flex-grow">
        {/* Page header */}
        <div className="bg-[#2B2B2B] py-12 border-b border-[#423F3E]">
          <div className="max-w-screen-xl mx-auto px-4">
            <h1 className="text-4xl font-bold text-white text-center">Our Faculty</h1>
            <p className="text-gray-300 text-center mt-4 max-w-2xl mx-auto">
              Meet our dedicated team of educators who are committed to providing quality education and guidance to our students.
            </p>
          </div>
        </div>
        
        {/* Loading and Error States */}
        {loading ? (
          <div className="max-w-screen-xl mx-auto px-4 py-12 flex justify-center">
            <div className="text-2xl font-semibold animate-pulse text-white">Loading faculty information...</div>
          </div>
        ) : error ? (
          <div className="max-w-screen-xl mx-auto px-4 py-12">
            <div className="bg-red-900/30 border border-red-700 text-red-300 p-6 rounded-lg text-center">
              {error}
            </div>
          </div>
        ) : (
          <>
            {/* Faculty grid */}
            <div className="max-w-screen-xl mx-auto px-4 py-12">
              {faculty.length === 0 ? (
                <div className="text-center text-gray-300 py-8">
                  No faculty information available at this time.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {faculty.map((member) => (
                    <div key={member.id} className="bg-[#2B2B2B] rounded-lg shadow-md overflow-hidden border border-[#423F3E] transition-transform hover:scale-[1.02]">
                      <div className="p-4">
                        <div className="flex items-center mb-4">
                          <div className="h-16 w-16 rounded-full bg-[#362222] flex items-center justify-center text-2xl font-bold text-white mr-4">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-xl">{member.name}</h3>
                            <p className="text-gray-300">{member.position}</p>
                          </div>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-3">{member.department}</p>
                        
                        <div className="border-t border-[#423F3E] pt-3 space-y-1">
                          <p className="text-gray-300 text-sm flex items-start">
                            <svg className="h-4 w-4 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            {member.education}
                          </p>
                          <p className="text-gray-300 text-sm flex items-start">
                            <svg className="h-4 w-4 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {member.experience}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-[#2B2B2B] text-white py-8 border-t border-[#423F3E]">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <p className="mb-2 text-gray-300">Govt Junior College Vemulawada</p>
              <p className="mb-2 text-gray-300">Vemulawada, Rajanna Sircilla District</p>
              <p className="mb-2 text-gray-300">Telangana, India</p>
              <p className="text-gray-300">Email: info@gjcvemulawada.edu.in</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-300 hover:text-white">Home</a></li>
                <li><a href="/about" className="text-gray-300 hover:text-white">About Us</a></li>
                <li><a href="/faculty" className="text-gray-300 hover:text-white">Faculty</a></li>
                <li><a href="/contact" className="text-gray-300 hover:text-white">Contact Us</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Developer</h3>
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  This website was developed by Ashish K Cheruku
                </p>
                <Link 
                  to="/developer" 
                  className="inline-flex items-center px-4 py-2 bg-[#362222] text-white rounded-lg hover:bg-[#423F3E] transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Meet Developer
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-[#423F3E] mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Government Junior College Vemulawada. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Faculty; 