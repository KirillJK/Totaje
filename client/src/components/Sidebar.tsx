import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    <aside
      className={`${
        isOpen ? 'w-64' : 'w-0'
      } bg-gradient-to-br from-blue-400 to-purple-500 text-white transition-all duration-300 overflow-hidden fixed md:relative h-full z-50`}
    >
      <div className="p-4">
        <Link to="/dashboard" className="flex items-center gap-3 mb-8 hover:opacity-80 transition-opacity">
          <img src={logo} alt="Logo" className="w-12 h-12" />
          <h2 className="text-2xl font-bold">Totaje</h2>
        </Link>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                to="/dashboard"
                className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/profile"
                className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Profile
              </Link>
            </li>
            <li>
              <Link
                to="/todos"
                className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Todo List
              </Link>
            </li>
            <li>
              <Link
                to="/videos"
                className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Videos
              </Link>
            </li>
            <li>
              <Link
                to="/queue"
                className="block py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Audio Queue
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
