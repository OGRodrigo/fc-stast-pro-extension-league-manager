export function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4">
      <div className="card w-full max-w-sm p-6">
        <p className="text-white text-center text-sm leading-relaxed mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-danger flex-1"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-primary flex-1"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="card w-full max-w-xl p-6 relative">

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
      </div>
    </div>
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

      <button
        type="submit"
        className="btn-primary"
        disabled={saving}
      >
        {saving ? "Guardando..." : label}
      </button>
    </div>
  );
}