interface Props {
  message: string;
  onConfirmer: () => void;
  onAnnuler: () => void;
}

export default function ModalConfirm({ message, onConfirmer, onAnnuler }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onAnnuler} className="btn-secondaire">Annuler</button>
          <button onClick={onConfirmer} className="bg-red-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
