import { useState } from 'react';

interface Props {
  onSauvee: () => void;
}

export default function ModalConfig({ onSauvee }: Props) {
  const [repo, setRepo] = useState(localStorage.getItem('fleurmat_repo') ?? '');
  const [urlBase, setUrlBase] = useState(localStorage.getItem('fleurmat_url_base') ?? '');
  const [erreur, setErreur] = useState('');

  function sauvegarder() {
    if (!repo.trim()) { setErreur('Le chemin du repo est obligatoire.'); return; }
    if (!urlBase.trim()) { setErreur('L\'URL publique est obligatoire.'); return; }
    localStorage.setItem('fleurmat_repo', repo.trim());
    localStorage.setItem('fleurmat_url_base', urlBase.trim());
    onSauvee();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-1">Configuration initiale</h2>
        <p className="text-sm text-gray-500 mb-5">Ces réglages sont stockés localement dans votre navigateur.</p>

        <label className="block mb-4">
          <span className="label">Chemin absolu vers la racine du repo cloné</span>
          <input
            type="text"
            className="input mt-1"
            value={repo}
            onChange={e => setRepo(e.target.value)}
            placeholder="ex: C:\Users\prenom\Documents\fleur-mat"
          />
          <span className="text-xs text-gray-400 mt-1 block">Dossier contenant <code>data/plantes.json</code></span>
        </label>

        <label className="block mb-5">
          <span className="label">URL publique de base (GitHub Pages)</span>
          <input
            type="url"
            className="input mt-1"
            value={urlBase}
            onChange={e => setUrlBase(e.target.value)}
            placeholder="ex: https://username.github.io/fleur-mat"
          />
          <span className="text-xs text-gray-400 mt-1 block">Utilisée pour générer les QR codes.</span>
        </label>

        {erreur && <p className="text-red-500 text-sm mb-4">{erreur}</p>}

        <button onClick={sauvegarder} className="btn-primaire w-full">
          Enregistrer la configuration
        </button>
      </div>
    </div>
  );
}
