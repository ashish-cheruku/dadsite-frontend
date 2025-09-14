import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { imageService } from '../services/api';
import { Button } from '../components/ui/button';
import Navbar from '../components/Navbar';

const ImageManagement = () => {
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [deletedImages, setDeletedImages] = useState(new Set()); // Track deleted images
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchImages();
  }, [selectedCategory]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesResponse, imagesResponse] = await Promise.all([
        imageService.getCategories(),
        imageService.getAllImages()
      ]);
      
      setCategories(categoriesResponse.categories || []);
      setImages(imagesResponse.images || []);
    } catch (err) {
      setError('Failed to load data: ' + (err.detail || err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      console.log('Fetching images for category:', selectedCategory || 'all');
      
      // Add a small delay to ensure backend has processed the delete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await imageService.getAllImages(selectedCategory || null);
      console.log('Fetched images response:', response);
      
      // Filter out any images that have been deleted (to handle caching issues)
      const filteredImages = (response.images || []).filter(img => !deletedImages.has(img.public_id));
      
      setImages(filteredImages);
      console.log('Updated images state with', filteredImages.length, 'images (filtered out', (response.images || []).length - filteredImages.length, 'deleted images)');
    } catch (err) {
      console.error('Error fetching images:', err);
      setError('Failed to load images: ' + (err.detail || err.message || 'Unknown error'));
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setError('');
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');
      
      const response = await imageService.uploadImage(
        selectedFile,
        uploadCategory,
        description || null
      );
      
      setSuccess('Image uploaded successfully!');
      setSelectedFile(null);
      setDescription('');
      setPreviewUrl('');
      
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
      
      // Refresh images list
      await fetchImages();
      
    } catch (err) {
      setError('Failed to upload image: ' + (err.detail || err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (publicId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      console.log('Deleting image with publicId:', publicId);
      
      // Clear any previous messages
      setError('');
      setSuccess('');
      
      const result = await imageService.deleteImage(publicId);
      console.log('Delete result:', result);
      
      setSuccess('Image deleted successfully!');
      
      // Add to deleted images set to prevent it from showing again
      setDeletedImages(prev => new Set([...prev, publicId]));
      
      // IMMEDIATE UI UPDATE: Remove the image from the current state
      // This provides instant feedback while we wait for the backend
      setImages(prevImages => prevImages.filter(img => img.public_id !== publicId));
      console.log('Immediately removed image from UI and added to deleted set');
      
      // Force refresh the images list after a longer delay to handle Cloudinary caching
      console.log('Scheduling image list refresh...');
      setTimeout(async () => {
        console.log('Refreshing image list after delay...');
        const refreshResult = await fetchImages();
        
        // If the refresh still shows the deleted image, filter it out again
        // This handles persistent Cloudinary caching issues
        setTimeout(() => {
          setImages(prevImages => {
            const filteredImages = prevImages.filter(img => img.public_id !== publicId);
            if (filteredImages.length !== prevImages.length) {
              console.log('Removed persistent cached image from UI after refresh');
            }
            return filteredImages;
          });
        }, 100);
      }, 2000); // 2 second delay to allow Cloudinary to update
      
      // Also clear success message after a delay
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete image: ' + (err.detail || err.message || 'Unknown error'));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 pb-4 border-b border-[#423F3E]">
            <h1 className="text-3xl font-bold text-white">Image Management</h1>
            <p className="mt-2 text-gray-300">
              Upload and manage images for the college website
            </p>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-500 rounded-lg">
              <p className="text-green-400">{success}</p>
            </div>
          )}

          {/* Upload Section */}
          <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-white">Upload New Image</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Upload Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Image
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full p-3 bg-[#362222] border border-[#423F3E] rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#423F3E] file:text-white hover:file:bg-[#4A4747]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Supported formats: JPG, PNG, GIF, WebP. Max size: 10MB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full p-3 bg-[#362222] border border-[#423F3E] rounded-lg text-white"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter a description for this image..."
                    rows={3}
                    className="w-full p-3 bg-[#362222] border border-[#423F3E] rounded-lg text-white placeholder-gray-400 resize-none"
                  />
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="w-full bg-[#423F3E] hover:bg-[#4A4747] text-white disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </Button>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preview
                </label>
                <div className="bg-[#362222] border border-[#423F3E] rounded-lg p-4 h-64 flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <p>No image selected</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Images Gallery */}
          <div className="bg-[#2B2B2B] rounded-2xl shadow-xl border border-[#423F3E] p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white mb-4 md:mb-0">
                Uploaded Images ({images.length})
              </h2>
              
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-300">
                  Filter by Category:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-2 bg-[#362222] border border-[#423F3E] rounded-lg text-white text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {images.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📷</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Images Found</h3>
                <p className="text-gray-400">
                  {selectedCategory ? 'No images in this category.' : 'Upload your first image to get started.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image) => (
                  <div key={image.public_id} className="bg-[#362222] rounded-lg overflow-hidden border border-[#423F3E]">
                    <div className="aspect-video bg-gray-800 flex items-center justify-center">
                      <img
                        src={image.url}
                        alt={`Image ${image.public_id}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs bg-[#423F3E] text-white px-2 py-1 rounded">
                          {image.format?.toUpperCase() || 'IMG'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {image.width && image.height ? `${image.width}×${image.height}` : ''}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-2 truncate">
                        ID: {image.public_id}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                        <span>{image.bytes ? formatFileSize(image.bytes) : ''}</span>
                        <span>{image.created_at ? formatDate(image.created_at) : ''}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => window.open(image.url, '_blank')}
                          className="flex-1 bg-[#423F3E] hover:bg-[#4A4747] text-white text-xs py-2"
                        >
                          View
                        </Button>
                        <Button
                          onClick={() => handleDelete(image.public_id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-2"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ImageManagement;
