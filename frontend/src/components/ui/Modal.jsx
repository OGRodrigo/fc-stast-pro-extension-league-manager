import { motion } from "framer-motion";
import { modalContent, modalOverlay } from "../../utils/motionVariants";

export function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      variants={modalOverlay}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
    >
      <motion.div
        className="card w-full max-w-sm p-6"
        variants={modalContent}
      >
        <p className="text-white text-center text-sm leading-relaxed mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="btn-danger flex-1">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} className="btn-primary flex-1">
            Aceptar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Modal({ title, children, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      variants={modalOverlay}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ backgroundColor: "rgba(0,0,0,0.70)" }}
    >
      <motion.div
        className="card w-full max-w-xl p-6 relative"
        variants={modalContent}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function ModalActions({ onCancel, saving, label = "Guardar" }) {
  return (
    <div className="flex justify-end gap-3 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="btn-secondary"
        disabled={saving}
      >
        Cancelar
      </button>
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? "Guardando..." : label}
      </button>
    </div>
  );
}
