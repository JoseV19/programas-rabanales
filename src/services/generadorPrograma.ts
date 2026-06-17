import { Usuario, ReglaAsignacion, PlantillaSemana, Nombramiento } from '../types/asignaciones';
import { REGLAS } from '../utils/reglasAsignacion';
import { supabase } from '../lib/supabase';

function seleccionarHermano(
  usuarios: any[],
  regla: ReglaAsignacion,
  excluirIds: string[] = [],
  generoForzado?: 'M' | 'F' | 'CUALQUIERA',
  esAleatorio: boolean = false
): any | null {
  // 1. Descartamos a los que ya tienen asignación esta semana
  let candidatos = usuarios.filter(u => !excluirIds.includes(u.id));

  // 2. Filtro estricto de género (Este NO se negocia)
  const generoBuscado = generoForzado || regla.generoRequerido;
  if (generoBuscado !== 'CUALQUIERA') {
    candidatos = candidatos.filter(u => u.genero === generoBuscado);
  }

  if (candidatos.length === 0) return null;

  // 3. Filtro de Roles con "Salvavidas"
  if (regla.rolesPermitidos !== 'TODOS') {
    const candidatosConRolPerfecto = candidatos.filter(u => 
      u.roles && u.roles.some((rol: number) => (regla.rolesPermitidos as number[]).includes(rol))
    );
    
    // Si encontramos hermanos con el rol exacto, los usamos.
    // Si la base de datos no tiene roles o el filtro es muy estricto y da 0, 
    // ignoramos los roles temporalmente y usamos la lista filtrada por género para no dejar el programa vacío.
    if (candidatosConRolPerfecto.length > 0) {
      candidatos = candidatosConRolPerfecto;
    }
  }

  // 4. Aleatorización del pool final
  for (let i = candidatos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidatos[i], candidatos[j]] = [candidatos[j], candidatos[i]];
  }

  // 5. Prioridad a los que llevan más tiempo sin participar
  if (!esAleatorio) {
    candidatos.sort((a, b) => {
      if (!a.ultima_asignacion && !b.ultima_asignacion) return 0; 
      if (!a.ultima_asignacion) return -1;
      if (!b.ultima_asignacion) return 1;
      return new Date(a.ultima_asignacion).getTime() - new Date(b.ultima_asignacion).getTime();
    });
  }

  return candidatos[0] || null;
}

