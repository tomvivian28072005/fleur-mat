import QRCode from 'qrcode';

export async function genererQRDataURL(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 200,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}

export function slugVersURL(slug: string): string {
  const base = localStorage.getItem('fleurmat_url_base') ?? '';
  return `${base.replace(/\/$/, '')}/?p=${encodeURIComponent(slug)}`;
}
