import React from 'react';
import styles from '../css/ConfirmDeleteTemplate.module.css'; 

const ConfirmDeleteTemplate = ({ show, onConfirm, onCancel, itemName }) => {
  if (!show) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete the template "{itemName}"?</p>
        <div className={styles.buttonContainer}>
          <button onClick={onConfirm} className={styles.deleteButton}>
            Delete
          </button>
          <button onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteTemplate;
