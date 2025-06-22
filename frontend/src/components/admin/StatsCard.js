import React from 'react';
import { FaArrowUp } from 'react-icons/fa';

const StatsCard = ({ title, value, icon: IconComponent, color, trend }) => {
  return (
    <div className={`stats-card ${color}`}>
      <div className={`stats-icon ${color}`}>
        <IconComponent />
      </div>
      <div className="stats-content">
        <h3>{value}</h3>
        <p>{title}</p>
        {trend && (
          <div className="stats-trend">
            <FaArrowUp />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;