export async function generarSemana(fechaSemana: string, esAleatorio: boolean = false) {
  const mes = fechaSemana.substring(0, 7); 
  const primerDia = `${mes}-01`;
  const ultimoDia = `${mes}-31`;

  // Traemos asignaciones del mes con la sección incluida para filtrar
  const { data: asigMes } = await supabase
    .from('asignaciones')
    .select('usuario_principal_id, usuario_ayudante_id, seccion')
    .gte('fecha_semana', primerDia)
    .lte('fecha_semana', ultimoDia);

  const conteoTotal: Record<string, number> = {};
  const maestrosP: Record<string, number> = {};
  const maestrosA: Record<string, number> = {};

  if (asigMes) {
    asigMes.forEach((a: any) => {
      // Conteo general (Mes)
      if (a.usuario_principal_id) conteoTotal[a.usuario_principal_id] = (conteoTotal[a.usuario_principal_id] || 0) + 1;
      if (a.usuario_ayudante_id) conteoTotal[a.usuario_ayudante_id] = (conteoTotal[a.usuario_ayudante_id] || 0) + 1;

      // Conteo específico solo para SEAMOS MEJORES MAESTROS
      if (a.seccion === 'SEAMOS MEJORES MAESTROS') {
        if (a.usuario_principal_id) maestrosP[a.usuario_principal_id] = (maestrosP[a.usuario_principal_id] || 0) + 1;
        if (a.usuario_ayudante_id) maestrosA[a.usuario_ayudante_id] = (maestrosA[a.usuario_ayudante_id] || 0) + 1;
      }
    });
  }

  const { data: usuariosDb, error } = await supabase
    .from('usuarios')
    .select('id, nombre, genero, ultima_asignacion, usuario_roles(nombramiento_id)');

  if (error || !usuariosDb) throw new Error('Error al conectar con Supabase');

  const usuariosFormateados = usuariosDb.map((u: any) => ({
    id: u.id,
    nombre: u.nombre,
    genero: u.genero,
    ultima_asignacion: u.ultima_asignacion,
    roles: u.usuario_roles.map((ur: any) => ur.nombramiento_id),
    veces_mes: conteoTotal[u.id] || 0,
    m_p: maestrosP[u.id] || 0, // Encargado en Maestros
    m_a: maestrosA[u.id] || 0  // Auxiliar en Maestros
  }));

  const plantillaSemana: PlantillaSemana[] = [
    { seccion: 'INTRODUCCIÓN', tipo_asignacion: 'PRESIDENCIA', regla: REGLAS.PRESIDENCIA },
    { seccion: 'INTRODUCCIÓN', tipo_asignacion: 'ORACIÓN INICIAL', regla: REGLAS.ORACION },
    { seccion: 'TESOROS DE LA BIBLIA', tipo_asignacion: 'TESOROS DE LA BIBLIA', regla: REGLAS.TESOROS_BIBLIA },
    { seccion: 'TESOROS DE LA BIBLIA', tipo_asignacion: 'PERLAS ESCONDIDAS', regla: REGLAS.PERLAS_ESCONDIDAS },
    { seccion: 'TESOROS DE LA BIBLIA', tipo_asignacion: 'LECTURA DE LA BIBLIA', regla: REGLAS.LECTURA_BIBLIA },
    { seccion: 'SEAMOS MEJORES MAESTROS', tipo_asignacion: 'PRESENTACIÓN 1', regla: REGLAS.PRESENTACION },
    { seccion: 'SEAMOS MEJORES MAESTROS', tipo_asignacion: 'PRESENTACIÓN 2', regla: REGLAS.PRESENTACION },
    { seccion: 'SEAMOS MEJORES MAESTROS', tipo_asignacion: 'PRESENTACIÓN 3', regla: REGLAS.PRESENTACION },
    { seccion: 'NUESTRA VIDA CRISTIANA', tipo_asignacion: 'PARTE 1', regla: REGLAS.VIDA_CRISTIANA },
    { seccion: 'NUESTRA VIDA CRISTIANA', tipo_asignacion: 'ESTUDIO BÍBLICO (CONDUCTOR)', regla: REGLAS.ESTUDIO_CONDUCTOR },
    { seccion: 'NUESTRA VIDA CRISTIANA', tipo_asignacion: 'ESTUDIO BÍBLICO (LECTOR)', regla: REGLAS.ESTUDIO_LECTOR },
    { seccion: 'CONCLUSIÓN', tipo_asignacion: 'ORACIÓN FINAL', regla: REGLAS.ORACION },
  ];

  const asignacionesGeneradas = [];
  const asignadosEstaSemana: string[] = [];

  for (const parte of plantillaSemana) {
    const estudiante = seleccionarHermano(usuariosFormateados, parte.regla, asignadosEstaSemana, undefined, esAleatorio);
    if (!estudiante) continue;
    asignadosEstaSemana.push(estudiante.id);
    
    let ayudanteId = null;
    let ayudanteNombre = null;

    if (parte.regla.requiereAyudante && parte.regla.reglaEspecial === 'MISMO_GENERO') {
      const ayudante = seleccionarHermano(usuariosFormateados, { ...parte.regla, rolesPermitidos: 'TODOS' }, asignadosEstaSemana, estudiante.genero, esAleatorio);
      if (ayudante) {
        ayudanteId = ayudante.id;
        ayudanteNombre = ayudante.nombre;
        asignadosEstaSemana.push(ayudante.id);
      }
    }

    asignacionesGeneradas.push({
      fecha_semana: fechaSemana,
      seccion: parte.seccion,
      tipo_asignacion: parte.tipo_asignacion,
      usuario_principal_id: estudiante.id,
      nombre_principal: estudiante.nombre,
      usuario_ayudante_id: ayudanteId,
      nombre_ayudante: ayudanteNombre
    });
  }

  return { programa: asignacionesGeneradas, usuarios: usuariosFormateados };
}