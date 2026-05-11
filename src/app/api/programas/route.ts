import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get('fecha');

  try {
    if (fecha) {
      // 1. Buscamos las asignaciones de esa fecha exacta
      const { data: asignaciones, error: errAsig } = await supabase
        .from('asignaciones')
        .select('*')
        .eq('fecha_semana', fecha);
      
      if (errAsig) throw errAsig;

      // 2. Traemos a todos los usuarios para cruzar sus IDs con sus Nombres
      const { data: usuarios, error: errUsr } = await supabase.from('usuarios').select('id, nombre');
      if (errUsr) throw errUsr;

      // 3. Reconstruimos el programa con los nombres para que se vea bien en pantalla
      const programaReconstruido = asignaciones.map(p => ({
        ...p,
        nombre_principal: usuarios.find(u => u.id === p.usuario_principal_id)?.nombre || 'Hermano Eliminado',
        nombre_ayudante: p.usuario_ayudante_id ? usuarios.find(u => u.id === p.usuario_ayudante_id)?.nombre : null
      }));

      // 4. Ordenamos el programa para que no salga desordenado (el orden de la reunión)
      const ORDEN = ['PRESIDENCIA', 'ORACIÓN INICIAL', 'TESOROS DE LA BIBLIA', 'PERLAS ESCONDIDAS', 'LECTURA DE LA BIBLIA', 'PRESENTACIÓN 1', 'PRESENTACIÓN 2', 'PRESENTACIÓN 3', 'DISCURSO', 'PARTE 1', 'ESTUDIO BÍBLICO (CONDUCTOR)', 'ESTUDIO BÍBLICO (LECTOR)', 'ORACIÓN FINAL'];
      
      programaReconstruido.sort((a, b) => {
        let indexA = ORDEN.indexOf(a.tipo_asignacion);
        let indexB = ORDEN.indexOf(b.tipo_asignacion);
        if(indexA === -1) indexA = 99;
        if(indexB === -1) indexB = 99;
        return indexA - indexB;
      });

      return NextResponse.json({ success: true, data: programaReconstruido });
    } else {
      // Si no nos piden una fecha, devolvemos la lista de TODAS las fechas guardadas
      const { data, error } = await supabase.from('asignaciones').select('fecha_semana');
      if (error) throw error;
      
      // Filtramos para que no se repitan las fechas y las ordenamos de la más reciente a la más antigua
      const fechasUnicas = Array.from(new Set(data.map(d => d.fecha_semana))).sort((a, b) => b.localeCompare(a));
      return NextResponse.json({ success: true, data: fechasUnicas });
    }
  } catch (error) {
    console.error("Error en API de programas:", error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}