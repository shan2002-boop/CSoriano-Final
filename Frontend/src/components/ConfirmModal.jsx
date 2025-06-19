import React from 'react';
import styles from '../css/ConfirmModal.module.css';

const ConfirmModal = ({ show, onConfirm, onCancel, user }) => {
    if (!show || !user) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h2>Confirm Reset Password</h2>
                <p>Are you sure you want to reset the password for <strong>{user.Username}</strong>?</p>
                <div className={styles.buttonContainer}>
                    <button className={styles.confirmButton} onClick={onConfirm}>Yes, reset</button>
                    <button className={styles.cancelButton} onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
