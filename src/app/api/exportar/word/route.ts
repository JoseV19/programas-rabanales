import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { programa, fecha } = body;

    // 1. Buscamos tu plantilla en la carpeta 'public'
    const templatePath = path.join(process.cwd(), 'public', 'plantilla_S140.docx');
    
    if (!fs.existsSync(templatePath)) {
       return NextResponse.json({ error: 'Plantilla no encontrada. Asegúrate de tener plantilla_S140.docx en public.' }, { status: 404 });
    }
    
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    // 2. Preparamos el diccionario vacío
    const datos: Record<string, string> = {
        fecha: fecha,
        presidente: "", oracion_inicial: "",
        tesoros_1: "", tesoros_2: "", lectura: "",
        smm_1_est: "", smm_1_ayu: "",
        smm_2_est: "", smm_2_ayu: "",
        smm_3_est: "", smm_3_ayu: "",
        vc_1: "", vc_estudio_cond: "", vc_estudio_lect: "",
        oracion_final: ""
    };

    // 3. Traducimos tu programa en pantalla a las variables del Word
    programa.forEach((p: any) => {
        if (p.tipo_asignacion === 'PRESIDENCIA') datos.presidente = p.nombre_principal;
        if (p.tipo_asignacion === 'ORACIÓN INICIAL') datos.oracion_inicial = p.nombre_principal;
        if (p.tipo_asignacion === 'TESOROS DE LA BIBLIA') datos.tesoros_1 = p.nombre_principal;
        if (p.tipo_asignacion === 'PERLAS ESCONDIDAS') datos.tesoros_2 = p.nombre_principal;
        if (p.tipo_asignacion === 'LECTURA DE LA BIBLIA') datos.lectura = p.nombre_principal;
        
        if (p.tipo_asignacion === 'PRESENTACIÓN 1') { datos.smm_1_est = p.nombre_principal; datos.smm_1_ayu = p.nombre_ayudante || ''; }
        if (p.tipo_asignacion === 'PRESENTACIÓN 2') { datos.smm_2_est = p.nombre_principal; datos.smm_2_ayu = p.nombre_ayudante || ''; }
        if (p.tipo_asignacion === 'PRESENTACIÓN 3' || p.tipo_asignacion === 'DISCURSO') { datos.smm_3_est = p.nombre_principal; datos.smm_3_ayu = p.nombre_ayudante || ''; }
        
        if (p.tipo_asignacion === 'PARTE 1') datos.vc_1 = p.nombre_principal;
        if (p.tipo_asignacion === 'ESTUDIO BÍBLICO (CONDUCTOR)') datos.vc_estudio_cond = p.nombre_principal;
        if (p.tipo_asignacion === 'ESTUDIO BÍBLICO (LECTOR)') datos.vc_estudio_lect = p.nombre_principal;
        if (p.tipo_asignacion === 'ORACIÓN FINAL') datos.oracion_final = p.nombre_principal;
    });

    // 4. Inyectamos los datos
    doc.render(datos);
    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: "DEFLATE" });

    // 5. Descargamos el archivo
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="Programa_${fecha}.docx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });

  } catch (error) {
    console.error('Error generando Word:', error);
    return NextResponse.json({ error: 'Error interno al generar el documento' }, { status: 500 });
  }
}