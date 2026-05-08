/* FleurMat — app.js (vanilla JS, < 20 ko) */
(function () {
  'use strict';

  const CACHE_KEY = 'fleurmat_plantes';
  const CACHE_HASH_KEY = 'fleurmat_hash';

  // ---- Icônes SVG inline ----
  const SVG = {
    soleil: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="14" cy="14" r="5"/><line x1="14" y1="2" x2="14" y2="5"/><line x1="14" y1="23" x2="14" y2="26"/><line x1="2" y1="14" x2="5" y2="14"/><line x1="23" y1="14" x2="26" y2="14"/><line x1="5.5" y1="5.5" x2="7.6" y2="7.6"/><line x1="20.4" y1="20.4" x2="22.5" y2="22.5"/><line x1="22.5" y1="5.5" x2="20.4" y2="7.6"/><line x1="7.6" y1="20.4" x2="5.5" y2="22.5"/></svg>`,
    miOmbre: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 4 A10 10 0 0 1 14 24 A10 10 0 0 1 14 4Z"/><path d="M14 4 A10 10 0 0 0 14 24" fill="currentColor" opacity=".2"/><line x1="14" y1="2" x2="14" y2="5"/><line x1="14" y1="23" x2="14" y2="26"/></svg>`,
    ombre: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="14" cy="14" r="8" fill="currentColor" opacity=".15"/><path d="M6 14 Q10 8 14 14 Q18 20 22 14" stroke="currentColor"/><circle cx="14" cy="14" r="8"/></svg>`,
    goutte: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4 C14 4 6 13 6 18 A8 8 0 0 0 22 18 C22 13 14 4 14 4Z"/></svg>`,
    regle: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="14" y1="4" x2="14" y2="24"/><line x1="10" y1="4" x2="18" y2="4"/><line x1="10" y1="24" x2="18" y2="24"/><line x1="11" y1="10" x2="14" y2="10"/><line x1="11" y1="16" x2="14" y2="16"/></svg>`,
    calendrier: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="6" width="20" height="18" rx="3"/><line x1="4" y1="11" x2="24" y2="11"/><line x1="9" y1="4" x2="9" y2="8"/><line x1="19" y1="4" x2="19" y2="8"/><circle cx="9" cy="16" r="1.2" fill="currentColor"/><circle cx="14" cy="16" r="1.2" fill="currentColor"/><circle cx="19" cy="16" r="1.2" fill="currentColor"/><circle cx="9" cy="21" r="1.2" fill="currentColor"/><circle cx="14" cy="21" r="1.2" fill="currentColor"/></svg>`,
  };

  const EXPO_LABELS = { 'plein-soleil': 'Plein soleil', 'mi-ombre': 'Mi-ombre', 'ombre': 'Ombre' };
  const ARROSAGE_LABELS = { faible: 'Faible', modere: 'Modéré', regulier: 'Régulier', abondant: 'Abondant' };

  // ---- État ----
  let plantes = [];
  let suggestionsActives = [];
  let idxSuggestion = -1;

  // ---- DOM ----
  const $ = id => document.getElementById(id);
  const inputRecherche = $('recherche');
  const listeSuggestions = $('suggestions');
  const ecranAccueil = $('ecran-accueil');
  const fichePlante = $('fiche-plante');
  const ecranErreur = $('ecran-erreur');
  const listePlantesEl = $('liste-plantes');

  // ---- Chargement des données ----
  // Toujours fetcher en frais (cache-busting) ; localStorage = fallback hors-ligne uniquement
  async function chargerPlantes() {
    try {
      const res = await fetch(`data/plantes.json?_=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Impossible de charger les données');
      const data = await res.json();
      // Sauvegarder pour le hors-ligne
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (_) {}
      // Ne retourner que les plantes visibles (visible !== false)
      return data.filter(p => p.visible !== false);
    } catch (e) {
      // Hors-ligne : utiliser le cache local
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached).filter(p => p.visible !== false);
      console.error('Erreur chargement plantes :', e);
      return [];
    }
  }

  // ---- Routage ----
  function lireSlug() {
    const params = new URLSearchParams(location.search);
    return params.get('p');
  }

  function naviguer(slug) {
    const url = slug ? `?p=${encodeURIComponent(slug)}` : '/';
    history.pushState({}, '', url);
    afficher(slug);
  }

  function afficher(slug) {
    // Masquer tous les écrans
    ecranAccueil.hidden = true;
    fichePlante.hidden = true;
    ecranErreur.hidden = true;

    if (!slug) {
      afficherAccueil();
    } else {
      const plante = plantes.find(p => p.slug === slug);
      if (plante) {
        afficherFiche(plante);
      } else {
        afficherErreur(slug);
      }
    }
  }

  // ---- Écran accueil ----
  function afficherAccueil() {
    ecranAccueil.hidden = false;
    document.title = 'FleurMat — Fiches plantes';

    listePlantesEl.innerHTML = plantes.map(p => `
      <div class="carte-plante" tabindex="0" role="button" aria-label="${p.nomCommun}" data-slug="${p.slug}">
        ${p.image
          ? `<img src="images/${p.image}" alt="${p.nomCommun}" loading="lazy" onerror="this.style.display='none'">`
          : `<div style="height:120px;background:var(--vert-clair)"></div>`}
        <div class="carte-body">
          <div class="carte-nom">${echapper(p.nomCommun)}</div>
          ${p.variete ? `<div class="carte-variete">${echapper(p.variete)}</div>` : ''}
          ${p.prix != null ? `<div class="carte-prix">${formaterPrix(p.prix)}</div>` : ''}
        </div>
      </div>
    `).join('');

    listePlantesEl.querySelectorAll('.carte-plante').forEach(el => {
      el.addEventListener('click', () => naviguer(el.dataset.slug));
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') naviguer(el.dataset.slug); });
    });
  }

  // ---- Fiche plante ----
  function afficherFiche(p) {
    fichePlante.hidden = false;
    document.title = `${p.nomCommun}${p.variete ? ' ' + p.variete : ''} — FleurMat`;

    // Photo
    const photo = $('fiche-photo');
    if (p.image) {
      photo.src = `images/${p.image}`;
      photo.alt = p.nomCommun;
      photo.hidden = false;
    } else {
      photo.hidden = true;
    }

    // Prix
    const prixBadge = $('fiche-prix');
    if (p.prix != null) {
      prixBadge.textContent = formaterPrix(p.prix);
      prixBadge.hidden = false;
    } else {
      prixBadge.hidden = true;
    }

    // Nom & botanique
    $('fiche-nom').textContent = p.nomCommun;
    const bot = $('fiche-botanique');
    const parties = [];
    if (p.nomBotanique) parties.push(p.nomBotanique);
    if (p.variete) parties.push(`(${p.variete})`);
    if (parties.length) {
      bot.textContent = parties.join(' ');
      bot.hidden = false;
    } else {
      bot.hidden = true;
    }

    // Pictos
    construirePictos(p);

    // Infos secondaires
    construireInfosDetail(p);

    // Notes
    const notesWrap = $('fiche-notes-wrap');
    if (p.notes) {
      $('fiche-notes').textContent = p.notes;
      notesWrap.hidden = false;
    } else {
      notesWrap.hidden = true;
    }

    // Reset toggle
    const btn = fichePlante.querySelector('.toggle-infos');
    const detail = $('infos-detail');
    btn.setAttribute('aria-expanded', 'false');
    detail.hidden = true;

    window.scrollTo(0, 0);
  }

  function construirePictos(p) {
    const conteneur = $('fiche-pictos');
    const items = [];

    if (p.exposition) {
      const icone = p.exposition === 'plein-soleil' ? SVG.soleil : p.exposition === 'mi-ombre' ? SVG.miOmbre : SVG.ombre;
      items.push({ icone, label: 'Exposition', valeur: EXPO_LABELS[p.exposition] || p.exposition });
    }
    if (p.arrosage) {
      items.push({ icone: SVG.goutte, label: 'Arrosage', valeur: ARROSAGE_LABELS[p.arrosage] || p.arrosage });
    }
    if (p.hauteurAdulte) {
      items.push({ icone: SVG.regle, label: 'Hauteur', valeur: p.hauteurAdulte });
    }
    if (p.periodeRecolteOuFloraison) {
      items.push({ icone: SVG.calendrier, label: 'Récolte / Floraison', valeur: p.periodeRecolteOuFloraison });
    }

    conteneur.innerHTML = items.map(i => `
      <div class="picto-item">
        ${i.icone}
        <span class="picto-label">${echapper(i.label)}</span>
        <span class="picto-valeur">${echapper(i.valeur)}</span>
      </div>
    `).join('');
  }

  function construireInfosDetail(p) {
    const dl = $('infos-detail');
    const champs = [
      { label: 'Type', val: p.type },
      { label: 'Période de plantation', val: p.periodePlantation },
      { label: 'Type de sol', val: p.typeSol },
      { label: 'Rusticité', val: p.rusticite },
      { label: 'Largeur adulte', val: p.largeurAdulte },
      { label: 'Comestible', val: p.comestible === true ? 'Oui' : p.comestible === false ? 'Non' : null },
    ].filter(c => c.val != null && c.val !== '');

    if (champs.length === 0) {
      dl.parentElement.hidden = true;
      return;
    }
    dl.parentElement.hidden = false;

    dl.innerHTML = champs.map(c => `
      <div><dt>${echapper(c.label)}</dt><dd>${echapper(String(c.val))}</dd></div>
    `).join('');
  }

  function afficherErreur(slug) {
    ecranErreur.hidden = false;
    $('erreur-slug').textContent = `Aucune plante trouvée pour « ${slug} ».`;
    document.title = 'Plante introuvable — FleurMat';
  }

  // ---- Recherche & suggestions ----
  function normaliser(s) {
    return s.toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '');
  }

  function rechercherPlantes(q) {
    const n = normaliser(q);
    return plantes.filter(p => {
      return normaliser(p.nomCommun).includes(n)
        || (p.nomBotanique && normaliser(p.nomBotanique).includes(n))
        || (p.variete && normaliser(p.variete).includes(n));
    }).slice(0, 8);
  }

  function afficherSuggestions(resultats) {
    suggestionsActives = resultats;
    idxSuggestion = -1;

    if (resultats.length === 0) {
      listeSuggestions.hidden = true;
      return;
    }

    listeSuggestions.innerHTML = resultats.map((p, i) => `
      <li role="option" data-idx="${i}" id="sug-${i}">
        <div>
          <div class="sug-nom">${echapper(p.nomCommun)}${p.variete ? ` <em>${echapper(p.variete)}</em>` : ''}</div>
          ${p.nomBotanique ? `<div class="sug-bot">${echapper(p.nomBotanique)}</div>` : ''}
        </div>
      </li>
    `).join('');

    listeSuggestions.querySelectorAll('li').forEach(li => {
      li.addEventListener('mousedown', e => {
        e.preventDefault();
        const p = suggestionsActives[+li.dataset.idx];
        if (p) choisirSuggestion(p);
      });
    });

    listeSuggestions.hidden = false;
  }

  function choisirSuggestion(p) {
    inputRecherche.value = '';
    listeSuggestions.hidden = true;
    naviguer(p.slug);
  }

  function majSuggestionActive() {
    listeSuggestions.querySelectorAll('li').forEach((li, i) => {
      li.setAttribute('aria-selected', String(i === idxSuggestion));
    });
    if (idxSuggestion >= 0) {
      inputRecherche.setAttribute('aria-activedescendant', `sug-${idxSuggestion}`);
    } else {
      inputRecherche.removeAttribute('aria-activedescendant');
    }
  }

  // ---- Événements ----
  inputRecherche.addEventListener('input', () => {
    const q = inputRecherche.value.trim();
    if (q.length < 1) { listeSuggestions.hidden = true; return; }
    afficherSuggestions(rechercherPlantes(q));
  });

  inputRecherche.addEventListener('keydown', e => {
    if (!suggestionsActives.length || listeSuggestions.hidden) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idxSuggestion = Math.min(idxSuggestion + 1, suggestionsActives.length - 1);
      majSuggestionActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idxSuggestion = Math.max(idxSuggestion - 1, -1);
      majSuggestionActive();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const p = idxSuggestion >= 0 ? suggestionsActives[idxSuggestion] : suggestionsActives[0];
      if (p) choisirSuggestion(p);
    } else if (e.key === 'Escape') {
      listeSuggestions.hidden = true;
    }
  });

  inputRecherche.addEventListener('blur', () => {
    setTimeout(() => { listeSuggestions.hidden = true; }, 150);
  });

  // Toggle infos secondaires
  document.addEventListener('click', e => {
    const btn = e.target.closest('.toggle-infos');
    if (!btn) return;
    const detail = $('infos-detail');
    const ouvert = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!ouvert));
    detail.hidden = ouvert;
    btn.childNodes[0].textContent = ouvert ? "Voir plus d'infos" : 'Voir moins ';
  });

  // Navigation navigateur (bouton retour)
  window.addEventListener('popstate', () => afficher(lireSlug()));

  // ---- Utilitaires ----
  function echapper(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formaterPrix(n) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  }

  // ---- Init ----
  async function init() {
    plantes = await chargerPlantes();
    afficher(lireSlug());
  }

  init();

  // Enregistrer le Service Worker pour le mode hors-ligne
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

})();
