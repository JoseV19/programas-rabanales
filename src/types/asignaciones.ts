export enum Nombramiento {
  ANCIANO = 1,
  SIERVO_MINISTERIAL = 2,
  PUBLICADOR = 3,
  NO_BAUTIZADO = 4,
}
export type Genero = 'M' | 'F' | 'CUALQUIERA';
export interface Usuario {
  id: string;
  nombre: string;
  genero: 'M' | 'F';
  roles: Nombramiento[];
  ultima_asignacion?: Date | null;
}
export interface ReglaAsignacion {
  rolesPermitidos: Nombramiento[] | 'TODOS';
  generoRequerido: Genero;
  requiereAyudante: boolean;
  reglaEspecial?: 'MISMO_GENERO';
}
export interface PlantillaSemana {
  seccion: string;
  tipo_asignacion: string;
  regla: ReglaAsignacion;
}
