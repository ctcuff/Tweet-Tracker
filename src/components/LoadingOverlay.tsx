import React from 'react';
import '../style/LoadingOverlay.css';

interface LoadingOverlayProps {
  show: boolean;
}

const LoadingOverlay = ({ show }: LoadingOverlayProps) => (
  <div className="LoadingOverlay" hidden={show}>
    <div>
      <svg viewBox="25 25 50 50">
        <circle cx="50" cy="50" r="20" />
      </svg>
    </div>
  </div>
);

export default LoadingOverlay;