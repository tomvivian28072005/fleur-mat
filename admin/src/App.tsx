import { Routes, Route, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ListePlantes from './pages/ListePlantes';
import EditerPlante from './pages/EditerPlante';
import ImprimerQR from './pages/ImprimerQR';
import ModalConfig from './components/ModalConfig';

export default function App() {
  const [configOk, setConfigOk] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const repo = localStorage.getItem('fleurmat_repo');
    const urlBase = localStorage.getItem('fleurmat_url_base');
    if (!repo || !urlBase) setShowConfig(true);
    else setConfigOk(true);
  }, []);

  function onConfigSauvee() {
    setShowConfig(false);
    setConfigOk(true);
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barre de navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
          <span className="font-bold text-vert text-lg flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className="text-vert">
              <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="2"/>
              <path d="M14 22 C14 22 7 17 7 11 A7 7 0 0 1 21 11 C21 17 14 22 14 22Z" stroke="currentColor" strokeWidth="2" fill="none"/>
              <circle cx="14" cy="11" r="2" fill="currentColor"/>
            </svg>
            FleurMat Admin
          </span>
          <nav className="flex gap-4 text-sm font-medium">
            <NavLink to="/" end className={({isActive}) => isActive ? 'text-vert border-b-2 border-vert pb-0.5' : 'text-gray-500 hover:text-vert'}>
              Catalogue
            </NavLink>
            <NavLink to="/reglages" className={({isActive}) => isActive ? 'text-vert border-b-2 border-vert pb-0.5' : 'text-gray-500 hover:text-vert'}>
              Réglages
            </NavLink>
          </nav>
          <div className="ml-auto">
            <button onClick={() => setShowConfig(true)} className="text-xs text-gray-400 hover:text-vert">
              ⚙ Config
            </button>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {configOk ? (
          <Routes>
            <Route path="/" element={<ListePlantes />} />
            <Route path="/plante/nouvelle" element={<EditerPlante />} />
            <Route path="/plante/:slug" element={<EditerPlante />} />
            <Route path="/imprimer" element={<ImprimerQR />} />
            <Route path="/reglages" element={<Reglages onEdit={() => setShowConfig(true)} />} />
          </Routes>
        ) : (
          <div className="text-center py-20 text-gray-400">Veuillez configurer l'application…</div>
        )}
      </main>

      {showConfig && <ModalConfig onSauvee={onConfigSauvee} />}
    </div>
  );
}

function Reglages({ onEdit }: { onEdit: () => void }) {
  const repo = localStorage.getItem('fleurmat_repo') ?? '(non défini)';
  const urlBase = localStorage.getItem('fleurmat_url_base') ?? '(non définie)';
  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6">Réglages</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Chemin du repo</div>
          <div className="font-mono text-sm bg-gray-50 rounded px-3 py-2 break-all">{repo}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">URL publique de base</div>
          <div className="font-mono text-sm bg-gray-50 rounded px-3 py-2 break-all">{urlBase}</div>
        </div>
        <button onClick={onEdit} className="btn-primaire">Modifier</button>
      </div>
    </div>
  );
}
