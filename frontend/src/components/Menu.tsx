import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { truncateWalletAddress } from '../utils/helpers';


interface MenuProps {
  loggedIn: boolean;
  walletAddress: string;
  login: () => void;
  logout: () => void;
}

function Menu({ loggedIn, walletAddress, login, logout }: MenuProps) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full py-8">
      <div className="mb-12">
        <img src="/src/assets/logo.svg" alt="Logo" className="w-32 mx-auto" />
      </div>
      <nav className="flex-grow">
        <ul className="space-y-4">
        <li>
          <Link 
            to="/explore" 
            className={`flex items-center py-2 px-4 rounded ${location.pathname === '/explore' ? 'bg-primary text-white' : 'hover:bg-gray-200'}`}
          >
            <img src="/src/assets/layout-grid.svg" alt="" className="w-5 h-5 mr-2" />
            <span>Explore</span>
          </Link>
        </li>
        <li>
          <Link 
            to="/profile" 
            className={`flex items-center  py-2 px-4 rounded ${location.pathname === '/profile' ? 'bg-primary text-white' : 'hover:bg-gray-200'}`}
          >
            <img src="/src/assets/user-music.svg" alt="My Profile" className="w-5 h-5 mr-2" />
            My Profile
          </Link>
        </li>
      </ul>
      </nav>
      <div className="mt-auto">
        {loggedIn ? (
          <div className="flex items-center justify-between w-full py-2 px-4 bg-card-background text-primary rounded-lg">
          <span>{truncateWalletAddress(walletAddress)}</span>
          <button onClick={logout} className="ml-2 p-1 hover:bg-opacity-80 transition-colors">
            <img src="/src/assets/log-out.svg" alt="Sign out" className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button onClick={login} className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors">
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}

export default Menu;