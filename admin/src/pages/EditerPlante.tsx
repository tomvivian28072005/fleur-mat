import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listerPlantes, sauvegarderPlantes, uploaderImage } from '../lib/api';
import type { Plante, Exposition, Arrosage } from '../lib/types';
import { versSlug, redimensionnerImage } from '../lib/utils';

const EXPOSITIONS: { val: Exposition; label: string }[] = [
  { val: 'plein-soleil', label: '☀ Plein soleil' },
  { val: 'mi-ombre', label: '⛅ Mi-ombre' },
  { val: 'ombre', label: '🌥 Ombre' },
];
const ARROSAGES: { val: Arrosage; label: string }[] = [
  { val: 'faible', label: '💧 Faible' },
  { val: 'modere', label: '💧💧 Modéré' },
  { val: 'regulier', label: '💧💧💧 Régulier' },
  { val: 'abondant', label: '🌊 Abondant' },
];

const VIDE: Omit<Plante, 'slug' | 'image'> & { slug: string; image: string } = {
  slug: '', nomCommun: '', nomBotanique: '', variete: '', image: '',
  prix: undefined, type: '', exposition: undefined, arrosage: undefined,
  hauteurAdulte: '', largeurAdulte: '', periodePlantation: '',
  periodeRecolteOuFloraison: '', typeSol: '', rusticite: '',
  comestible: undefined, notes: '',
};

