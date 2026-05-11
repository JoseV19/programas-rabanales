import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { programa, fecha } = await request.json();

    if (!programa || programa.length === 0) {
      return NextResponse.json({ error: 'No hay programa para guardar' }, { status: 400 });
    }

    // 1. Borramos si ya existía un programa para esta fecha para no duplicar
    await supabase.from('asignaciones').delete().eq('fecha_semana', fecha);

    // 2. TRADUCTOR: Solo enviamos las columnas que existen en tu base de datos (puros IDs y textos básicos)
    const programaParaGuardar = programa.map((p: any) => ({
      fecha_semana: p.fecha_semana,
      seccion: p.seccion,
      tipo_asignacion: p.tipo_asignacion,
      usuario_principal_id: p.usuario_principal_id,
      usuario_ayudante_id: p.usuario_ayudante_id || null // Si no hay ayudante, mandamos un valor nulo vacío
    }));

    // 3. Insertamos los datos limpios
    const { error } = await supabase.from('asignaciones').insert(programaParaGuardar);

    if (error) {
      console.error("Error de Supabase al guardar:", error);
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Programa guardado exitosamente' });
    
  } catch (error) {
    console.error("Error en la API de guardar:", error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}