export function versSlug(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function redimensionnerImage(fichier: File, maxLargeur = 1200): Promise<{ base64: string; nom: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxLargeur / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Préférer WebP, fallback JPEG
        const supportWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
        const type = supportWebP ? 'image/webp' : 'image/jpeg';
        const ext = supportWebP ? 'webp' : 'jpg';
        const base64 = canvas.toDataURL(type, 0.85);
        const nomSansExt = fichier.name.replace(/\.[^.]+$/, '');
        resolve({ base64, nom: `${nomSansExt}.${ext}` });
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(fichier);
  });
}