export default function EditerPlante() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const estNouvelle = !slug || slug === 'nouvelle';

  const [form, setForm] = useState<Plante>({ ...VIDE } as Plante);
  const [slugManuel, setSlugManuel] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageNouveauFichier, setImageNouveauFichier] = useState<{ base64: string; nom: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(!estNouvelle);
  const inputFichierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (estNouvelle) return;
    listerPlantes().then(plantes => {
      const p = plantes.find(x => x.slug === slug);
      if (p) {
        setForm(p);
        setSlugManuel(true);
        if (p.image) setImagePreview(`../images/${p.image}`);
      } else {
        setErreur('Plante introuvable');
      }
    }).catch(e => setErreur(String(e))).finally(() => setChargement(false));
  }, [slug, estNouvelle]);

  function set<K extends keyof Plante>(champ: K, val: Plante[K]) {
    setForm(f => {
      const next = { ...f, [champ]: val };
      // Auto-slug si pas modifié manuellement
      if (!slugManuel && (champ === 'nomCommun' || champ === 'variete')) {
        const base = `${champ === 'nomCommun' ? val : f.nomCommun} ${champ === 'variete' ? val : (f.variete ?? '')}`.trim();
        next.slug = versSlug(base as string);
      }
      return next;
    });
  }

  async function traiterImage(fichier: File) {
    try {
      const { base64, nom } = await redimensionnerImage(fichier);
      const nomAvecSlug = `${form.slug || versSlug(form.nomCommun || fichier.name)}.${nom.split('.').pop()}`;
      setImageNouveauFichier({ base64, nom: nomAvecSlug });
      setImagePreview(base64);
      setForm(f => ({ ...f, image: nomAvecSlug }));
    } catch (e) {
      alert(`Erreur traitement image : ${e}`);
    }
  }

  async function enregistrer() {
    if (!form.nomCommun.trim()) { setErreur('Le nom commun est obligatoire.'); return; }
    if (!form.image) { setErreur('Une image est obligatoire.'); return; }
    if (!form.slug) { setErreur('Le slug est obligatoire.'); return; }
    setErreur('');
    setSauvegarde(true);
    try {
      // Uploader l'image si nouvelle
      if (imageNouveauFichier) {
        await uploaderImage(imageNouveauFichier.nom, imageNouveauFichier.base64);
      }

      const plantes = await listerPlantes();
      const propres = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      ) as Plante;

      if (estNouvelle) {
        await sauvegarderPlantes([...plantes, propres]);
      } else {
        await sauvegarderPlantes(plantes.map(p => (p.slug === slug ? propres : p)));
      }
      navigate('/');
    } catch (e) {
      setErreur(String(e));
    } finally {
      setSauvegarde(false);
    }
  }

  if (chargement) return <div className="text-center py-20 text-gray-400">Chargement…</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-vert p-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 16L6 10L12 4"/></svg>
        </button>
        <h1 className="text-xl font-bold">{estNouvelle ? 'Nouvelle plante' : `Éditer — ${form.nomCommun}`}</h1>
      </div>

      <div className="space-y-6">
        {/* Infos principales */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Informations principales</h2>

          <label className="block">
            <span className="label">Nom commun <span className="text-red-500">*</span></span>
            <input className="input mt-1" value={form.nomCommun} onChange={e => set('nomCommun', e.target.value)} placeholder="ex : Tomate cerise"/>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="label">Nom botanique</span>
              <input className="input mt-1" value={form.nomBotanique ?? ''} onChange={e => set('nomBotanique', e.target.value)} placeholder="ex : Solanum lycopersicum"/>
            </label>
            <label className="block">
              <span className="label">Variété</span>
              <input className="input mt-1" value={form.variete ?? ''} onChange={e => set('variete', e.target.value)} placeholder="ex : Sweet 100"/>
            </label>
          </div>

          <label className="block">
            <span className="label">Slug (identifiant URL)</span>
            <input
              className="input mt-1 font-mono text-sm"
              value={form.slug}
              onChange={e => { setSlugManuel(true); set('slug', e.target.value); }}
            />
            <span className="text-xs text-gray-400 mt-1 block">Généré automatiquement depuis le nom. Modifiable manuellement.</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="label">Type</span>
              <input className="input mt-1" value={form.type ?? ''} onChange={e => set('type', e.target.value)} placeholder="ex : Annuelle potagère"/>
            </label>
            <label className="block">
              <span className="label">Prix (€)</span>
              <input type="number" min="0" step="0.1" className="input mt-1" value={form.prix ?? ''} onChange={e => set('prix', e.target.value ? Number(e.target.value) : undefined)}/>
            </label>
          </div>
        </section>

        {/* Image */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">Photo <span className="text-red-500">*</span></h2>
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-vert bg-green-50' : 'border-gray-200 hover:border-vert'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) traiterImage(f); }}
            onClick={() => inputFichierRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Aperçu" className="max-h-48 mx-auto rounded-lg object-cover"/>
            ) : (
              <div className="text-gray-400">
                <svg className="mx-auto mb-2" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="28" height="20" rx="3"/><circle cx="11" cy="14" r="3"/><path d="M2 22L9 15l6 7 5-5 10 8"/></svg>
                <p className="text-sm">Glisser-déposer ou cliquer</p>
                <p className="text-xs mt-1">JPG, WebP — redimensionné à 1200px max</p>
              </div>
            )}
          </div>
          <input ref={inputFichierRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) traiterImage(f); }}/>
          {imagePreview && (
            <button className="text-xs text-gray-400 hover:text-red-500 mt-2" onClick={() => { setImagePreview(''); setImageNouveauFichier(null); setForm(f => ({ ...f, image: '' })); }}>
              Supprimer l'image
            </button>
          )}
        </section>

        {/* Conditions de culture */}
        <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Conditions de culture</h2>

          <div>
            <span className="label block mb-2">Exposition</span>
            <div className="flex flex-wrap gap-2">
              {EXPOSITIONS.map(e => (
                <button key={e.val} onClick={() => set('exposition', form.exposition === e.val ? undefined : e.val)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${form.exposition === e.val ? 'bg-vert text-white border-vert' : 'border-gray-200 hover:border-vert text-gray-600'}`}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label block mb-2">Arrosage</span>
            <div className="flex flex-wrap gap-2">
              {ARROSAGES.map(a => (
                <button key={a.val} onClick={() => set('arrosage', form.arrosage === a.val ? undefined : a.val)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${form.arrosage === a.val ? 'bg-vert text-white border-vert' : 'border-gray-200 hover:border-vert text-gray-600'}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="label">Hauteur adulte</span>
              <input className="input mt-1" value={form.hauteurAdulte ?? ''} onChange={e => set('hauteurAdulte', e.target.value)} placeholder="ex : 1,50 m"/>
            </label>
            <label className="block">
              <span className="label">Largeur adulte</span>
              <input className="input mt-1" value={form.largeurAdulte ?? ''} onChange={e => set('largeurAdulte', e.target.value)} placeholder="ex : 60 cm"/>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="label">Période de plantation</span>
              <input className="input mt-1" value={form.periodePlantation ?? ''} onChange={e => set('periodePlantation', e.target.value)} placeholder="ex : Avril - Mai"/>
            </label>
            <label className="block">
              <span className="label">Récolte / Floraison</span>
              <input className="input mt-1" value={form.periodeRecolteOuFloraison ?? ''} onChange={e => set('periodeRecolteOuFloraison', e.target.value)} placeholder="ex : Juillet - Octobre"/>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="label">Type de sol</span>
              <input className="input mt-1" value={form.typeSol ?? ''} onChange={e => set('typeSol', e.target.value)} placeholder="ex : Riche, bien drainé"/>
            </label>
            <label className="block">
              <span className="label">Rusticité</span>
              <input className="input mt-1" value={form.rusticite ?? ''} onChange={e => set('rusticite', e.target.value)} placeholder="ex : Rustique (−15 °C)"/>
            </label>
          </div>

          <div>
            <span className="label block mb-2">Comestible</span>
            <div className="flex gap-2">
              {[{ val: true, label: 'Oui' }, { val: false, label: 'Non' }].map(opt => (
                <button key={String(opt.val)} onClick={() => set('comestible', form.comestible === opt.val ? undefined : opt.val)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${form.comestible === opt.val ? 'bg-vert text-white border-vert' : 'border-gray-200 hover:border-vert text-gray-600'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block">
            <span className="label">Notes de culture</span>
            <textarea className="input mt-1 h-24 resize-none" value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Conseils de culture, particularités…"/>
          </label>
        </section>
      </div>

      {erreur && <p className="text-red-500 text-sm mt-4">{erreur}</p>}

      <div className="flex gap-3 mt-6 pb-8">
        <button onClick={() => navigate('/')} className="btn-secondaire">Annuler</button>
        <button onClick={enregistrer} disabled={sauvegarde} className="btn-primaire flex items-center gap-2">
          {sauvegarde && <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6" strokeDasharray="20" strokeDashoffset="5"/></svg>}
          {sauvegarde ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
