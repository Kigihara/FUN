import React from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion'; // Убираем AnimatePresence
import './ConfirmModal.css';

function ConfirmModal({ isOpen, title, children, onConfirm, onCancel, confirmText = 'Подтвердить', cancelText = 'Отмена' }) {
  if (!isOpen) {
    return null;
  }

    return ReactDOM.createPortal(
        <motion.div
            className="confirm-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="confirm-modal-content"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
                <h3 className="confirm-modal-title">{title}</h3>
                <div className="confirm-modal-body">
                    {children}
                </div>
                <div className="confirm-modal-actions">
                    <button className="modal-btn cancel-btn" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className="modal-btn confirm-btn" onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
}

export default ConfirmModal;