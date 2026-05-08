import type { Plante } from './types';

function repoPath(): string {
  return localStorage.getItem('fleurmat_repo') ?? '';
}

function headers(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'X-Repo-Path': repoPath() };
}

export async function listerPlantes(): Promise<Plante[]> {
  const res = await fetch('/api/plantes', { headers: headers() });
  if (!res.ok) throw new Error('Impossible de lire plantes.json');
  return res.json();
}

export async function sauvegarderPlantes(plantes: Plante[]): Promise<void> {
  const res = await fetch('/api/plantes', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(plantes),
  });
  if (!res.ok) throw new Error('Impossible d\'écrire plantes.json');
}

export async function supprimerPlante(slug: string): Promise<void> {
  const res = await fetch(`/api/plantes/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Suppression échouée');
}

export async function uploaderImage(nom: string, base64: string): Promise<string> {
  const res = await fetch('/api/images', {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ nom, base64 }),
  });
  if (!res.ok) throw new Error('Upload image échoué');
  const data = await res.json() as { nom: string };
  return data.nom;
}
