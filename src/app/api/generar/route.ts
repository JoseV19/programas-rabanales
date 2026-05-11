import { NextResponse } from 'next/server';
import { generarSemana } from '@/services/generadorPrograma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fecha = body.fecha;
    const esAleatorio = body.aleatorio || false;

    const resultado = await generarSemana(fecha, esAleatorio);
    
    if (resultado.programa.length === 0) {
      // Ahora enviamos los usuarios incluso si el programa está vacío
      return NextResponse.json({ success: true, data: [], usuarios: resultado.usuarios });
    }

    // ¡Aquí está el truco! Agregamos "usuarios: resultado.usuarios" a la respuesta
    return NextResponse.json({ success: true, data: resultado.programa, usuarios: resultado.usuarios });
    
  } catch (error) {
    console.error("Error en la API de generar:", error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}