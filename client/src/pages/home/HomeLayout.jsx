import React from 'react';
import { Outlet } from 'react-router-dom';
import HomeNavbar from '../../components/navbar/HomeNavbar';
import Sidebar from '../../components/sidebar/Sidebar';

export default function HomeLayout() {
  return (
    <div className="home-layout">
      {/* Navbar para desktop */}
      <HomeNavbar />
      
      {/* Sidebar para móvil */}
      <Sidebar />
      
      <div className="home-content">
        <Outlet />
      </div>
    </div>
  );
}