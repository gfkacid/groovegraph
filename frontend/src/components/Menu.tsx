import React from 'react';
import { FaHome, FaMusic, FaChartBar } from 'react-icons/fa';
import { truncateWalletAddress } from '../utils/helpers';

const MenuItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <li className="flex items-center space-x-4 py-2 px-4 hover:bg-card-background rounded-lg cursor-pointer">
    {icon}
    <span>{text}</span>
  </li>
);

interface MenuProps {
  loggedIn: boolean;
  walletAddress: string;
  login: () => void;
  logout: () => void; // Add this line
}

function Menu({ loggedIn, walletAddress, login, logout }: MenuProps) { // Add logout here
  return (
    <div className="flex flex-col h-full py-8">
      <div className="mb-12">
        <img src="/src/assets/logo.svg" alt="Logo" className="w-32 mx-auto" />
      </div>
      <nav className="flex-grow">
        <ul className="space-y-4">
          <MenuItem icon={<FaHome className="text-xl" />} text="Explore" />
          <MenuItem icon={<FaMusic className="text-xl" />} text="My Profile" />
          <MenuItem icon={<FaChartBar className="text-xl" />} text="Bounties" />
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