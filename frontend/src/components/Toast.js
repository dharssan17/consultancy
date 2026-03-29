import React, { useEffect } from 'react';
import { Alert } from 'react-bootstrap';

const Toast = ({ show, message, variant, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        minWidth: '300px',
      }}
    >
      <Alert
        variant={variant}
        onClose={onClose}
        dismissible
        className="shadow"
      >
        {message}
      </Alert>
    </div>
  );
};

export default Toast;

