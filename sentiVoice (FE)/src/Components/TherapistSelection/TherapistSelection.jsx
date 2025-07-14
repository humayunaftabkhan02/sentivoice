import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaStar, 
  FaClock, 
  FaGraduationCap,
  FaCertificate,
  FaLanguage,
  FaUserMd,
  FaTimes,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronDown,
  FaChevronUp,
  FaCheck
} from 'react-icons/fa';
import { api } from '../../utils/api';

const TherapistSelection = ({ 
  therapistList, 
  selectedTherapist, 
  onTherapistSelect, 
  onAvailabilityUpdate 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showTherapistList, setShowTherapistList] = useState(false);
  const [selectedTherapistDetails, setSelectedTherapistDetails] = useState(null);
  const [profilePictures, setProfilePictures] = useState({});

  // Get unique specializations and experience levels
  const specializations = [...new Set(therapistList.map(t => t.info?.specialization).filter(Boolean))];
  const experienceLevels = [...new Set(therapistList.map(t => t.info?.experience).filter(Boolean))];

  // Filter and sort therapists
  const filteredTherapists = therapistList
    .filter(therapist => {
      const matchesSearch = 
        therapist.info?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapist.info?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapist.info?.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapist.info?.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapist.username.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSpecialization = !selectedSpecialization || 
        therapist.info?.specialization === selectedSpecialization;

      const matchesExperience = !selectedExperience || 
        therapist.info?.experience === selectedExperience;

      return matchesSearch && matchesSpecialization && matchesExperience;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = `${a.info?.firstName || ''} ${a.info?.lastName || ''}`.toLowerCase();
          bValue = `${b.info?.firstName || ''} ${b.info?.lastName || ''}`.toLowerCase();
          break;
        case 'experience':
          aValue = parseInt(a.info?.experience) || 0;
          bValue = parseInt(b.info?.experience) || 0;
          break;
        case 'specialization':
          aValue = a.info?.specialization?.toLowerCase() || '';
          bValue = b.info?.specialization?.toLowerCase() || '';
          break;
        default:
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleTherapistSelect = (therapist) => {
    setSelectedTherapistDetails(therapist);
    onTherapistSelect(therapist.username);
    setShowTherapistList(false); // Close the list after selection
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="text-gray-400" />;
    return sortOrder === 'asc' ? <FaSortUp className="text-blue-600" /> : <FaSortDown className="text-blue-600" />;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSpecialization('');
    setSelectedExperience('');
    setSortBy('name');
    setSortOrder('asc');
  };

  // Get selected therapist details
  const selectedTherapistData = therapistList.find(t => t.username === selectedTherapist);

  // Load profile pictures when therapist list changes
  useEffect(() => {
    const loadAllProfilePictures = async () => {
      const newProfilePictures = {};
      
      for (const therapist of therapistList) {
        const imageData = await loadProfilePicture(therapist);
        if (imageData) {
          newProfilePictures[therapist.username] = imageData;
        }
      }
      
      setProfilePictures(newProfilePictures);
    };

    if (therapistList.length > 0) {
      loadAllProfilePictures();
    }
  }, [therapistList]);


  // Helper function to load profile picture from API
  const loadProfilePicture = async (therapist) => {
    if (therapist.info?.profilePicture) {
      // If it's already base64 data
      if (therapist.info.profilePicture.startsWith('data:image')) {
        return therapist.info.profilePicture;
      }
      
      // If it's a file path or filename, fetch from API
      let filename;
      if (therapist.info.profilePicture.startsWith('/uploads/')) {
        filename = therapist.info.profilePicture.split('/').pop();
      } else if (therapist.info.profilePicture.includes('profile-')) {
        filename = therapist.info.profilePicture;
      }
      
      if (filename) {
        try {
          const response = await api.get(`/api/uploads/profile-pictures/${filename}`);
          if (response.image) {
            return response.image;
          }
        } catch (error) {
          console.error('Error loading profile picture:', error);
        }
      }
    }
    return null;
  };

  // Helper function to get profile picture (for display)
  const getProfilePicture = (therapist) => {
    const therapistId = therapist.username;
    return profilePictures[therapistId] || null;
  };

  return (
    <div className="space-y-4">
      {/* Selected Therapist Display */}
      {selectedTherapistData ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getProfilePicture(selectedTherapistData) ? (
                <img 
                  src={getProfilePicture(selectedTherapistData)} 
                  alt={`Dr. ${selectedTherapistData.info?.firstName} ${selectedTherapistData.info?.lastName}`}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center ${getProfilePicture(selectedTherapistData) ? 'hidden' : ''}`}
                style={{ display: getProfilePicture(selectedTherapistData) ? 'none' : 'flex' }}
              >
                <FaUserMd className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Dr. {selectedTherapistData.info?.firstName} {selectedTherapistData.info?.lastName}
                </h3>
                <p className="text-sm text-blue-600">
                  {selectedTherapistData.info?.specialization || 'General Therapy'}
                  {selectedTherapistData.info?.experience && ` • ${selectedTherapistData.info.experience} years experience`}
                </p>
              </div>
            </div>
            <button
              onClick={() => onTherapistSelect('')}
              className="text-red-600 hover:text-red-700 p-1"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FaUserMd className="text-4xl mx-auto mb-2 text-gray-300" />
          <p>No therapist selected</p>
        </div>
      )}

      {/* Browse Therapists Button */}
      <button
        onClick={() => setShowTherapistList(!showTherapistList)}
        className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <FaUserMd />
        <span>{selectedTherapist ? 'Change Therapist' : 'Browse Therapists'}</span>
        {showTherapistList ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      {/* Therapist Selection Modal */}
      {showTherapistList && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50/80 to-indigo-100/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Select Your Therapist</h2>
                <button
                  onClick={() => setShowTherapistList(false)}
                  className="text-white hover:text-gray-200 p-1"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Search and Filter Bar */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search therapists by name, specialization, or keywords..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FaFilter className="mr-2" />
                    Filters
                  </button>

                  {/* Clear Filters */}
                  {(searchTerm || selectedSpecialization || selectedExperience) && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FaTimes className="mr-2" />
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter Options */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                      <select
                        value={selectedSpecialization}
                        onChange={(e) => setSelectedSpecialization(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Specializations</option>
                        {specializations.map(spec => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                      <select
                        value={selectedExperience}
                        onChange={(e) => setSelectedExperience(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Experience Levels</option>
                        {experienceLevels.map(exp => (
                          <option key={exp} value={exp}>{exp} years</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Name {getSortIcon('name')}
                        </button>
                        <button
                          onClick={() => handleSort('experience')}
                          className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Experience {getSortIcon('experience')}
                        </button>
                        <button
                          onClick={() => handleSort('specialization')}
                          className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Specialization {getSortIcon('specialization')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-600 mb-4">
                {filteredTherapists.length} therapist{filteredTherapists.length !== 1 ? 's' : ''} found
              </div>

              {/* Therapist Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTherapists.map((therapist) => (
                  <div
                    key={therapist.username}
                    onClick={() => handleTherapistSelect(therapist)}
                    className={`bg-white rounded-xl shadow-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedTherapist === therapist.username
                        ? 'border-blue-500 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {/* Therapist Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getProfilePicture(therapist) ? (
                              <img 
                                src={getProfilePicture(therapist)} 
                                alt={`Dr. ${therapist.info?.firstName} ${therapist.info?.lastName}`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center ${getProfilePicture(therapist) ? 'hidden' : ''}`}
                              style={{ display: getProfilePicture(therapist) ? 'none' : 'flex' }}
                            >
                              <FaUserMd className="text-white text-lg" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                Dr. {therapist.info?.firstName} {therapist.info?.lastName}
                              </h3>
                              <p className="text-sm text-blue-600 font-medium">
                                {therapist.info?.specialization || 'General Therapy'}
                              </p>
                            </div>
                          </div>
                        </div>
                        {selectedTherapist === therapist.username && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <FaCheck className="text-white text-xs" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Therapist Details */}
                    <div className="p-6 space-y-4">
                      {/* Experience and Education */}
                      <div className="space-y-2">
                        {therapist.info?.experience && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FaStar className="mr-2 text-yellow-500" />
                            <span><strong>Experience:</strong> {therapist.info.experience} years</span>
                          </div>
                        )}
                        {therapist.info?.education && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FaGraduationCap className="mr-2 text-blue-500" />
                            <span><strong>Education:</strong> {therapist.info.education}</span>
                          </div>
                        )}
                        {therapist.info?.certifications && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FaCertificate className="mr-2 text-green-500" />
                            <span><strong>Certifications:</strong> {therapist.info.certifications}</span>
                          </div>
                        )}
                      </div>

                      {/* Languages */}
                      {therapist.info?.languages && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FaLanguage className="mr-2 text-purple-500" />
                          <span><strong>Languages:</strong> {therapist.info.languages}</span>
                        </div>
                      )}

                      {/* Bio Preview */}
                      {therapist.info?.bio && (
                        <div className="text-sm text-gray-600">
                          <div className="font-medium text-gray-700 mb-1"><strong>About:</strong></div>
                          <div className="line-clamp-3">
                            {therapist.info.bio}
                          </div>
                        </div>
                      )}

                      {/* In-Person and Online Availability */}
                      {(therapist.info?.availability?.inPerson?.length > 0 || therapist.info?.availability?.online?.length > 0) && (
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <FaClock className="mr-2 text-green-500" />
                            <span className="font-medium"><strong>Availability:</strong></span>
                          </div>
                          {therapist.info?.availability?.inPerson?.length > 0 && (
                            <div className="mb-1">
                              <span className="text-xs font-semibold text-blue-700">In-Person:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {therapist.info.availability.inPerson.map((slot, idx) => (
                                  <span key={idx} className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                    {slot.day}: {slot.start} - {slot.end}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {therapist.info?.availability?.online?.length > 0 && (
                            <div>
                              <span className="text-xs font-semibold text-purple-700">Online:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {therapist.info.availability.online.map((slot, idx) => (
                                  <span key={idx} className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                    {slot.day}: {slot.start} - {slot.end}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Select Button */}
                    <div className="p-6 pt-0">
                      <button
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          selectedTherapist === therapist.username
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        {selectedTherapist === therapist.username ? 'Selected' : 'Select Therapist'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* No Results */}
              {filteredTherapists.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No therapists found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistSelection; 