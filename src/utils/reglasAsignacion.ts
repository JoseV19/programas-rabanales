import { Nombramiento, ReglaAsignacion } from '../types/asignaciones';

export const REGLAS: Record<string, ReglaAsignacion> = {
  // INTRODUCCIÓN
  PRESIDENCIA: { rolesPermitidos: [Nombramiento.ANCIANO, Nombramiento.SIERVO_MINISTERIAL], generoRequerido: 'M', requiereAyudante: false },
  ORACION: { rolesPermitidos: [Nombramiento.ANCIANO, Nombramiento.SIERVO_MINISTERIAL], generoRequerido: 'M', requiereAyudante: false },

  // TESOROS DE LA BIBLIA
  TESOROS_BIBLIA: { rolesPermitidos: [Nombramiento.ANCIANO, Nombramiento.SIERVO_MINISTERIAL], generoRequerido: 'M', requiereAyudante: false },
  PERLAS_ESCONDIDAS: { rolesPermitidos: [Nombramiento.ANCIANO, Nombramiento.SIERVO_MINISTERIAL], generoRequerido: 'M', requiereAyudante: false },
  // Lectura: Cualquier varón (Publicador o No Bautizado)
  LECTURA_BIBLIA: { rolesPermitidos: [Nombramiento.PUBLICADOR, Nombramiento.NO_BAUTIZADO], generoRequerido: 'M', requiereAyudante: false },

  // SEAMOS MEJORES MAESTROS
  // Presentaciones: Todos, requiere ayudante, estricto mismo género
  PRESENTACION: { rolesPermitidos: 'TODOS', generoRequerido: 'CUALQUIERA', requiereAyudante: true, reglaEspecial: 'MISMO_GENERO' },
  // Discurso (Alternativa a presentación): Solo varones capacitados
  DISCURSO_MAESTROS: { rolesPermitidos: [Nombramiento.ANCIANO, Nombramiento.SIERVO_MINISTERIAL, Nombramiento.PUBLICADOR], generoRequerido: 'M', requiereAyudante: false },

  // NUESTRA VIDA CRISTIANA
  VIDA_CRISTIANA: { rolesPermitidos: [Nombramiento.ANCIANO, Nombramiento.SIERVO_MINISTERIAL], generoRequerido: 'M', requiereAyudante: false },
  ESTUDIO_CONDUCTOR: { rolesPermitidos: [Nombramiento.ANCIANO, Nombramiento.SIERVO_MINISTERIAL], generoRequerido: 'M', requiereAyudante: false },
  // Lector: Solo publicador bautizado (ID 3) varón
  ESTUDIO_LECTOR: { rolesPermitidos: [Nombramiento.PUBLICADOR], generoRequerido: 'M', requiereAyudante: false },
};