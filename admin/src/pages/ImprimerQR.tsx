import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { listerPlantes } from '../lib/api';
import { genererQRDataURL, slugVersURL } from '../lib/qr';
import type { Plante } from '../lib/types';

interface QRItem {
  plante: Plante;
  dataURL: string;
}

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
          cibles.map(async p => ({
            plante: p,
            dataURL: await genererQRDataURL(slugVersURL(p.slug)),
          }))
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
      {/* Barre d'actions — masquée à l'impression */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-vert p-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 16L6 10L12 4"/></svg>
        </button>
        <h1 className="text-xl font-bold flex-1">Impression QR — {items.length} plante{items.length > 1 ? 's' : ''}</h1>
        <button onClick={() => window.print()} className="btn-primaire flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="12" height="8" rx="1"/><path d="M4 5V3h8v2"/><rect x="5" y="9" width="6" height="4"/><circle cx="12" cy="8.5" r=".75" fill="currentColor"/></svg>
          Imprimer
        </button>
      </div>

      {/* Grille d'impression */}
      <div className="qr-grille">
        {items.map(({ plante, dataURL }) => (
          <div key={plante.slug} className="qr-case">
            <img src={dataURL} alt={`QR ${plante.nomCommun}`} className="qr-image"/>
            <div className="qr-nom">{plante.nomCommun}</div>
            {plante.variete && <div className="qr-variete">{plante.variete}</div>}
          </div>
        ))}
      </div>

      <style>{`
        .qr-grille {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          max-width: 600px;
          margin: 0 auto;
        }
        .qr-case {
          border: 1.5px dashed #bbb;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          text-align: center;
        }
        .qr-image { width: 150px; height: 150px; }
        .qr-nom { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; }
        .qr-variete { font-family: Arial, sans-serif; font-size: 11px; color: #555; }

        @media print {
          @page { size: A4 portrait; margin: 1cm; }

          /* Masquer tout sauf la grille */
          body > * { display: none !important; }
          #root > div > header,
          #root > div > main > div > :not(.qr-grille) { display: none !important; }

          .qr-grille {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: repeat(4, auto);
            gap: 0.5cm;
            width: 100%;
            max-width: none;
          }
          .qr-case {
            border: 1px dashed #999;
            border-radius: 4px;
            padding: 0.5cm;
            break-inside: avoid;
          }
          .qr-image { width: 5cm; height: 5cm; }
          .qr-nom { font-size: 14pt; font-weight: bold; }
          .qr-variete { font-size: 11pt; color: #444; }
        }
      `}</style>
    </div>
  );
}
