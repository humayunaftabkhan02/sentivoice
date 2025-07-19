import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaUser, FaSignOutAlt } from 'react-icons/fa';
import Logo from '../../assets/logo.png';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setUsername(localStorage.getItem('username'));
    setUserRole(localStorage.getItem('role'));

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    // Remove user data from localStorage
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('fullName');
    // Also clear remembered credentials
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');
    localStorage.removeItem('rememberMe');
    // Redirect to homepage or login page
    navigate('/');
  };

  // choose dashboard per role
  const dashboardLink =
    userRole === 'therapist'
      ? '/therapist-dashboard'
      : userRole === 'admin'
      ? '/admin-dashboard'
      : '/patient-dashboard';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
        : 'bg-white/90 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/home" className="flex items-center space-x-3">
              <img src={Logo} alt="SentiVoice Logo" className="h-12 w-auto" />
              <span className="text-xl font-bold text-gray-900 hidden sm:block">SentiVoice</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <NavLink 
              to="/home" 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink 
              to="/about" 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`
              }
            >
              About
            </NavLink>
            <NavLink 
              to="/therapists" 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`
              }
            >
              Therapists
            </NavLink>
            <NavLink 
              to="/services" 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`
              }
            >
              Services
            </NavLink>
            <NavLink 
              to="/contact" 
              className={({ isActive }) => 
                `text-sm font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`
              }
            >
              Contact
            </NavLink>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {!username ? (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-700 font-medium hover:text-blue-600 transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to={dashboardLink} 
                  className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-lg font-medium hover:bg-blue-100 transition-all duration-200 border border-blue-200"
                >
                  <FaUser className="text-sm" />
                  <span>Dashboard</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-all duration-200 border border-red-200"
                >
                  <FaSignOutAlt className="text-sm" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button 
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 p-2"
            >
              {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}>
          <div className="py-4 space-y-4 border-t border-gray-100">
            <NavLink 
              to="/home" 
              className={({ isActive }) => 
                `block text-base font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              Home
            </NavLink>
            <NavLink 
              to="/about" 
              className={({ isActive }) => 
                `block text-base font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              About
            </NavLink>
            <NavLink 
              to="/therapists" 
              className={({ isActive }) => 
                `block text-base font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              Therapists
            </NavLink>
            <NavLink 
              to="/services" 
              className={({ isActive }) => 
                `block text-base font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              Services
            </NavLink>
            <NavLink 
              to="/contact" 
              className={({ isActive }) => 
                `block text-base font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              Contact
            </NavLink>
            
            {!username ? (
              <div className="pt-4 space-y-3 border-t border-gray-100">
                <Link 
                  to="/login" 
                  className="block text-base font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  className="block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="pt-4 space-y-3 border-t border-gray-100">
                <Link 
                  to={dashboardLink} 
                  className="flex items-center space-x-2 text-base font-medium text-blue-700 hover:text-blue-800 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <FaUser className="text-sm" />
                  <span>Dashboard</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-base font-medium text-red-600 hover:text-red-700 transition-colors duration-200"
                >
                  <FaSignOutAlt className="text-sm" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;