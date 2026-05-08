/**
 * Plugin Vite : expose /api/plantes et /api/images
 * Lit/écrit dans le répertoire racine du repo (configurable via header X-Repo-Path).
 */
import type { Plugin, ViteDevServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { IncomingMessage, ServerResponse } from 'node:http';

function lireCorps(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

export function fsPlugin(): Plugin {
  return {
    name: 'fleurmat-fs',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        const method = req.method ?? 'GET';

        // CORS preflight
        if (method === 'OPTIONS') {
          res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,X-Repo-Path' });
          res.end();
          return;
        }

        // GET /api/detect — détecte automatiquement le repo et l'URL GitHub Pages
        if (url === '/api/detect' && method === 'GET') {
          const repoPrincipal = path.join(process.cwd(), '..');
          let urlBase = '';
          try {
            const gitConfig = fs.readFileSync(path.join(repoPrincipal, '.git', 'config'), 'utf-8');
            // Extraire l'URL remote origin (https ou ssh)
            const httpsMatch = gitConfig.match(/url\s*=\s*https:\/\/github\.com\/([^/]+)\/([^\s.]+)/);
            const sshMatch = gitConfig.match(/url\s*=\s*git@github\.com:([^/]+)\/([^\s.]+)/);
            const m = httpsMatch ?? sshMatch;
            if (m) {
              const [, user, repo] = m;
              urlBase = `https://${user}.github.io/${repo.replace(/\.git$/, '')}`;
            }
          } catch { /* pas de .git ou pas de remote */ }
          json(res, 200, { repoPrincipal, urlBase });
          return;
        }

        // Lire le chemin du repo depuis le header ou localStorage (passé en header)
        const repoPath = (req.headers['x-repo-path'] as string | undefined) ?? '';
        if (!repoPath && url.startsWith('/api/')) {
          json(res, 400, { erreur: 'Header X-Repo-Path manquant' });
          return;
        }

        const plantesFichier = repoPath ? path.join(repoPath, 'data', 'plantes.json') : '';
        const imagesDir = repoPath ? path.join(repoPath, 'images') : '';

        // GET /api/plantes
        if (url === '/api/plantes' && method === 'GET') {
          try {
            const contenu = fs.readFileSync(plantesFichier, 'utf-8');
            json(res, 200, JSON.parse(contenu));
          } catch {
            json(res, 200, []);
          }
          return;
        }

        // POST /api/plantes  — remplace tout le tableau
        if (url === '/api/plantes' && method === 'POST') {
          try {
            const body = await lireCorps(req);
            const plantes = JSON.parse(body.toString('utf-8'));
            fs.mkdirSync(path.dirname(plantesFichier), { recursive: true });
            fs.writeFileSync(plantesFichier, JSON.stringify(plantes, null, 2), 'utf-8');
            json(res, 200, { ok: true });
          } catch (e) {
            json(res, 500, { erreur: String(e) });
          }
          return;
        }

        // DELETE /api/plantes/:slug
        if (url.startsWith('/api/plantes/') && method === 'DELETE') {
          const slug = decodeURIComponent(url.slice('/api/plantes/'.length));
          try {
            const contenu = fs.readFileSync(plantesFichier, 'utf-8');
            const plantes: Array<{ slug: string; image?: string }> = JSON.parse(contenu);
            const plante = plantes.find(p => p.slug === slug);

            // Supprimer l'image associée si elle existe
            if (plante?.image) {
              const imgPath = path.join(imagesDir, plante.image);
              if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            }

            const nouvelles = plantes.filter(p => p.slug !== slug);
            fs.writeFileSync(plantesFichier, JSON.stringify(nouvelles, null, 2), 'utf-8');
            json(res, 200, { ok: true });
          } catch (e) {
            json(res, 500, { erreur: String(e) });
          }
          return;
        }

        // POST /api/images  — corps : multipart simulé en base64 JSON { nom, base64 }
        if (url === '/api/images' && method === 'POST') {
          try {
            const body = await lireCorps(req);
            const { nom, base64 } = JSON.parse(body.toString('utf-8')) as { nom: string; base64: string };
            const data = base64.replace(/^data:[^;]+;base64,/, '');
            fs.mkdirSync(imagesDir, { recursive: true });
            const dest = path.join(imagesDir, path.basename(nom));
            fs.writeFileSync(dest, Buffer.from(data, 'base64'));
            json(res, 200, { ok: true, nom: path.basename(nom) });
          } catch (e) {
            json(res, 500, { erreur: String(e) });
          }
          return;
        }

        // DELETE /api/images/:nom
        if (url.startsWith('/api/images/') && method === 'DELETE') {
          const nom = decodeURIComponent(url.slice('/api/images/'.length));
          try {
            const imgPath = path.join(imagesDir, path.basename(nom));
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
            json(res, 200, { ok: true });
          } catch (e) {
            json(res, 500, { erreur: String(e) });
          }
          return;
        }

        next();
      });
    },
  };
}
