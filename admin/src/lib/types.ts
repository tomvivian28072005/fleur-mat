export type Exposition = 'plein-soleil' | 'mi-ombre' | 'ombre';
export type Arrosage = 'faible' | 'modere' | 'regulier' | 'abondant';

export interface Plante {
  slug: string;
  nomCommun: string;
  nomBotanique?: string;
  variete?: string;
  image: string;
  prix?: number;
  type?: string;
  exposition?: Exposition;
  arrosage?: Arrosage;
  hauteurAdulte?: string;
  largeurAdulte?: string;
  periodePlantation?: string;
  periodeRecolteOuFloraison?: string;
  typeSol?: string;
  rusticite?: string;
  comestible?: boolean;
  notes?: string;
}
