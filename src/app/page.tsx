'use client';
import { useState } from 'react';

export default function Dashboard() {
  // --- ESTADOS DE NAVEGACIÓN ---
  const [tab, setTab] = useState<'generador' | 'historial'>('generador');
  
  // --- ESTADOS DEL GENERADOR ---
  const [fecha, setFecha] = useState('');
  const [programa, setPrograma] = useState<any[]>([]);
  const [usuariosLista, setUsuariosLista] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Estados para la edición manual
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>(null);

  // --- ESTADOS DEL HISTORIAL ---
  const [fechasGuardadas, setFechasGuardadas] = useState<string[]>([]);
  const [programaHistorial, setProgramaHistorial] = useState<any[]>([]);
  const [fechaSeleccionadaHistorial, setFechaSeleccionadaHistorial] = useState<string | null>(null);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // --- LÓGICA DEL GENERADOR ---
  const handleGenerar = async (esAleatorio = false) => {
    if (!fecha) return alert("Selecciona una fecha primero.");
    setLoading(true);
    try {
      const res = await fetch('/api/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, aleatorio: esAleatorio })
      });
      const resData = await res.json();

      if (resData.usuarios) setUsuariosLista(resData.usuarios);

      if (resData.success && resData.data.length > 0) {
        setPrograma(resData.data);
      } else {
        alert("No se encontraron suficientes hermanos para llenar el programa.");
        setPrograma([]);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión al generar.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    if (programa.length === 0) return;
    setGuardando(true);
    try {
      const res = await fetch('/api/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programa, fecha })
      });
      const resData = await res.json();
      if (resData.success) {
        alert("¡Programa guardado exitosamente!");
      } else {
        alert("Hubo un error al guardar.");
      }
    } catch (error) {
      alert("Error de conexión al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  // --- LÓGICA DE EDICIÓN ---
  const iniciarEdicion = (index: number, parte: any) => {
    setEditIndex(index);
    setEditValues({ ...parte });
  };

  const cancelarEdicion = () => {
    setEditIndex(null);
    setEditValues(null);
  };

  const guardarEdicion = (index: number) => {
    const nuevoPrograma = [...programa];
    nuevoPrograma[index] = editValues;
    setPrograma(nuevoPrograma);
    setEditIndex(null);
  };

  const convertirADiscurso = () => {
    setEditValues({
      ...editValues,
      tipo_asignacion: 'DISCURSO',
      nombre_ayudante: null,
      usuario_ayudante_id: null
    });
  };

  // --- LÓGICA DEL HISTORIAL ---
  const cargarFechas = async () => {
    setTab('historial');
    setFechaSeleccionadaHistorial(null);
    setProgramaHistorial([]);
    try {
      const res = await fetch('/api/programas');
      const data = await res.json();
      if (data.success) setFechasGuardadas(data.data);
    } catch (error) {
      console.error("Error cargando historial de fechas", error);
    }
  };

  const cargarProgramaGuardado = async (fechaSelec: string) => {
    setFechaSeleccionadaHistorial(fechaSelec);
    setLoadingHistorial(true);
    try {
      const res = await fetch(`/api/programas?fecha=${fechaSelec}`);
      const data = await res.json();
      if (data.success) setProgramaHistorial(data.data);
    } catch (error) {
      console.error("Error cargando programa específico", error);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // --- LÓGICA DE EXPORTACIÓN A WORD ---
  const handleDescargarWord = async (programaData: any[], fechaDoc: string) => {
    try {
      const res = await fetch('/api/exportar/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programa: programaData, fecha: fechaDoc })
      });

      if (!res.ok) throw new Error("Error al generar el Word");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Programa_${fechaDoc}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Hubo un error al descargar el archivo Word. Revisa que tu plantilla exista en la carpeta public.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-10 font-sans max-w-5xl mx-auto">
      
      {/* CABECERA Y PESTAÑAS */}
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4 mb-8">
        <h1 className="text-2xl font-light tracking-widest uppercase text-white">
          Programas <span className="text-emerald-500 font-bold">Rabanales</span>
        </h1>
        <div className="flex gap-6 text-sm tracking-widest uppercase font-bold">
          <button 
            onClick={() => setTab('generador')} 
            className={`transition-all ${tab === 'generador' ? 'text-white border-b-2 border-white pb-1' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            Generador
          </button>
          <button 
            onClick={cargarFechas} 
            className={`transition-all ${tab === 'historial' ? 'text-white border-b-2 border-white pb-1' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            Historial
          </button>
        </div>
      </div>

      {/* --- VISTA: GENERADOR --- */}
      {tab === 'generador' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-wrap items-end gap-4 mb-10 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 shadow-xl">
            <div className="flex flex-col">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-bold">Semana</label>
              <input 
                type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} 
                className="bg-black border border-zinc-700 p-3 rounded-lg outline-none focus:border-zinc-400 text-white color-scheme-dark" 
              />
            </div>
            <button 
              onClick={() => handleGenerar(false)} disabled={loading}
              className="bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-zinc-200 transition-all disabled:opacity-50"
            >
              {loading ? 'GENERANDO...' : 'GENERAR PROGRAMA'}
            </button>
            
            {programa.length > 0 && (
              <div className="flex gap-3 ml-auto">
                <button 
                  onClick={() => handleGenerar(true)} disabled={loading}
                  className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-6 py-3 rounded-lg font-bold hover:bg-zinc-700 transition-all flex items-center gap-2"
                >
                  🔄 RE-ALEATORIZAR
                </button>
                <button 
                  onClick={() => handleDescargarWord(programa, fecha)} 
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-500 transition-all flex items-center gap-2"
                >
                  📄 WORD
                </button>
                <button 
                  onClick={handleGuardar} disabled={guardando}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-500 transition-all disabled:opacity-50"
                >
                  {guardando ? 'GUARDANDO...' : 'GUARDAR PROGRAMA'}
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {programa.length > 0 ? (
              programa.map((p: any, i) => (
                <div key={i}>
                  {editIndex === i ? (
                    /* MODO EDICIÓN MANUAL */
                    <div className="p-5 bg-zinc-800/40 border border-zinc-600 rounded-xl flex flex-col gap-3 shadow-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Modo Edición Manual</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase tracking-widest text-zinc-500">Asignación</label>
                          <input 
                            value={editValues.tipo_asignacion} 
                            onChange={e => setEditValues({...editValues, tipo_asignacion: e.target.value})}
                            className="bg-black border border-zinc-700 p-2 text-sm rounded outline-none focus:border-zinc-400 text-white"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase tracking-widest text-zinc-500">Asignado a:</label>
                          <select 
                            value={editValues.usuario_principal_id} 
                            onChange={e => {
                              const hermanoSeleccionado = usuariosLista.find(u => u.id === e.target.value);
                              if(hermanoSeleccionado) setEditValues({...editValues, usuario_principal_id: hermanoSeleccionado.id, nombre_principal: hermanoSeleccionado.nombre});
                            }}
                            className="bg-black border border-zinc-700 p-2 text-sm rounded outline-none focus:border-zinc-400 text-white"
                          >
                            {usuariosLista.map(u => (
                              <option key={u.id} value={u.id}>
                                {u.nombre} (Mes: {u.veces_mes} {editValues.seccion === 'SEAMOS MEJORES MAESTROS' ? `| Enc: ${u.m_p} Aux: ${u.m_a}` : ''})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase tracking-widest text-zinc-500">Ayudante (Opcional):</label>
                          <select 
                            value={editValues.usuario_ayudante_id || ''} 
                            onChange={e => {
                              if (e.target.value === "") setEditValues({...editValues, usuario_ayudante_id: null, nombre_ayudante: null});
                              else {
                                const ayudanteSeleccionado = usuariosLista.find(u => u.id === e.target.value);
                                setEditValues({...editValues, usuario_ayudante_id: ayudanteSeleccionado.id, nombre_ayudante: ayudanteSeleccionado.nombre});
                              }
                            }}
                            className="bg-black border border-zinc-700 p-2 text-sm rounded outline-none focus:border-zinc-400 text-white"
                          >
                            <option value="">-- Sin Ayudante --</option>
                            {usuariosLista.map(u => (
                              <option key={`ayu-${u.id}`} value={u.id}>
                                {u.nombre} (Mes: {u.veces_mes} {editValues.seccion === 'SEAMOS MEJORES MAESTROS' ? `| Enc: ${u.m_p} Aux: ${u.m_a}` : ''})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-700">
                        <button onClick={convertirADiscurso} className="text-xs bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded font-medium text-zinc-200 transition-all">Convertir en Discurso</button>
                        <div className="ml-auto flex gap-2">
                          <button onClick={cancelarEdicion} className="text-xs border border-zinc-600 hover:bg-zinc-800 px-4 py-2 rounded font-medium text-zinc-300 transition-all">Cancelar</button>
                          <button onClick={() => guardarEdicion(i)} className="text-xs bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded font-bold transition-all">Confirmar</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* VISTA NORMAL DE ASIGNACIÓN */
                    <div className="p-5 bg-zinc-900/30 border border-zinc-800 rounded-xl hover:border-zinc-600 transition-all flex justify-between items-center group shadow-md">
                      <div>
                        <p className="text-[10px] text-emerald-500 uppercase tracking-widest mb-1 font-bold">{p.seccion} • {p.tipo_asignacion}</p>
                        <p className="text-lg font-medium text-zinc-100">{p.nombre_principal}</p>
                        {p.nombre_ayudante && <p className="text-sm text-zinc-400 mt-1"><span className="text-zinc-600">Ayudante:</span> {p.nombre_ayudante}</p>}
                      </div>
                      <button onClick={() => iniciarEdicion(i, p)} className="opacity-0 group-hover:opacity-100 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold transition-all">EDITAR</button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
                <p className="text-zinc-600 italic">Selecciona una fecha y presiona generar para comenzar.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- VISTA: HISTORIAL --- */}
      {tab === 'historial' && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col md:flex-row gap-8 items-start">
          {/* Lista de Fechas */}
          <div className="w-full md:w-1/3 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 shadow-xl">
            <h2 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4 font-bold">Semanas Guardadas</h2>
            {fechasGuardadas.length > 0 ? (
              <div className="flex flex-col gap-2">
                {fechasGuardadas.map((f, i) => (
                  <button 
                    key={i} 
                    onClick={() => cargarProgramaGuardado(f)} 
                    className={`text-left p-3 rounded-lg transition-all text-sm font-medium tracking-wide ${fechaSeleccionadaHistorial === f ? 'bg-emerald-600 text-white' : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700'}`}
                  >
                    Semana del {f}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-zinc-600 text-sm italic">No hay programas guardados aún.</p>
            )}
          </div>

          {/* Vista del Programa Guardado */}
          <div className="w-full md:w-2/3">
            {loadingHistorial ? (
              <div className="text-center py-20 text-emerald-500 animate-pulse font-bold tracking-widest uppercase">Cargando programa...</div>
            ) : fechaSeleccionadaHistorial && programaHistorial.length > 0 ? (
              <div className="grid gap-3 animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                  <h2 className="text-xl font-light">
                    Programa de la Semana: <span className="font-bold text-emerald-500">{fechaSeleccionadaHistorial}</span>
                  </h2>
                  <button 
                    onClick={() => handleDescargarWord(programaHistorial, fechaSeleccionadaHistorial)} 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-500 transition-all flex items-center gap-2"
                  >
                    📄 EXPORTAR WORD
                  </button>
                </div>
                {programaHistorial.map((p: any, i) => (
                  <div key={i} className="p-4 bg-black/40 border border-zinc-800/50 rounded-lg flex flex-col gap-1 shadow-inner">
                     <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{p.seccion} • {p.tipo_asignacion}</p>
                     <p className="text-base font-medium text-zinc-200">{p.nombre_principal}</p>
                     {p.nombre_ayudante && <p className="text-xs text-zinc-400"><span className="text-zinc-600">Ayudante:</span> {p.nombre_ayudante}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl w-full flex items-center justify-center">
                <p className="text-zinc-600 italic">Selecciona una fecha de la izquierda para ver el programa.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}