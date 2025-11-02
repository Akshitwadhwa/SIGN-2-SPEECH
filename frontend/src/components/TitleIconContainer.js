import React from 'react';
import PropTypes from 'prop-types';

const TitleIconContainer = ({ icon: Icon, colorClass, title }) => (
  <div className="flex items-center space-x-3 mb-6">
    <div className={`p-2 rounded-full ${colorClass} bg-opacity-20`}>
      <Icon className={`w-6 h-6 ${colorClass}`} />
    </div>
    <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
  </div>
);

TitleIconContainer.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
  colorClass: PropTypes.string,
  title: PropTypes.string,
};

TitleIconContainer.defaultProps = {
  colorClass: 'text-blue-600',
  title: '',
};

export default TitleIconContainer;
