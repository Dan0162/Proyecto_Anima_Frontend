import React from 'react';
import { Outlet } from 'react-router-dom';

export default function HomeLayout() {
  return (
    <div className="home-layout">
      <div className="home-content">
        <Outlet />
      </div>
    </div>
  );
}