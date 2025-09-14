import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { imageService } from '../services/api';

const Gallery = () => {
  // State for images and loading
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // State for modal
  const [selectedImage, setSelectedImage] = useState(null);

  // Available categories for filtering
  const categories = [
    { value: 'all', label: 'All Images' },
    { value: 'general', label: 'General' },
    { value: 'events', label: 'Events' },
    { value: 'facilities', label: 'Facilities' },
    { value: 'academic', label: 'Academic' },
    { value: 'sports', label: 'Sports' },
    { value: 'gallery', label: 'Gallery' }
  ];

  // Fetch images from API
  useEffect(() => {
    fetchGalleryImages();
  }, [selectedCategory]);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching gallery images for category:', selectedCategory);
      
      const response = await imageService.getGalleryImages(
        selectedCategory === 'all' ? null : selectedCategory,
        50
      );
      
      console.log('Gallery API response:', response);
      
      // Transform API response to match component expectations
      const transformedImages = response.images.map((img, index) => ({
        id: img.id || index + 1,
        src: img.url,
        alt: img.alt || `Campus Image ${index + 1}`,
        category: img.category,
        width: img.width,
        height: img.height
      }));
      
      setGalleryImages(transformedImages);
      console.log('Transformed gallery images:', transformedImages);
      
    } catch (err) {
      console.error('Error fetching gallery images:', err);
      setError('Failed to load gallery images');
      // Fallback to empty array
      setGalleryImages([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  // Handle navigation between images
  const navigateImages = (direction) => {
    if (!selectedImage) return;
    
    const currentIndex = galleryImages.findIndex(img => img.id === selectedImage.id);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % galleryImages.length;
    } else {
      newIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    }
    
    setSelectedImage(galleryImages[newIndex]);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#171010]">
      <Navbar />
      
      <main className="flex-grow">
        {/* Page header */}
        <div className="bg-[#2B2B2B] py-12 border-b border-[#423F3E]">
          <div className="max-w-screen-xl mx-auto px-4">
            <h1 className="text-4xl font-bold text-white text-center">Campus Gallery</h1>
            <p className="text-gray-300 text-center mt-4 max-w-2xl mx-auto">
              Explore our campus facilities and environment through this collection of images
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-[#423F3E] text-white'
                    : 'bg-[#2B2B2B] text-gray-300 hover:bg-[#362222]'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-screen-xl mx-auto px-4 py-4">
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-center">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchGalleryImages}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="max-w-screen-xl mx-auto px-4 py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="text-gray-300 mt-4">Loading gallery images...</p>
            </div>
          </div>
        )}
        
        {/* Gallery grid */}
        {!loading && (
          <div className="max-w-screen-xl mx-auto px-4 py-6">
            {galleryImages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📷</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Images Found</h3>
                <p className="text-gray-400">
                  {selectedCategory === 'all' 
                    ? 'No images have been uploaded yet.' 
                    : `No images found in the ${categories.find(c => c.value === selectedCategory)?.label} category.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {galleryImages.map((image) => (
              <div 
                key={image.id} 
                className="group relative rounded-lg overflow-hidden bg-[#2B2B2B] border border-[#423F3E] shadow-md cursor-pointer"
                onClick={() => openModal(image)}
              >
                <div className="h-64 overflow-hidden">
                  <img 
                    src={image.src} 
                    alt={image.alt} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>



                {/* Category badge - show when "All Images" is selected */}
                {selectedCategory === 'all' && image.category && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-[#423F3E] text-white text-xs px-2 py-1 rounded-full">
                      {categories.find(c => c.value === image.category)?.label || image.category}
                    </span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-[#2B2B2B] rounded-full p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
              </div>
            )}
          </div>
        )}
        
        {/* Image viewing features */}
        {!loading && galleryImages.length > 0 && (
          <div className="max-w-screen-xl mx-auto px-4 py-6 pb-12">
            <div className="bg-[#2B2B2B] rounded-lg shadow-md border border-[#423F3E] p-6 text-center">
              <h2 className="text-xl font-bold mb-4 text-white">GJC Vemulawada Campus</h2>
              <p className="text-gray-300 mb-6">
                Our campus provides an ideal environment for academic excellence and extracurricular activities.
                With modern facilities, laboratories, and recreational spaces, students experience a balanced educational journey.
              </p>
              <p className="text-gray-400 text-sm">
                Click on any image above to view it in full size • Showing {galleryImages.length} images
                {selectedCategory !== 'all' && ` in ${categories.find(c => c.value === selectedCategory)?.label} category`}
              </p>
            </div>
          </div>
        )}
        
        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4" onClick={closeModal}>
            <div 
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image container */}
              <div className="overflow-hidden bg-[#2B2B2B] rounded-lg border border-[#423F3E] shadow-xl">
                <img 
                  src={selectedImage.src} 
                  alt={selectedImage.alt}
                  className="max-h-[80vh] w-auto object-contain"
                />
              </div>
              
              {/* Controls */}
              <div className="absolute top-1/2 w-full flex justify-between items-center px-2 transform -translate-y-1/2">
                <button 
                  onClick={() => navigateImages('prev')}
                  className="bg-[#2B2B2B] rounded-full p-2 text-white hover:bg-[#423F3E] focus:outline-none"
                >
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button 
                  onClick={() => navigateImages('next')}
                  className="bg-[#2B2B2B] rounded-full p-2 text-white hover:bg-[#423F3E] focus:outline-none"
                >
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Close button */}
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 md:top-6 md:right-6 bg-[#2B2B2B] rounded-full p-2 text-white hover:bg-[#423F3E] focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Image counter */}
              <div className="absolute bottom-4 left-0 right-0 text-center text-white">
                <span className="bg-[#2B2B2B] px-4 py-2 rounded-full text-sm">
                  {galleryImages.findIndex(img => img.id === selectedImage.id) + 1} / {galleryImages.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
      
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

export default Gallery; 