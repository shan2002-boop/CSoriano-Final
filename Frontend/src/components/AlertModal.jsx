// src/components/AlertModal.jsx
import React, { useEffect, useRef } from 'react';
import styles from '../css/AlertModal.module.css';

const AlertModal = ({ isOpen, onClose, title, message, type = "info" }) => {
  const modalRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      // Save the element that was focused before the modal was opened
      const previouslyFocusedElement = document.activeElement;
      
      // Focus the modal
      modalRef.current.focus();
      
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore focus to the previously focused element
        if (previouslyFocusedElement) previouslyFocusedElement.focus();
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine styles based on type
  const modalClass = `${styles.modalContent} ${styles[type]}`;

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      aria-describedby="alert-modal-message"
    >
      <div
        className={modalClass}
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        tabIndex="-1"
      >
        {title && <h3 id="alert-modal-title" className={styles.modalTitle}>{title}</h3>}
        {message && <p id="alert-modal-message" className={styles.modalMessage}>{message}</p>}
        <button onClick={onClose} className={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
};

export default AlertModal;
