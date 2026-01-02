import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6">Profile</h1>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-8 max-w-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:space-x-6 mb-6 md:mb-8">
          <img
            src={user.photo}
            alt={user.displayName}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-blue-500 mb-4 sm:mb-0"
          />
          <div className="text-center sm:text-left">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">{user.displayName}</h2>
            <p className="text-sm md:text-base text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-b pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <p className="text-gray-900">{user.id}</p>
          </div>

          <div className="border-b pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <p className="text-gray-900">{user.displayName}</p>
          </div>

          <div className="border-b pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <p className="text-gray-900">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
