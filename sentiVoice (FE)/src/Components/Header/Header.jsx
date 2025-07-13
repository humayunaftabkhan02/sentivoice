import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import Logo from '../../assets/logo.png';
import LogoutIcon from '../LogOutIcon/LogOutIcon';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    setUsername(localStorage.getItem('username'));
    setUserRole(localStorage.getItem('role'));
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  // choose dashboard per role
  const dashboardLink =
    userRole === 'therapist'
      ? '/therapist-dashboard'
      : userRole === 'admin'
      ? '/admin-dashboard'       // ✅ NEW
      : '/patient-dashboard';

  return (
    <header className="bg-[#EBEDE9] px-8 md:px-24 py-4 flex items-center justify-between relative">
      <div className="flex items-center">
        <img src={Logo} alt="Logo" className="h-20 w-auto" />
      </div>

      <nav
        className={`flex-col md:flex-row md:flex ${
          isOpen ? 'flex' : 'hidden'
        } md:space-x-8 text-gray-900 absolute md:static top-full left-0 w-full md:w-auto bg-[#EBEDE9] md:bg-transparent`}
      >
        <ul className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8 text-gray-900 p-4 md:p-0 mx-auto">
          <li><NavLink to="/"          className="hover:text-gray-600">Home</NavLink></li>
          <li><NavLink to="/about"     className="hover:text-gray-600">About</NavLink></li>
          <li><NavLink to="/therapists"className="hover:text-gray-600">Therapists</NavLink></li>
          <li><NavLink to="/services"  className="hover:text-gray-600">Services</NavLink></li>
          <li><NavLink to="/contact"   className="hover:text-gray-600">Contact</NavLink></li>

          {username && (
            <li>
              <NavLink to={dashboardLink} className="hover:text-gray-600">
                Dashboard
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      <div className="flex items-center space-x-4">
        {!username ? (
          <>
            <Link to="/login"  className="text-gray-900 font-semibold hover:text-gray-600">Login</Link>
            <Link to="/signup" className="bg-teal-700 text-white px-4 py-2 rounded font-semibold hover:bg-teal-800">Signup</Link>
          </>
        ) : (
          <LogoutIcon className="text-black" />
        )}

        <button onClick={toggleMenu} className="text-gray-900 md:hidden">
          {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </div>
    </header>
  );
};

export default Header;