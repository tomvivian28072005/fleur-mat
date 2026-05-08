import { useEffect, useState } from 'react';

interface Props {
  onSauvee: () => void;
}

interface Detection {
  repoPrincipal: string;
  urlBase: string;
}

export default function ModalConfig({ onSauvee }: Props) {
  const [repo, setRepo] = useState(localStorage.getItem('fleurmat_repo') ?? '');
  const [urlBase, setUrlBase] = useState(localStorage.getItem('fleurmat_url_base') ?? '');
  const [erreur, setErreur] = useState('');
  const [detection, setDetection] = useState<'idle' | 'chargement' | 'ok' | 'erreur'>('idle');

  // Détection automatique au premier chargement si les champs sont vides
  useEffect(() => {
    if (!repo && !urlBase) detecter();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function detecter() {
    setDetection('chargement');
    try {
      const res = await fetch('/api/detect');
      if (!res.ok) throw new Error();
      const data: Detection = await res.json();
      if (data.repoPrincipal) setRepo(data.repoPrincipal);
      if (data.urlBase) setUrlBase(data.urlBase);
      setDetection('ok');
    } catch {
      setDetection('erreur');
    }
  }

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
        <h2 className="text-lg font-bold mb-1">Configuration</h2>
        <p className="text-sm text-gray-500 mb-4">Ces réglages sont stockés localement dans votre navigateur.</p>

        {/* Détection automatique */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex-1 text-sm">
            {detection === 'chargement' && <span className="text-gray-400">Détection en cours…</span>}
            {detection === 'ok' && <span className="text-vert font-medium">✓ Champs remplis automatiquement</span>}
            {detection === 'erreur' && <span className="text-red-500">Détection échouée, remplissez manuellement</span>}
            {detection === 'idle' && <span className="text-gray-500">Remplir depuis le projet détecté</span>}
          </div>
          <button
            onClick={detecter}
            disabled={detection === 'chargement'}
            className="btn-secondaire text-xs py-1.5 px-3 whitespace-nowrap flex items-center gap-1"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 6.5A4.5 4.5 0 1 1 6.5 2" strokeLinecap="round"/><path d="M8 2h3v3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {detection === 'chargement' ? 'Détection…' : 'Détecter'}
          </button>
        </div>

        <label className="block mb-4">
          <span className="label">Chemin vers la racine du repo cloné</span>
          <input
            type="text"
            className="input mt-1 font-mono text-sm"
            value={repo}
            onChange={e => setRepo(e.target.value)}
            placeholder="ex: C:\Users\prenom\Documents\fleur-mat"
          />
          <span className="text-xs text-gray-400 mt-1 block">Dossier contenant <code>data/plantes.json</code></span>
        </label>

        <label className="block mb-5">
          <span className="label">URL publique GitHub Pages</span>
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
          Enregistrer
        </button>
      </div>
    </div>
  );
}
