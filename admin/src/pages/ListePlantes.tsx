import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { listerPlantes, supprimerPlante } from '../lib/api';
import type { Plante } from '../lib/types';
import ModalConfirm from '../components/ModalConfirm';

type Colonne = 'nomCommun' | 'type' | 'prix';
type Tri = { col: Colonne; asc: boolean };

export default function ListePlantes() {
  const navigate = useNavigate();
  const [plantes, setPlantes] = useState<Plante[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');
  const [tri, setTri] = useState<Tri>({ col: 'nomCommun', asc: true });
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [aSupprimer, setASupprimer] = useState<string | null>(null);

  async function charger() {
    try {
      setChargement(true);
      setErreur('');
      const data = await listerPlantes();
      setPlantes(data);
    } catch (e) {
      setErreur(String(e));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, []);

  const plantesFiltrees = useMemo(() => {
    const q = recherche.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return plantes
      .filter(p => {
        const cible = `${p.nomCommun} ${p.nomBotanique ?? ''} ${p.variete ?? ''}`.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
        return cible.includes(q);
      })
      .sort((a, b) => {
        let va: string | number = '', vb: string | number = '';
        if (tri.col === 'nomCommun') { va = a.nomCommun; vb = b.nomCommun; }
        else if (tri.col === 'type') { va = a.type ?? ''; vb = b.type ?? ''; }
        else if (tri.col === 'prix') { va = a.prix ?? 0; vb = b.prix ?? 0; }
        if (va < vb) return tri.asc ? -1 : 1;
        if (va > vb) return tri.asc ? 1 : -1;
        return 0;
      });
  }, [plantes, recherche, tri]);

  function toggleTri(col: Colonne) {
    setTri(t => t.col === col ? { col, asc: !t.asc } : { col, asc: true });
  }

  function toggleSelection(slug: string) {
    setSelection(s => {
      const n = new Set(s);
      n.has(slug) ? n.delete(slug) : n.add(slug);
      return n;
    });
  }

  function toutSelectionner() {
    if (selection.size === plantesFiltrees.length) setSelection(new Set());
    else setSelection(new Set(plantesFiltrees.map(p => p.slug)));
  }

  async function confirmerSuppression() {
    if (!aSupprimer) return;
    try {
      await supprimerPlante(aSupprimer);
      setPlantes(ps => ps.filter(p => p.slug !== aSupprimer));
      setSelection(s => { const n = new Set(s); n.delete(aSupprimer); return n; });
    } catch (e) {
      alert(`Erreur : ${e}`);
    } finally {
      setASupprimer(null);
    }
  }

  function imprimerSelection() {
    const slugs = [...selection].join(',');
    navigate(`/imprimer?slugs=${encodeURIComponent(slugs)}`);
  }

  const fleche = (col: Colonne) => tri.col === col ? (tri.asc ? ' ↑' : ' ↓') : '';

  if (chargement) return <div className="text-center py-20 text-gray-400">Chargement…</div>;
  if (erreur) return (
    <div className="text-center py-20">
      <p className="text-red-500 mb-4">{erreur}</p>
      <button onClick={charger} className="btn-primaire">Réessayer</button>
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h1 className="text-xl font-bold flex-1">Catalogue ({plantes.length})</h1>
        {selection.size > 0 && (
          <button onClick={imprimerSelection} className="btn-secondaire flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="12" height="8" rx="1"/><path d="M4 5V3h8v2"/><circle cx="12" cy="8.5" r=".75" fill="currentColor"/></svg>
            Imprimer QR ({selection.size})
          </button>
        )}
        <button onClick={() => navigate('/plante/nouvelle')} className="btn-primaire flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/></svg>
          Nouvelle plante
        </button>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Rechercher…"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          className="input max-w-xs"
        />
      </div>

      {plantesFiltrees.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Aucune plante trouvée.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" checked={selection.size === plantesFiltrees.length && plantesFiltrees.length > 0} onChange={toutSelectionner} className="rounded"/>
                </th>
                <th className="px-3 py-3 text-left w-16">Photo</th>
                <th className="px-3 py-3 text-left cursor-pointer select-none hover:text-vert" onClick={() => toggleTri('nomCommun')}>
                  Nom{fleche('nomCommun')}
                </th>
                <th className="px-3 py-3 text-left cursor-pointer select-none hover:text-vert hidden sm:table-cell" onClick={() => toggleTri('type')}>
                  Type{fleche('type')}
                </th>
                <th className="px-3 py-3 text-right cursor-pointer select-none hover:text-vert hidden md:table-cell" onClick={() => toggleTri('prix')}>
                  Prix{fleche('prix')}
                </th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plantesFiltrees.map(p => (
                <tr key={p.slug} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-center">
                    <input type="checkbox" checked={selection.has(p.slug)} onChange={() => toggleSelection(p.slug)} className="rounded"/>
                  </td>
                  <td className="px-3 py-2">
                    {p.image
                      ? <img src={`../images/${p.image}`} alt="" className="w-12 h-10 object-cover rounded" onError={e => (e.currentTarget.style.display = 'none')}/>
                      : <div className="w-12 h-10 bg-green-50 rounded flex items-center justify-center text-gray-300 text-xs">—</div>
                    }
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{p.nomCommun}</div>
                    {p.variete && <div className="text-gray-400 text-xs">{p.variete}</div>}
                  </td>
                  <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{p.type ?? '—'}</td>
                  <td className="px-3 py-2 text-right hidden md:table-cell">
                    {p.prix != null ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(p.prix) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/plante/${p.slug}`)} className="text-gray-400 hover:text-vert p-1 rounded" title="Éditer">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.5 2.5l3 3L5 14H2v-3L10.5 2.5Z"/></svg>
                      </button>
                      <button onClick={() => navigate(`/imprimer?slugs=${p.slug}`)} className="text-gray-400 hover:text-vert p-1 rounded" title="Imprimer QR">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="12" height="8" rx="1"/><path d="M4 5V3h8v2"/><circle cx="12" cy="8.5" r=".75" fill="currentColor"/></svg>
                      </button>
                      <button onClick={() => setASupprimer(p.slug)} className="text-gray-400 hover:text-red-500 p-1 rounded" title="Supprimer">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aSupprimer && (
        <ModalConfirm
          message={`Supprimer « ${plantes.find(p => p.slug === aSupprimer)?.nomCommun} » ? Cette action est irréversible.`}
          onConfirmer={confirmerSuppression}
          onAnnuler={() => setASupprimer(null)}
        />
      )}
    </div>
  );
}
