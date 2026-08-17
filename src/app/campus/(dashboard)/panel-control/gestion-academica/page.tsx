"use client";
import { useEffect, useState } from "react";
import { Nivel, Seccion, AnioEscolar, Grado, Bimestre } from "@/src/interfaces/academic";
import GradoCard from "@/src/components/Academic/GradoCard";
import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";
import { toast } from "sonner";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";
import { apiFetch } from "@/src/lib/api";
import { RoleGuard } from '@/src/components/auth/RoleGuard';
import { ConfirmModal } from "@/src/components/utils/ConfirmModal";
import { CampoNumero, leerNumero, aNumero } from "@/src/components/utils/numero";

export default function GestionAcademicaPage() {

  const {
    anioPlanificacion: anioSeleccionado,
    setAnioPlanificacion: setAnioSeleccionado,
    anioObj,
    listaAnios: anios,
    loadingAnios,
    refreshAnios
  } = useAnioAcademico();
  
  // --- ESTADOS GLOBALES ---
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- MODAL CREAR AÑO (NUEVO) ---
  const [isCrearAnioModalOpen, setIsCrearAnioModalOpen] = useState(false);
  const [nuevoAnioData, setNuevoAnioData] = useState({
    id_anio_escolar: "",
    fecha_inicio: "",
    fecha_fin: "",
    tipo: "REGULAR"
  });

  // --- MODAL EDITAR AÑO (MODIFICADO) ---
  const [isEditarAnioModalOpen, setIsEditarAnioModalOpen] = useState(false);
  const [editarAnioData, setEditarAnioData] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    tipo: "REGULAR"
  });

  // --- MODAL INSCRIPCIONES ---
  const [isInscripcionModalOpen, setIsInscripcionModalOpen] = useState(false);
  const [inscripcionData, setInscripcionData] = useState({
    inicio_inscripcion: "",
    fin_inscripcion: ""
  });

  // --- BIMESTRES (calendario de conducta) ---
  // ROMANOS_BIMESTRE: rótulo de cada fila; el índice del array es numero-1.
  const ROMANOS_BIMESTRE = ["I", "II", "III", "IV"];
  const bimestresVacios = (): Bimestre[] => [1, 2, 3, 4].map((n) => ({ numero: n, fecha_inicio: "", fecha_fin: "" }));
  const [bimestres, setBimestres] = useState<Bimestre[]>(bimestresVacios());
  // Si el backend los devolvió como "propuesta" (todavía no confirmados por el colegio).
  const [bimestresAproximados, setBimestresAproximados] = useState(false);
  const [cargandoBimestres, setCargandoBimestres] = useState(false);
  const [guardandoBimestres, setGuardandoBimestres] = useState(false);

  // --- MODAL SECCIÓN ---
  const [isSeccionModalOpen, setIsSeccionModalOpen] = useState(false);
  const [selectedGradoId, setSelectedGradoId] = useState<number | null>(null);
  const [seccionEnEdicion, setSeccionEnEdicion] = useState<Seccion | null>(null);
  // vacantes admite la cadena vacía para poder borrar el campo mientras se
  // escribe; al guardar se valida que quede un número.
  const [nuevaSeccion, setNuevaSeccion] = useState({ nombre: "", vacantes: 30 as CampoNumero });


  // --- CIERRE / EVALUACIÓN ---
  const [notaMinima, setNotaMinima] = useState("11");
  const [guardandoNota, setGuardandoNota] = useState(false);

  useEffect(() => {
    const cargarNotaMinima = async () => {
      try {
        const res = await apiFetch(`/configuracion/academico`);
        if (res.ok) {
          const data = await res.json();
          const fila = Array.isArray(data) ? data.find((d: any) => d.clave === "nota_minima_aprobatoria") : null;
          if (fila?.valor) setNotaMinima(String(fila.valor));
        }
      } catch { /* usa el default 11 */ }
    };
    cargarNotaMinima();
  }, []);

  const handleGuardarNota = async () => {
    // El campo se puede dejar en blanco mientras se escribe, pero no guardarse
    // así: una nota mínima vacía dejaría al colegio sin criterio de aprobación.
    const nota = Number(notaMinima);
    if (notaMinima.trim() === "" || Number.isNaN(nota) || nota < 1 || nota > 20) {
      toast.error("La nota mínima debe ser un número entre 1 y 20");
      return;
    }
    setGuardandoNota(true);
    try {
      const res = await apiFetch(`/configuracion/nota_minima_aprobatoria?seccion=academico`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: String(notaMinima) })
      });
      if (res.ok) toast.success("Nota mínima aprobatoria actualizada");
      else toast.error("No se pudo guardar la nota mínima");
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardandoNota(false);
    }
  };


  // --- ACORDEÓN DE NIVELES (colapsar/expandir) ---
  const [nivelesColapsados, setNivelesColapsados] = useState<Set<number>>(new Set());
  const toggleNivel = (idNivel: number) => {
    setNivelesColapsados(prev => {
      const next = new Set(prev);
      if (next.has(idNivel)) next.delete(idNivel); else next.add(idNivel);
      return next;
    });
  };

  // Formatea "2026-03-01" -> "01 mar 2026"
  const formatearFecha = (iso?: string) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    if (!y || !m || !d) return iso;
    return `${d} ${meses[parseInt(m, 10) - 1] || ""} ${y}`;
  };

  // Validaciones
  const fechasCrearValidas = nuevoAnioData.fecha_inicio && nuevoAnioData.fecha_fin
    ? new Date(nuevoAnioData.fecha_fin) > new Date(nuevoAnioData.fecha_inicio) : false;

  const fechasEditarValidas = editarAnioData.fecha_inicio && editarAnioData.fecha_fin
    ? new Date(editarAnioData.fecha_fin) > new Date(editarAnioData.fecha_inicio) : false;

  const fechasInscripcionValidas = inscripcionData.inicio_inscripcion && inscripcionData.fin_inscripcion
    ? new Date(inscripcionData.fin_inscripcion) > new Date(inscripcionData.inicio_inscripcion) : false;

  // =========================================================
  // 1. CARGA DE DATOS
  // =========================================================
  const fetchDatosMaestros = async () => {
    try {
      setIsLoading(true);
      const [resNiveles, resGrados] = await Promise.all([
        apiFetch(`/academic/niveles/`),
        apiFetch(`/academic/grados/`)
      ]);
      setNiveles(await resNiveles.json());
      setGrados(await resGrados.json());
    } catch (error) { toast.error("Error de conexión"); } finally { setIsLoading(false); }
  };

  const fetchSeccionesDelAnio = async (idAnio: string) => {
    try {
      const res = await apiFetch(`/academic/secciones/?anio_id=${idAnio}`);
      if (res.ok) setSecciones(await res.json());
    } catch (error) { console.error(error); }
  };

  const fetchBimestresDelAnio = async (idAnio: string) => {
    try {
      setCargandoBimestres(true);
      const res = await apiFetch(`/academic/bimestres/${idAnio}`);
      if (res.ok) {
        const data = await res.json();
        setBimestres(data.bimestres);
        setBimestresAproximados(!data.guardado);
      } else {
        // Año sin periodo de clases válido u otro error: se deja el
        // formulario vacío para que no muestre fechas incorrectas.
        setBimestres(bimestresVacios());
        setBimestresAproximados(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoBimestres(false);
    }
  };

  useEffect(() => {
    fetchDatosMaestros();
  }, []);

  useEffect(() => {
    if (anioSeleccionado) {
      fetchSeccionesDelAnio(anioSeleccionado);
      fetchBimestresDelAnio(anioSeleccionado);
      if (anioObj) {
        setInscripcionData({
          inicio_inscripcion: anioObj.inicio_inscripcion || "",
          fin_inscripcion: anioObj.fin_inscripcion || ""
        });
        setEditarAnioData({
          fecha_inicio: anioObj.fecha_inicio || "",
          fecha_fin: anioObj.fecha_fin || "",
          tipo: anioObj.tipo || "REGULAR"
        });
      }
    } else {
      setSecciones([]);
      setBimestres(bimestresVacios());
      setBimestresAproximados(false);
    }
  }, [anioSeleccionado, anioObj]);

  // =========================================================
  // 2. LÓGICA DE FILTROS
  // =========================================================
  const isAnioSinComenzar = () => {
    if (!anioObj) return false;
    const hoy = new Date();
    const fechaInicio = new Date(anioObj.fecha_inicio);
    return hoy < fechaInicio;
  };

  // ¿Las inscripciones del año seleccionado están abiertas hoy?
  const inscripcionesAbiertas = () => {
    if (!anioObj?.inicio_inscripcion || !anioObj?.fin_inscripcion) return false;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(anioObj.inicio_inscripcion);
    const fin = new Date(anioObj.fin_inscripcion);
    return hoy >= inicio && hoy <= fin;
  };

  // Días que faltan para que cierren las inscripciones (incluye hoy)
  const diasRestantesInscripcion = () => {
    if (!anioObj?.fin_inscripcion) return 0;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const fin = new Date(anioObj.fin_inscripcion); fin.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((fin.getTime() - hoy.getTime()) / 86400000) + 1);
  };

  // Grupos de Verano para Primaria (1-2, 3-4, 5-6)
  const GRUPOS_VERANO_PRIMARIA = [
    {
      clave: "PRIM_1_2",
      nombre: "1ro y 2do de Primaria",
      subtitulo: "1ero y 2do Grado juntos",
      id_grado: 1,
      grados_ids: [1, 2],
      orden: 1,
      gradosEsperados: [
        { id_grado: 1, nombre: "1º Primaria", etiqueta: "1º" },
        { id_grado: 2, nombre: "2º Primaria", etiqueta: "2º" }
      ]
    },
    {
      clave: "PRIM_3_4",
      nombre: "3ro y 4to de Primaria",
      subtitulo: "3ero y 4to Grado juntos",
      id_grado: 3,
      grados_ids: [3, 4],
      orden: 2,
      gradosEsperados: [
        { id_grado: 3, nombre: "3º Primaria", etiqueta: "3º" },
        { id_grado: 4, nombre: "4º Primaria", etiqueta: "4º" }
      ]
    },
    {
      clave: "PRIM_5_6",
      nombre: "5to y 6to de Primaria",
      subtitulo: "5to y 6to Grado juntos",
      id_grado: 5,
      grados_ids: [5, 6],
      orden: 3,
      gradosEsperados: [
        { id_grado: 5, nombre: "5º Primaria", etiqueta: "5º" },
        { id_grado: 6, nombre: "6º Primaria", etiqueta: "6º" }
      ]
    },
  ];

  const GRADOS_ESPERADOS_PRE_ACADEMIA = [
    { id_grado: 10, nombre: "4º Secundaria", etiqueta: "4º" },
    { id_grado: 11, nombre: "5º Secundaria", etiqueta: "5º" }
  ];

  const getNivelesVisibles = () => {
    if (loadingAnios || !anioObj) return niveles;
    const esVerano = anioObj.tipo === "VERANO";
    return niveles.filter(n => {
      const nombre = n.nombre.toLowerCase();
      if (esVerano) return true;
      return !nombre.includes("pre") && !nombre.includes("academia");
    });
  };

  const getOpcionesSeccion = (gradoId: number) => {
    const grado = grados.find(g => g.id_grado === gradoId);
    if (!grado) return ["A", "B", "C", "Aula 1", "Aula 2"];
    const nivel = niveles.find(n => n.id_nivel === grado.id_nivel);
    const nombreNivel = nivel?.nombre.toLowerCase() || "";
    if (nombreNivel.includes("primaria")) return ["Azul", "Amarillo", "Rojo", "Verde", "Naranja", "A", "B", "C"];
    return ["A", "B", "C", "D", "E", "F", "Aula 1", "Aula 2", "Aula 3", "Aula Magna"];
  };

  // Totales para la tira de resumen
  const getResumen = () => {
    if (anioObj?.tipo === "VERANO") {
      const totalVacantes = secciones.reduce((acc, s) => acc + (s.vacantes ?? 0), 0);
      const totalOcupadas = secciones.reduce((acc, s) => acc + (s.ocupadas ?? 0), 0);
      return {
        niveles: 3, // Primaria, Secundaria, Pre Academia
        grados: 7,  // 3 grupos primaria + 3 grados secundaria + 1 pre academia
        secciones: secciones.length,
        vacantes: totalVacantes,
        ocupadas: totalOcupadas,
      };
    }
    const idsNivelesVisibles = new Set(getNivelesVisibles().map(n => n.id_nivel));
    const gradosVisibles = grados.filter(g => idsNivelesVisibles.has(g.id_nivel));
    const idsGradosVisibles = new Set(gradosVisibles.map(g => g.id_grado));
    const seccionesVisibles = secciones.filter(s => idsGradosVisibles.has(s.id_grado));
    const totalVacantes = seccionesVisibles.reduce((acc, s) => acc + (s.vacantes ?? 0), 0);
    const totalOcupadas = seccionesVisibles.reduce((acc, s) => acc + (s.ocupadas ?? 0), 0);
    return {
      niveles: idsNivelesVisibles.size,
      grados: gradosVisibles.length,
      secciones: seccionesVisibles.length,
      vacantes: totalVacantes,
      ocupadas: totalOcupadas,
    };
  };

  // =========================================================
  // 3. HANDLERS
  // =========================================================
  const handleCrearAnio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/academic/anios/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuevoAnioData }),
      });
      if (res.ok) {
        toast.success(`Año ${nuevoAnioData.id_anio_escolar} creado exitosamente`);
        setIsCrearAnioModalOpen(false);
        refreshAnios();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Error al crear el año");
      }
    } catch (error) { toast.error("Error de conexión"); }
  };

  const handleEditarAnio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anioSeleccionado) return;
    try {
      const res = await apiFetch(`/academic/anios/${anioSeleccionado}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editarAnioData)
      });
      if (res.ok) {
        toast.success("Fechas del año académico actualizadas");
        setIsEditarAnioModalOpen(false);
        refreshAnios();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Error al actualizar fechas");
      }
    } catch (error) { toast.error("Error de conexión"); }
  };

  const handleGuardarInscripcion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anioSeleccionado) return;
    try {
      const res = await apiFetch(`/academic/anios/${anioSeleccionado}/inscripciones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inscripcionData)
      });
      if (res.ok) {
        toast.success("Fechas de inscripción actualizadas");
        setIsInscripcionModalOpen(false);
        refreshAnios();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Error al guardar fechas");
      }
    } catch (error) { toast.error("Error de conexión"); }
  };

  // --- BIMESTRES ---
  const handleCambiarBimestre = (numero: number, campo: "fecha_inicio" | "fecha_fin", valor: string) => {
    setBimestres((prev) => prev.map((b) => (b.numero === numero ? { ...b, [campo]: valor } : b)));
  };

  /**
   * Valida en el cliente antes de mandar, para avisar rápido con un mensaje
   * claro. No reemplaza la validación del backend (que es la que de verdad
   * protege los datos): solo evita un viaje al servidor con algo obviamente
   * mal. El criterio de "no solaparse" replica al del backend: un bimestre
   * puede empezar el mismo día en que termina el anterior (se tocan), solo
   * está mal si empieza antes.
   */
  const validarBimestres = (): string | null => {
    const ordenados = [...bimestres].sort((a, b) => a.numero - b.numero);
    for (const b of ordenados) {
      if (!b.fecha_inicio || !b.fecha_fin) {
        return `Completa las dos fechas del bimestre ${ROMANOS_BIMESTRE[b.numero - 1]}.`;
      }
      if (b.fecha_inicio >= b.fecha_fin) {
        return `En el bimestre ${ROMANOS_BIMESTRE[b.numero - 1]}, la fecha de inicio debe ser anterior a la de fin.`;
      }
    }
    for (let i = 1; i < ordenados.length; i++) {
      const anterior = ordenados[i - 1];
      const actual = ordenados[i];
      if (actual.fecha_inicio < anterior.fecha_fin) {
        return `El bimestre ${ROMANOS_BIMESTRE[actual.numero - 1]} empieza antes de que termine el bimestre ${ROMANOS_BIMESTRE[anterior.numero - 1]}. Ajusta las fechas para que no se crucen.`;
      }
    }
    return null;
  };

  const handleGuardarBimestres = async () => {
    if (!anioSeleccionado) return;
    const error = validarBimestres();
    if (error) { toast.error(error); return; }

    setGuardandoBimestres(true);
    try {
      const res = await apiFetch(`/academic/bimestres/${anioSeleccionado}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bimestres }),
      });
      if (res.ok) {
        const data = await res.json();
        setBimestres(data.bimestres);
        setBimestresAproximados(!data.guardado);
        toast.success("Fechas de los bimestres guardadas correctamente");
      } else {
        const err = await res.json();
        toast.error(err.detail || "No se pudieron guardar los bimestres");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setGuardandoBimestres(false);
    }
  };

  // --- SECCIONES Y COPIAR ---
  const handleGuardarSeccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGradoId || !anioSeleccionado) return toast.error("Falta seleccionar año o grado");
    if (aNumero(nuevaSeccion.vacantes) <= 0) return toast.error("Indica cuántas vacantes tiene la sección");
    const esEdicion = !!seccionEnEdicion;
    const url = esEdicion ? `/academic/secciones/${seccionEnEdicion.id_seccion}` : `/academic/secciones/`;
    try {
      const response = await apiFetch(url, {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuevaSeccion, vacantes: aNumero(nuevaSeccion.vacantes), id_grado: selectedGradoId, id_anio_escolar: anioSeleccionado }),
      });
      if (response.ok) {
        toast.success("Sección guardada correctamente");
        setIsSeccionModalOpen(false);
        fetchSeccionesDelAnio(anioSeleccionado);
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "Error al guardar sección");
      }
    } catch (error) { toast.error("Error al guardar sección"); }
  };

  const [confirmSeccion, setConfirmSeccion] = useState<{ abierto: boolean; id: number }>({ abierto: false, id: 0 });

  const handleEliminarSeccion = (id: number) => {
    setConfirmSeccion({ abierto: true, id });
  };

  const ejecutarEliminarSeccion = async () => {
    try {
      const res = await apiFetch(`/academic/secciones/${confirmSeccion.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Sección eliminada correctamente"); fetchSeccionesDelAnio(anioSeleccionado); }
      else { toast.error("No se pudo eliminar la sección"); }
    } catch (e) { toast.error("Error al eliminar la sección"); }
  };

  const prepararNuevaSeccion = (gradoId: number) => { setSeccionEnEdicion(null); setSelectedGradoId(gradoId); setNuevaSeccion({ nombre: "", vacantes: 30 }); setIsSeccionModalOpen(true); };
  const prepararEditarSeccion = (seccion: Seccion) => { setSeccionEnEdicion(seccion); setSelectedGradoId(seccion.id_grado); setNuevaSeccion({ nombre: seccion.nombre, vacantes: seccion.vacantes ?? 30 }); setIsSeccionModalOpen(true); };
  
  return (
    <RoleGuard modulo="academico" subModulo="estructura">
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        body { font-family: 'Lato', sans-serif; background-color: #F8FAFC; color: #1e293b; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .fill-icon { font-variation-settings: 'FILL' 1; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />

      <div className="flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">

          <HeaderPanel />

          {/* BARRA SUPERIOR */}
          <div className="min-h-16 border-b bg-white flex flex-wrap items-center justify-between gap-y-3 px-4 md:px-8 py-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#093E7A]">account_tree</span>
                <h2 className="text-xl font-bold text-gray-800">Estructura Escolar</h2>
              </div>
              <div className="hidden md:block h-6 w-px bg-gray-200 mx-2"></div>

              {/* SELECTOR DE AÑOS Y BOTÓN DE NUEVO AÑO */}
              <div className="flex items-center gap-3">
                <AnioSelector
                  value={anioSeleccionado}
                  onChange={setAnioSeleccionado}
                  anios={anios}
                  loading={loadingAnios}
                />
                <button
                  onClick={() => setIsCrearAnioModalOpen(true)}
                  className="flex items-center gap-1 px-4 py-2 bg-[#093E7A] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#072d5a] transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Nuevo Año
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {anioObj && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${anioObj.tipo === "VERANO" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                  <span className="material-symbols-outlined text-sm">{anioObj.tipo === "VERANO" ? "sunny" : "school"}</span>
                  {anioObj.tipo === "VERANO" ? "Ciclo Verano" : "Año Regular"}
                </span>
              )}
              {anioObj && (
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${anioObj.activo ? 'text-green-600' : 'text-red-500'}`}>
                  <span className={`size-2 rounded-full ${anioObj.activo ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {anioObj.activo ? "Año en Curso (Vigente)" : "Año Finalizado / Inactivo"}
                </span>
              )}
            </div>
          </div>

          {/* CONTENIDO PRINCIPAL SCROLLABLE */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">

            {!anioSeleccionado ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">calendar_add_on</span>
                <h3 className="text-lg font-black text-gray-700">Selecciona un año académico</h3>
                <p className="text-sm text-gray-500 max-w-md mt-1">
                  Elige un año en el selector superior para administrar su estructura, o crea uno nuevo para empezar.
                </p>
                <button
                  onClick={() => setIsCrearAnioModalOpen(true)}
                  className="mt-5 flex items-center gap-1 px-5 py-2.5 bg-[#093E7A] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#072d5a] transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Crear Nuevo Año
                </button>
              </div>
            ) : (
            <>
            {/* Gestión Año */}
            <section className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">Gestión del Año Académico</h3>
                <p className="text-sm text-gray-500">Administre el estado del periodo lectivo y las fechas de admisión.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* EDITAR FECHAS DE CLASES */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#093E7A]">event_available</span>
                      Periodo Académico
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">Fechas de inicio y fin de clases.</p>
                    {anioObj && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 font-medium space-y-1">
                        <div className="flex justify-between"><span>Inicio:</span> <span className="font-bold">{formatearFecha(anioObj.fecha_inicio)}</span></div>
                        <div className="flex justify-between"><span>Fin:</span> <span className="font-bold">{formatearFecha(anioObj.fecha_fin)}</span></div>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setIsEditarAnioModalOpen(true)} 
                    disabled={!anioSeleccionado}
                    className="w-full py-2.5 bg-white border-2 border-[#093E7A] text-[#093E7A] font-bold rounded-lg text-sm hover:bg-[#093E7A] hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">edit_calendar</span>
                    Editar Fechas
                  </button>
                </div>

                {/* INSCRIPCIONES */}
                <div className={`bg-white p-6 rounded-xl shadow-sm border flex flex-col justify-between transition-colors ${inscripcionesAbiertas() ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-200'}`}>
                  <div className="mb-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#093E7A]">how_to_reg</span>
                        Inscripciones / Matrícula
                      </h4>
                      {inscripcionesAbiertas() && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[11px] font-bold whitespace-nowrap">
                          <span className="relative flex size-2">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping"></span>
                            <span className="relative inline-flex size-2 rounded-full bg-green-500"></span>
                          </span>
                          Abiertas
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Periodo habilitado para nuevas matrículas.</p>
                    {anioObj && anioObj.inicio_inscripcion && anioObj.fin_inscripcion ? (
                      <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-green-800 font-medium space-y-1">
                        <div className="flex justify-between"><span>Inicio:</span> <span className="font-bold">{formatearFecha(anioObj.inicio_inscripcion)}</span></div>
                        <div className="flex justify-between"><span>Fin:</span> <span className="font-bold">{formatearFecha(anioObj.fin_inscripcion)}</span></div>
                        {inscripcionesAbiertas() && (
                          <div className="flex justify-between pt-1 border-t border-green-100 text-green-700">
                            <span>Estado:</span>
                            <span className="font-bold">Cierran en {diasRestantesInscripcion()} día(s)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 italic text-center">
                        Sin fechas configuradas
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsInscripcionModalOpen(true)}
                    disabled={!anioSeleccionado}
                    className="w-full py-2.5 bg-white border-2 border-[#093E7A] text-[#093E7A] font-bold rounded-lg text-sm hover:bg-[#093E7A] hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">date_range</span>
                    Configurar Fechas
                  </button>
                </div>

                {/* NOTA MÍNIMA APROBATORIA */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#093E7A] bg-blue-50 rounded-lg p-1.5">grading</span>
                      Nota Mínima Aprobatoria
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">Umbral para determinar los cursos desaprobados en la evaluación de fin de año.</p>
                    <div className="mt-3 flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nota mínima (0 - 20)</label>
                        <input
                          type="number" min={1} max={20} step={1}
                          value={notaMinima}
                          onChange={(e) => setNotaMinima(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A]"
                        />
                      </div>
                      <button
                        onClick={handleGuardarNota}
                        disabled={guardandoNota}
                        className="py-2 px-4 bg-[#093E7A] text-white rounded-lg font-bold text-xs hover:bg-[#072d5a] disabled:opacity-50"
                      >
                        {guardandoNota ? "..." : "Guardar"}
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center bg-[#FFF1E3] rounded-lg py-2 px-2">
                    El cierre del año (evaluación de desaprobados + aviso a los padres) se ejecuta <strong>automáticamente</strong> al terminar el periodo académico según la fecha configurada.
                  </p>
                </div>
              </div>
            </section>

            {/* Calendario de Bimestres (Solo para Años Regulares) */}
            {anioObj?.tipo !== "VERANO" && (
              <section className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Calendario de Bimestres</h3>
                  <p className="text-sm text-gray-500">
                    Fechas de cada bimestre. La libreta de conducta se reinicia en cada uno, así que de aquí depende a qué bimestre se asigna cada reporte.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  {bimestresAproximados && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      Fechas aproximadas, todavía sin confirmar. El colegio no las ha guardado: revísalas y ajústalas antes de guardar.
                    </div>
                  )}

                  {cargandoBimestres ? (
                    <div className="flex items-center justify-center py-8 text-gray-400 text-sm font-bold">Cargando bimestres...</div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {bimestres.map((b) => (
                          <div key={b.numero} className="grid grid-cols-1 sm:grid-cols-[140px_1fr_1fr] gap-3 sm:items-center border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                            <span className="text-sm font-black text-gray-700">{ROMANOS_BIMESTRE[b.numero - 1]} BIMESTRE</span>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Inicio</label>
                              <input
                                type="date"
                                value={b.fecha_inicio}
                                onChange={(e) => handleCambiarBimestre(b.numero, "fecha_inicio", e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fin</label>
                              <input
                                type="date"
                                value={b.fecha_fin}
                                onChange={(e) => handleCambiarBimestre(b.numero, "fecha_fin", e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 flex justify-end">
                        <button
                          onClick={handleGuardarBimestres}
                          disabled={guardandoBimestres || !anioSeleccionado}
                          className="py-2.5 px-6 bg-[#093E7A] text-white rounded-lg font-bold text-sm hover:bg-[#072d5a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">save</span>
                          {guardandoBimestres ? "Guardando..." : "Guardar Bimestres"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Tira de resumen */}
            {!isLoading && (() => {
              const r = getResumen();
              const pct = r.vacantes > 0 ? Math.round((r.ocupadas / r.vacantes) * 100) : 0;
              const items = [
                { label: "Niveles", valor: r.niveles, icon: "domain" },
                { label: "Grados / Grupos", valor: r.grados, icon: "stairs" },
                { label: "Secciones", valor: r.secciones, icon: "groups" },
                { label: "Vacantes", valor: r.vacantes, icon: "event_seat" },
                { label: "Ocupación", valor: `${r.ocupadas}/${r.vacantes} (${pct}%)`, icon: "person_check" },
              ];
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                  {items.map((it) => (
                    <div key={it.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                      <span className="material-symbols-outlined text-[#093E7A] bg-blue-50 rounded-lg p-2 shrink-0">{it.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wide">{it.label}</p>
                        <p className="text-base font-black text-gray-800 leading-tight">{it.valor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Listado de Niveles */}
            <section className="space-y-4">
              <h3 className="text-xl font-black text-gray-900">
                Niveles Educativos {anioObj?.tipo === "VERANO" ? "(Ciclo Verano)" : "(Año Regular)"}
              </h3>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#093E7A] mb-4"></div>
                  <p className="font-bold">Cargando estructura escolar...</p>
                </div>
              ) : anioObj?.tipo === "VERANO" ? (
                /* ========================================================
                   ESTRUCTURA DE NIVELES PARA CICLO VERANO
                   ======================================================== */
                <div className="space-y-6">
                  {/* 1. NIVEL PRIMARIA (3 Grupos por Ciclos) */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
                    <button
                      onClick={() => toggleNivel(1)}
                      className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#093E7A] fill-icon">domain</span>
                        <h4 className="font-black text-gray-800 uppercase tracking-wide">PRIMARIA (VERANO)</h4>
                        <span className="text-xs font-semibold text-gray-400 normal-case">
                          3 grupos agrupados · {secciones.filter(s => [1, 3, 5].includes(s.id_grado)).length} secciones
                        </span>
                      </div>
                      <span className={`material-symbols-outlined text-gray-400 transition-transform ${nivelesColapsados.has(1) ? "" : "rotate-180"}`}>
                        expand_more
                      </span>
                    </button>
                    {!nivelesColapsados.has(1) && (
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {GRUPOS_VERANO_PRIMARIA.map((grupo) => {
                            const seccionesDelGrupo = secciones.filter(s => s.id_grado === grupo.id_grado);
                            const gradoGrupoObj = {
                              id_grado: grupo.id_grado,
                              id_nivel: 1,
                              nombre: grupo.nombre,
                              subtitulo: grupo.subtitulo,
                              orden: grupo.orden,
                              secciones: seccionesDelGrupo,
                            };
                            return (
                              <GradoCard
                                key={grupo.clave}
                                grado={gradoGrupoObj}
                                onAddSeccion={() => prepararNuevaSeccion(grupo.id_grado)}
                                onEditSeccion={prepararEditarSeccion}
                                onDeleteSeccion={handleEliminarSeccion}
                                esVerano={true}
                                gradosEsperados={grupo.gradosEsperados}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. NIVEL SECUNDARIA (1ro, 2do y 3ero Individuales) */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
                    <button
                      onClick={() => toggleNivel(2)}
                      className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#093E7A] fill-icon">domain</span>
                        <h4 className="font-black text-gray-800 uppercase tracking-wide">SECUNDARIA (VERANO)</h4>
                        <span className="text-xs font-semibold text-gray-400 normal-case">
                          3 grados (1º a 3º) · {secciones.filter(s => [7, 8, 9].includes(s.id_grado)).length} secciones
                        </span>
                      </div>
                      <span className={`material-symbols-outlined text-gray-400 transition-transform ${nivelesColapsados.has(2) ? "" : "rotate-180"}`}>
                        expand_more
                      </span>
                    </button>
                    {!nivelesColapsados.has(2) && (
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {grados
                            .filter(g => g.id_nivel === 2 && g.orden <= 3)
                            .map((grado) => {
                              const seccionesDelGrado = secciones.filter(s => s.id_grado === grado.id_grado);
                              const gradoConSecciones = {
                                ...grado,
                                nombre: `${grado.nombre} de Secundaria`,
                                secciones: seccionesDelGrado
                              };
                              return (
                                <GradoCard
                                  key={grado.id_grado}
                                  grado={gradoConSecciones}
                                  onAddSeccion={() => prepararNuevaSeccion(grado.id_grado)}
                                  onEditSeccion={prepararEditarSeccion}
                                  onDeleteSeccion={handleEliminarSeccion}
                                  esVerano={true}
                                />
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. NIVEL PRE ACADEMIA (Sin grados, solo secciones de 4to y 5to) */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
                    <button
                      onClick={() => toggleNivel(3)}
                      className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#701C32] fill-icon">school</span>
                        <h4 className="font-black text-gray-800 uppercase tracking-wide">PRE ACADEMIA</h4>
                        <span className="text-xs font-semibold text-gray-400 normal-case">
                          Nivel Preuniversitario (4to y 5to) · {secciones.filter(s => s.id_grado === 10).length} secciones
                        </span>
                      </div>
                      <span className={`material-symbols-outlined text-gray-400 transition-transform ${nivelesColapsados.has(3) ? "" : "rotate-180"}`}>
                        expand_more
                      </span>
                    </button>
                    {!nivelesColapsados.has(3) && (
                      <div className="p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-orange-50/70 border border-orange-200 rounded-xl">
                          <div>
                            <h5 className="font-bold text-orange-950 text-sm flex items-center gap-2">
                              <span className="material-symbols-outlined text-orange-600 text-lg">local_library</span>
                              Ciclo Preuniversitario / Pre Academia
                            </h5>
                            <p className="text-xs text-orange-800 mt-0.5">
                              En este nivel no hay grados divididos: acoge a los estudiantes de 4to y 5to de secundaria. Las vacantes se administran directamente por sección.
                            </p>
                          </div>
                          <button
                            onClick={() => prepararNuevaSeccion(10)}
                            className="px-4 py-2 bg-[#701C32] hover:bg-[#591628] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Agregar Sección Pre Academia
                          </button>
                        </div>

                        {secciones.filter(s => s.id_grado === 10).length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {secciones
                              .filter(s => s.id_grado === 10)
                              .map((sec) => {
                                const ocupadas = sec.ocupadas ?? 0;
                                const vacantes = sec.vacantes ?? 0;
                                const ratio = vacantes > 0 ? ocupadas / vacantes : 0;
                                const colorOcupacion = ratio >= 1 ? "text-red-600" : ratio >= 0.8 ? "text-amber-600" : "text-green-600";
                                const colorBarra = ratio >= 1 ? "bg-red-500" : ratio >= 0.8 ? "bg-amber-500" : "bg-green-500";

                                return (
                                  <div key={sec.id_seccion} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-orange-300 transition flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="w-3 h-3 rounded-full bg-[#701C32] shrink-0"></span>
                                          <h4 className="text-base font-bold text-gray-800 truncate">Sección {sec.nombre}</h4>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={() => prepararEditarSeccion(sec)}
                                            title="Editar Sección"
                                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md p-1 transition"
                                          >
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                          </button>
                                          <button
                                            onClick={() => handleEliminarSeccion(sec.id_seccion || 0)}
                                            title="Eliminar Sección"
                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md p-1 transition"
                                          >
                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                          </button>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between text-xs mb-1.5">
                                        <span className="text-gray-500 font-medium">Ocupación:</span>
                                        <span className={`font-black ${colorOcupacion}`}>{ocupadas}/{vacantes} vacantes</span>
                                      </div>

                                      {/* Desglose de alumnos por grado en Pre Academia */}
                                      <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-orange-100 text-[11px]">
                                        <span className="text-gray-400 font-semibold text-[10px]">Alumnos:</span>
                                        {GRADOS_ESPERADOS_PRE_ACADEMIA.map((ge) => {
                                          const match = sec.desglose_grados?.find(d => d.id_grado === ge.id_grado);
                                          const conteo = match ? match.conteo : 0;
                                          return (
                                            <span
                                              key={ge.id_grado}
                                              className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-orange-200 text-gray-700 shadow-2xs font-medium text-[11px]"
                                            >
                                              <span>{ge.etiqueta || ge.nombre}:</span>
                                              <strong className="text-[#701C32] font-bold">{conteo}</strong>
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full transition-all ${colorBarra}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }}></div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
                            <p className="text-xs text-gray-500">Sin secciones de Pre Academia asignadas en este ciclo de verano.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : getNivelesVisibles().length === 0 ? (
                <div className="bg-white p-10 text-center rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-500">No hay niveles configurados para este tipo de año.</p>
                </div>
              ) : (
                getNivelesVisibles().map((nivel) => {
                  const gradosNivel = grados.filter(g => g.id_nivel === nivel.id_nivel);
                  const idsGrados = new Set(gradosNivel.map(g => g.id_grado));
                  const seccionesNivel = secciones.filter(s => idsGrados.has(s.id_grado));
                  const colapsado = nivelesColapsados.has(nivel.id_nivel);

                  return (
                  <div key={nivel.id_nivel} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
                    <button
                      onClick={() => toggleNivel(nivel.id_nivel)}
                      className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#093E7A] fill-icon">domain</span>
                        <h4 className="font-black text-gray-800 uppercase tracking-wide">{nivel.nombre}</h4>
                        <span className="text-xs font-semibold text-gray-400 normal-case">
                          {gradosNivel.length} grados · {seccionesNivel.length} secciones
                        </span>
                      </div>
                      <span className={`material-symbols-outlined text-gray-400 transition-transform ${colapsado ? "" : "rotate-180"}`}>
                        expand_more
                      </span>
                    </button>
                    {!colapsado && (
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gradosNivel.map((grado) => {
                          const seccionesDelGrado = secciones.filter(s => s.id_grado === grado.id_grado);
                          const gradoConSecciones = { ...grado, secciones: seccionesDelGrado };

                          return (
                            <GradoCard
                              key={grado.id_grado}
                              grado={gradoConSecciones}
                              onAddSeccion={() => prepararNuevaSeccion(grado.id_grado as number)}
                              onEditSeccion={prepararEditarSeccion}
                              onDeleteSeccion={handleEliminarSeccion}
                              esVerano={false}
                            />
                          );
                        })}
                      </div>
                    </div>
                    )}
                  </div>
                  );
                })
              )}
            </section>
            </>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL CREAR AÑO (NUEVO BOTÓN) --- */}
      {isCrearAnioModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#093E7A] px-6 py-5 text-white flex justify-between items-start shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><span className="material-symbols-outlined">calendar_add_on</span></div>
                <div>
                  <h3 className="font-black text-lg leading-tight">Nuevo Año Académico</h3>
                  <p className="text-[11px] text-white/70 mt-0.5">El año se creará en el sistema y aparecerá en el selector.</p>
                </div>
              </div>
              <button onClick={() => setIsCrearAnioModalOpen(false)} className="text-white/70 hover:text-white transition-colors mt-0.5"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleCrearAnio} className="p-6 space-y-4 overflow-y-auto min-h-0">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Identificador del Año</label>
                <input required maxLength={6} placeholder="Ej: 2026-1" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]" onChange={(e) => setNuevoAnioData({ ...nuevoAnioData, id_anio_escolar: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Año Académico</label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                  value={nuevoAnioData.tipo}
                  onChange={(e) => setNuevoAnioData({ ...nuevoAnioData, tipo: e.target.value })}
                >
                  <option value="REGULAR">Año Regular</option>
                  <option value="VERANO">Ciclo Verano</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio Clases</label>
                  <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none" onChange={(e) => setNuevoAnioData({ ...nuevoAnioData, fecha_inicio: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fin Clases</label>
                  <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none" onChange={(e) => setNuevoAnioData({ ...nuevoAnioData, fecha_fin: e.target.value })} />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCrearAnioModalOpen(false)} className="flex-1 py-2 text-sm font-bold text-gray-500">Cancelar</button>
                <button
                  type="submit"
                  disabled={!fechasCrearValidas}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${fechasCrearValidas ? "bg-[#093E7A] text-white hover:bg-[#072d5a]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                >
                  Crear Año
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDITAR AÑO (MODIFICADO) --- */}
      {isEditarAnioModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#093E7A] px-6 py-5 text-white flex justify-between items-start shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><span className="material-symbols-outlined">edit_calendar</span></div>
                <div>
                  <h3 className="font-black text-lg leading-tight">Editar Año Académico</h3>
                  <p className="text-[11px] text-white/70 mt-0.5">Modificando el año {anioSeleccionado}</p>
                </div>
              </div>
              <button onClick={() => setIsEditarAnioModalOpen(false)} className="text-white/70 hover:text-white transition-colors mt-0.5"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleEditarAnio} className="p-6 space-y-4 overflow-y-auto min-h-0">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Año Académico</label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                  value={editarAnioData.tipo}
                  onChange={(e) => setEditarAnioData({ ...editarAnioData, tipo: e.target.value })}
                >
                  <option value="REGULAR">Año Regular</option>
                  <option value="VERANO">Ciclo Verano</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio Clases</label>
                  <input required type="date" value={editarAnioData.fecha_inicio} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none" onChange={(e) => setEditarAnioData({ ...editarAnioData, fecha_inicio: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fin Clases</label>
                  <input required type="date" value={editarAnioData.fecha_fin} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none" onChange={(e) => setEditarAnioData({ ...editarAnioData, fecha_fin: e.target.value })} />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditarAnioModalOpen(false)} className="flex-1 py-2 text-sm font-bold text-gray-500">Cancelar</button>
                <button
                  type="submit"
                  disabled={!fechasEditarValidas}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${fechasEditarValidas ? "bg-[#093E7A] text-white hover:bg-[#072d5a]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                >
                  Actualizar Año
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL INSCRIPCIONES --- */}
      {isInscripcionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#093E7A] px-6 py-5 text-white flex justify-between items-start shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><span className="material-symbols-outlined">how_to_reg</span></div>
                <div>
                  <h3 className="font-black text-lg leading-tight">Configurar Inscripciones</h3>
                  <p className="text-[11px] text-white/70 mt-0.5">Periodo de matrícula para {anioSeleccionado}</p>
                </div>
              </div>
              <button onClick={() => setIsInscripcionModalOpen(false)} className="text-white/70 hover:text-white transition-colors mt-0.5"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleGuardarInscripcion} className="p-6 space-y-4 overflow-y-auto min-h-0">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 mb-4">
                <p>Las matrículas automáticas solo se procesarán si la fecha actual está dentro de este rango.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio de Inscripciones</label>
                <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]" value={inscripcionData.inicio_inscripcion} onChange={(e) => setInscripcionData({ ...inscripcionData, inicio_inscripcion: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fin de Inscripciones</label>
                <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]" value={inscripcionData.fin_inscripcion} onChange={(e) => setInscripcionData({ ...inscripcionData, fin_inscripcion: e.target.value })} />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsInscripcionModalOpen(false)} className="flex-1 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={!fechasInscripcionValidas} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${fechasInscripcionValidas ? "bg-[#093E7A] text-white hover:bg-[#072d5a]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Guardar Fechas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE SECCIÓN --- */}
      {isSeccionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#093E7A] px-6 py-5 text-white flex justify-between items-start shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><span className="material-symbols-outlined">groups</span></div>
                <div>
                  <h3 className="font-black text-lg leading-tight">{seccionEnEdicion ? "Editar Sección" : "Nueva Sección"}</h3>
                  <p className="text-[11px] text-white/70 mt-0.5">Define el nombre de la sección y sus vacantes.</p>
                </div>
              </div>
              <button onClick={() => setIsSeccionModalOpen(false)} className="text-white/70 hover:text-white transition-colors mt-0.5"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleGuardarSeccion} className="p-6 space-y-4 overflow-y-auto min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                  <select required className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#093E7A] outline-none" value={nuevaSeccion.nombre} onChange={(e) => setNuevaSeccion({ ...nuevaSeccion, nombre: e.target.value })}>
                    <option value="">Seleccione...</option>
                    {selectedGradoId && getOpcionesSeccion(selectedGradoId).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vacantes</label>
                  <input required type="number" min={1} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#093E7A] outline-none" value={nuevaSeccion.vacantes} onChange={(e) => setNuevaSeccion({ ...nuevaSeccion, vacantes: leerNumero(e.target.value) })} />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsSeccionModalOpen(false)} className="flex-1 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 text-sm font-bold text-white bg-[#093E7A] rounded-lg">{seccionEnEdicion ? "Actualizar" : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmSeccion.abierto}
        onClose={() => setConfirmSeccion({ abierto: false, id: 0 })}
        onConfirm={ejecutarEliminarSeccion}
        type="danger"
        title="Eliminar sección"
        message="¿Seguro que deseas eliminar esta sección? Esta acción no se puede deshacer y solo es posible si no tiene estudiantes matriculados."
        confirmText="Sí, eliminar"
      />
    </>
    </RoleGuard>
  );
}