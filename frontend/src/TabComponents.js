import React from 'react';

// Simple Tab Components for the DVote application
export const Tabs = ({ children }) => {
  return <div className="tabs-container">{children}</div>;
};

export const TabList = ({ children }) => {
  return <div className="tab-list">{children}</div>;
};

export const Tab = ({ children, isActive, onClick }) => {
  return (
    <button 
      className={`tab ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const TabPanel = ({ children, isActive }) => {
  if (!isActive) return null;
  return <div className="tab-panel">{children}</div>;
};

export default { Tabs, TabList, Tab, TabPanel };