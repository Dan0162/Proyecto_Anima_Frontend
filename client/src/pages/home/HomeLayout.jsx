import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/navbar';

export default function HomeLayout() {
  return (
    <div className="home-layout">
      <Navbar />
      <div className="home-content">
        <Outlet />
      </div>
    </div>
  );
}
