import React from 'react';
import { connect } from 'react-redux';
import '../style/LoadingOverlay.css';

interface LoadingOverlayProps {
  isAuthInProgress?: boolean;
}

const mapStateToProps = (state: any) => ({
  isAuthInProgress: state.isAuthInProgress
});

const LoadingOverlay = ({ isAuthInProgress }: LoadingOverlayProps) => (
  <div className="LoadingOverlay" hidden={!isAuthInProgress}>
    <div>
      <svg viewBox="25 25 50 50">
        <circle cx="50" cy="50" r="20" />
      </svg>
    </div>
  </div>
);

export default connect(mapStateToProps)(LoadingOverlay);
