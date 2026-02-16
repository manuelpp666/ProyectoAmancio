"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Plus, BarChart3, Search, MoreVertical, Loader2, Users, FileText, Edit2, Trash2, Eye } from "lucide-react";
import ModalCrearTarea from "@/src/components/Tarea/ModalCrearTarea";
import { ConfirmModal } from "@/src/components/utils/ConfirmModal";
import { toast } from "sonner";
import ModalVerEntregas from "@/src/components/Tarea/ModalVerEntregas";

export default function DetalleCursoDocente() {
  const params = useParams();
  const searchParams = useSearchParams();

  const [datos, setDatos] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bimestre, setBimestre] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("notas"); // Estado para pestañas

  const [showModal, setShowModal] = useState(false);
  const idCarga = params.id;
  const anio = searchParams.get("anio");

  const [tareaAEditar, setTareaAEditar] = useState<any>(null);
  const [tareaVerEntregas, setTareaVerEntregas] = useState<any>(null);
  // ESTADOS PARA EL MODAL DE CONFIRMACIÓN
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [tareaAEliminar, setTareaAEliminar] = useState<any>(null);

  const [editandoNotas, setEditandoNotas] = useState(false);
  const [notasTemporales, setNotasTemporales] = useState<any>({}); // { "id_alumno_id_tarea": valor }


  // Función para capturar el cambio en los inputs
  const handleNotaChange = (idAlumno: number, idTarea: number, valor: string) => {
    setNotasTemporales({
      ...notasTemporales,
      [`${idAlumno}_${idTarea}`]: valor
    });
  };

  // Función para guardar en el Backend
  const guardarNotas = async (idTarea: number) => {
    const notasParaEnviar: any = {};

    // Filtramos solo las notas que pertenecen a esta tarea específica
    Object.keys(notasTemporales).forEach(key => {
      const [alId, tarId] = key.split("_");
      if (Number(tarId) === idTarea) {
        notasParaEnviar[alId] = Number(notasTemporales[key]);
      }
    });

    if (Object.keys(notasParaEnviar).length === 0) {
      setEditandoNotas(false);
      return;
    }

    const toastId = toast.loading("Publicando notas...");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/virtual/guardar-notas-masivo/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_tarea: idTarea,
          notas: notasParaEnviar
        })
      });

      if (!res.ok) throw new Error("Error al guardar");

      toast.success("Notas publicadas con éxito", { id: toastId });
      setEditandoNotas(false);
      fetchSabana(); // Recargar tabla
    } catch (error) {
      toast.error("No se pudieron guardar las notas", { id: toastId });
    }
  };

  const fetchSabana = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/virtual/sabana-notas/${idCarga}/${bimestre}`);
      const data = await res.json();
      setDatos(data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idCarga) fetchSabana();
  }, [idCarga, bimestre]);

  // Función para borrar tarea
  const handleDeleteTarea = async (tarea: any) => {
    // Verificamos en el front antes de intentar
    if (tarea.total_entregas > 0) {
      toast.error("No se puede eliminar: Ya hay alumnos que subieron archivos.");
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar "${tarea.titulo}"?`)) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/virtual/tareas/${tarea.id_tarea}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Error al eliminar");
      }

      toast.success("Tarea eliminada correctamente");
      fetchSabana();
    } catch (error: any) {
      toast.error(error.message);
    }
  };
  // 1. Esta función se llama al hacer clic en el icono de basurero
  const openDeleteConfirm = (tarea: any) => {
    // Verificación de seguridad (Archivos existentes)
    if (tarea.total_entregas > 0) {
      toast.error("No se puede eliminar: Ya hay alumnos que subieron archivos.");
      return;
    }

    // Si pasa la validación, guardamos la tarea en el estado y abrimos el modal
    setTareaAEliminar(tarea);
    setIsConfirmOpen(true);
  };

  // 2. Esta función es la que realmente hace el fetch (se pasa al onConfirm del modal)
  const executeDelete = async () => {
    if (!tareaAEliminar) return;

    const toastId = toast.loading("Eliminando tarea...");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/virtual/tareas/${tareaAEliminar.id_tarea}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Error al eliminar");
      }

      toast.success("Tarea eliminada correctamente", { id: toastId });
      fetchSabana(); // Recargar datos
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setTareaAEliminar(null); // Limpiamos el estado
    }
  };


  const alumnosFiltrados = datos?.alumnos_notas.filter((a: any) =>
    a.nombres_completos.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !datos) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-[#701C32]" size={48} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10 px-4">

      {/* --- CABECERA --- (Mantiene tu diseño) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Sección {idCarga}</span>
            <span className="text-gray-400 text-xs flex items-center gap-1"><Users size={14} /> {datos?.alumnos_notas.length} Alumnos</span>
          </div>
          <h1 className="text-3xl font-bold text-[#701C32]">Gestión de Curso</h1>
          <p className="text-gray-500 text-sm">Año Académico {anio} • Bimestre {bimestre}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-[#701C32] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#8a223d] transition shadow-md">
            <Plus size={18} /> Crear Nuevo
          </button>
        </div>
      </div>

      {/* --- TABS FUNCIONALES --- */}
      <div className="border-b border-gray-200 flex gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("notas")}
          className={`pb-3 text-sm font-bold transition-colors ${activeTab === "notas" ? "border-b-2 border-[#701C32] text-[#701C32]" : "text-gray-500 hover:text-gray-700"}`}
        >
          Registro de Notas
        </button>
        <button
          onClick={() => setActiveTab("tareas")}
          className={`pb-3 text-sm font-bold transition-colors ${activeTab === "tareas" ? "border-b-2 border-[#701C32] text-[#701C32]" : "text-gray-500 hover:text-gray-700"}`}
        >
          Gestionar Tareas ({datos?.evaluaciones.length})
        </button>
      </div>

      {activeTab === "notas" ? (
        /* --- VISTA: TABLA DE NOTAS --- */
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 gap-4">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar alumno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#701C32]"
              />
            </div>
            <select
              value={bimestre}
              onChange={(e) => setBimestre(Number(e.target.value))}
              className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg p-2 font-bold outline-none"
            >
              {[1, 2, 3, 4].map(b => <option key={b} value={b}>{b} Bimestre</option>)}
            </select>

            <div className="flex gap-2">
              {!editandoNotas ? (
                <button
                  onClick={() => setEditandoNotas(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                >
                  <Edit2 size={16} /> Calificar Actividades
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setEditandoNotas(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    Cancelar
                  </button>
                  {/* Aquí puedes poner un botón que guarde por cada tarea o uno general */}
                  {datos?.evaluaciones.map((ev: any) => (
                    <button
                      key={ev.id_tarea}
                      onClick={() => guardarNotas(ev.id_tarea)}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition"
                    >
                      Publicar {ev.titulo}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 w-10">#</th>
                  <th className="px-6 py-4 min-w-[250px]">Apellidos y Nombres</th>
                  {datos?.evaluaciones.map((evalu: any) => (
                    <th key={evalu.id_tarea} className="px-4 py-4 text-center w-24 border-x border-gray-100">
    <div className="text-blue-800 font-bold">{evalu.titulo}</div>
    <div className="text-[10px] text-gray-400 font-normal">{evalu.peso}% del total</div>
  </th>
                  ))}
                  <th className="px-6 py-4 text-center w-24 font-bold text-gray-900 bg-gray-50">Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alumnosFiltrados?.map((alumno: any, index: number) => (
                  <tr key={alumno.id_alumno} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">{index + 1}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">{alumno.nombres_completos}</td>
                    {datos?.evaluaciones.map((evalu: any) => (
                      <td key={evalu.id_tarea} className="px-4 py-4 text-center">
                        {editandoNotas ? (
                          <input
                            type="number"
                            min="0"
                            max="20"
                            className="w-12 text-center border border-blue-300 rounded p-1 focus:ring-2 ring-[#701C32] outline-none"
                            defaultValue={alumno.notas[evalu.id_tarea] ?? ""}
                            onChange={(e) => handleNotaChange(alumno.id_alumno, evalu.id_tarea, e.target.value)}
                          />
                        ) : (
                          <span className={`px-2 py-1 rounded font-mono ${alumno.notas[evalu.id_tarea] < 11 ? 'bg-red-50 text-red-600' : 'bg-gray-100'}`}>
                            {alumno.notas[evalu.id_tarea] ?? '-'}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center font-bold text-[#701C32] bg-gray-50/30">
                      {alumno.promedio.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* --- VISTA: GESTIÓN DE TAREAS (Cards) --- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {datos?.evaluaciones.map((tarea: any) => (
            <div key={tarea.id_tarea} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-red-50 p-3 rounded-xl text-[#701C32]">
                  <FileText size={24} />
                </div>
                <div className="flex gap-1">
                  <div className="bg-red-50 p-3 rounded-xl text-[#701C32] relative">
      <FileText size={24} />
      {/* Badge de peso */}
      <span className="absolute -top-2 -right-2 bg-[#701C32] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
        {tarea.peso}%
      </span>
    </div>
                  <button
                    onClick={() => {
                      setTareaAEditar(tarea);
                      setShowModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(tarea)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-gray-800 mb-1">{tarea.titulo}</h3>
              <p className="text-xs text-gray-500 mb-4 uppercase font-semibold">{tarea.tipo.replace('_', ' ')}</p>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Entregas:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${tarea.total_entregas > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                    {tarea.total_entregas} / {datos?.alumnos_notas.length} Alumnos
                  </span>
                </div>
                <button
                  onClick={() => setTareaVerEntregas(tarea)} // <--- AGREGAR ESTO
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition"
                >
                  <Eye size={14} /> Ver archivos enviados ({tarea.total_entregas})
                </button>
              </div>
            </div>
          ))}

          {/* Card para crear rápida */}
          <button
            onClick={() => setShowModal(true)}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center text-gray-400 hover:border-[#701C32] hover:text-[#701C32] transition-all bg-gray-50/50 group"
          >
            <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm">Añadir nueva actividad</span>
          </button>
        </div>
      )}

      {showModal && (
        <ModalCrearTarea
          idCarga={Number(idCarga)}
          bimestre={bimestre}
          tareaExistente={tareaAEditar} // Pasa la tarea si vas a editar
          onClose={() => {
            setShowModal(false);
            setTareaAEditar(null); // Limpiar al cerrar
          }}
          onRefresh={fetchSabana}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setTareaAEliminar(null);
        }}
        onConfirm={executeDelete}
        title="¿Eliminar Actividad?"
        message={`¿Estás seguro de que deseas eliminar "${tareaAEliminar?.titulo}"? Esta acción no se puede deshacer y borrará todas las notas asociadas.`}
        confirmText="Sí, eliminar tarea"
        type="danger"
      />
      {tareaVerEntregas && (
        <ModalVerEntregas
          tarea={tareaVerEntregas}
          onClose={() => setTareaVerEntregas(null)}
        />
      )}
    </div>
  );
}