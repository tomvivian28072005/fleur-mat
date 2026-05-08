import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { listerPlantes } from '../lib/api';
import { genererQRDataURL, slugVersURL } from '../lib/qr';
import type { Plante } from '../lib/types';

interface QRItem {
  plante: Plante;
  dataURL: string;
  url: string;
}

const CSS_IMPRESSION = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4 portrait; margin: 1cm; }
  body { background: white; font-family: Arial, sans-serif; }
  .grille {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5cm;
    width: 100%;
  }
  .case {
    border: 1px dashed #999;
    border-radius: 4px;
    padding: 0.5cm;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3cm;
    text-align: center;
    break-inside: avoid;
  }
  .case img { width: 5cm; height: 5cm; }
  .nom { font-size: 14pt; font-weight: bold; }
  .variete { font-size: 11pt; color: #444; }
`;

export default function ImprimerQR() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const slugs = (searchParams.get('slugs') ?? '').split(',').filter(Boolean);

  const [items, setItems] = useState<QRItem[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    async function charger() {
      try {
        const plantes = await listerPlantes();
        const cibles = slugs.map(s => plantes.find(p => p.slug === s)).filter(Boolean) as Plante[];
        const results = await Promise.all(
          cibles.map(async p => {
            const url = slugVersURL(p.slug);
            return { plante: p, dataURL: await genererQRDataURL(url), url };
          })
        );
        setItems(results);
      } catch (e) {
        setErreur(String(e));
      } finally {
        setChargement(false);
      }
    }
    charger();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function ouvrirFenetreImpression() {
    const win = window.open('', '_blank', 'width=800,height=1000');
    if (!win) { alert('Autoriser les popups pour imprimer.'); return; }

    const cases = items.map(({ plante, dataURL }) => `
      <div class="case">
        <img src="${dataURL}" alt="QR ${plante.nomCommun}">
        <div class="nom">${plante.nomCommun}</div>
        ${plante.variete ? `<div class="variete">${plante.variete}</div>` : ''}
      </div>
    `).join('');

    win.document.write(`<!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>QR codes — FleurMat</title>
        <style>${CSS_IMPRESSION}</style>
      </head>
      <body>
        <div class="grille">${cases}</div>
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>`);
    win.document.close();
  }

  if (chargement) return <div className="text-center py-20 text-gray-400">Génération des QR codes…</div>;
  if (erreur) return <div className="text-center py-20 text-red-500">{erreur}</div>;
  if (items.length === 0) return (
    <div className="text-center py-20 text-gray-400">
      <p className="mb-4">Aucune plante sélectionnée.</p>
      <button onClick={() => navigate('/')} className="btn-primaire">Retour au catalogue</button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-vert p-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 16L6 10L12 4"/></svg>
        </button>
        <h1 className="text-xl font-bold flex-1">Impression QR — {items.length} plante{items.length > 1 ? 's' : ''}</h1>
        <button onClick={ouvrirFenetreImpression} className="btn-primaire flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="12" height="8" rx="1"/><path d="M4 5V3h8v2"/><rect x="5" y="9" width="6" height="4"/><circle cx="12" cy="8.5" r=".75" fill="currentColor"/></svg>
          Imprimer
        </button>
      </div>

      {/* Aperçu */}
      <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
        {items.map(({ plante, dataURL, url }) => (
          <div key={plante.slug} className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center gap-2 text-center">
            <img src={dataURL} alt={`QR ${plante.nomCommun}`} className="w-36 h-36"/>
            <div className="font-bold text-sm">{plante.nomCommun}</div>
            {plante.variete && <div className="text-xs text-gray-500">{plante.variete}</div>}
            <div className="text-xs text-gray-400 break-all">{url}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
