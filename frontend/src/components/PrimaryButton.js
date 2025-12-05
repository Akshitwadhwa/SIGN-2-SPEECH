import React from 'react';

const PrimaryButton = ({ children, onClick, icon: Icon, className = '', disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`btn-primary ${className}`}
  >
    {Icon && <Icon className="w-5 h-5" />}
    {children}
  </button>
);

export default PrimaryButton;
