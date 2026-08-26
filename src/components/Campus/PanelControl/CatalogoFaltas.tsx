"use client";

/**
 * Catálogo de faltas del Reglamento Interno.
 *
 * Dos niveles, como el reglamento en papel: el TIPO agrupa por criterio
 * ("Respeto", "Honradez") y dentro van las faltas concretas con los puntos que
 * descuentan. Lo que se edita aquí es lo que el auxiliar ve al registrar un
 * parte y lo que resta de los 20 puntos de conducta del bimestre.
 *
 * Todo el catálogo llega en UNA petición a /conducta/catalogo, ya agrupado y
 * con el número de reportes que usa cada falta. A partir de ahí la pantalla se
 * actualiza con lo que devuelve cada guardado, sin volver a pedirlo entero:
 * son 5 tipos y 26 faltas, pero recargarlo en cada clic se notaría igual.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch, mensajeDeError } from "@/src/lib/api";
import { ConfirmModal } from "@/src/components/utils/ConfirmModal";

// ---------------------------------------------------------------------------
// Tipos (calcados de la respuesta de GET /conducta/catalogo)
// ---------------------------------------------------------------------------

interface Falta {
    id_nivel_conducta: number;
    id_tipo_falta: number;
    nombre: string;
    puntos: number;
    medida: string | null;
    cambio_ie: boolean;
    descripcion: string | null;
    /** Cuántos reportes de conducta usan esta falta. */
    usos: number;
}

interface TipoFalta {
    id_tipo_falta: number;
    nombre: string;
    faltas: Falta[];
    total_faltas: number;
    usos: number;
}

interface Catalogo {
    puntaje_maximo: number;
    total_tipos: number;
    total_faltas: number;
    tipos: TipoFalta[];
    huerfanas: Falta[];
}

/** Formulario de una falta. `puntos` es texto para poder dejarlo en blanco. */
interface FormFalta {
    id_nivel_conducta: number | null;
    id_tipo_falta: number;
    nombre: string;
    puntos: string;
    medida: string;
    cambio_ie: boolean;
    descripcion: string;
    usos: number;
}

const FORM_FALTA_VACIO: FormFalta = {
    id_nivel_conducta: null, id_tipo_falta: 0, nombre: "", puntos: "",
    medida: "", cambio_ie: false, descripcion: "", usos: 0,
};

// ---------------------------------------------------------------------------

const input =
    "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 " +
    "outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

const etiqueta = "block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5";

/**
 * Color de la insignia de puntos.
 *
 * Cuanto más quita la falta, más fuerte. Los cortes son los del reglamento
 * vistos al revés: quitar 10 o más deja al alumno por debajo del umbral de
 * observación de un solo golpe, y quitar 5 o más se le acerca.
 */
const colorPuntos = (puntos: number, cambioIE: boolean) => {
    if (cambioIE) return "bg-[#701C32] text-white";
    if (puntos >= 10) return "bg-[#701C32]/10 text-[#701C32]";
    if (puntos >= 5) return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-600";
};

export function CatalogoFaltas() {
    const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [abiertos, setAbiertos] = useState<Set<number>>(new Set());
    const [guardando, setGuardando] = useState(false);

    // Modales
    const [formTipo, setFormTipo] = useState<{ id: number | null; nombre: string } | null>(null);
    const [formFalta, setFormFalta] = useState<FormFalta | null>(null);
    const [aBorrar, setABorrar] = useState<
        { clase: "tipo"; dato: TipoFalta } | { clase: "falta"; dato: Falta } | null
    >(null);

    // --- carga ---------------------------------------------------------------

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const res = await apiFetch("/conducta/catalogo");
            if (!res.ok) throw new Error(await mensajeDeError(res, "No se pudo cargar el catálogo de faltas"));
            const datos: Catalogo = await res.json();
            setCatalogo(datos);
            // Con el catálogo cargado se abre el primer grupo, para que la
            // pantalla no se vea como una lista de cajas cerradas sin nada.
            setAbiertos(new Set(datos.tipos.slice(0, 1).map((t) => t.id_tipo_falta)));
        } catch (e) {
            const msg = e instanceof Error ? e.message : "No se pudo cargar el catálogo de faltas";
            setError(msg);
            setCatalogo(null);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    // --- búsqueda ------------------------------------------------------------

    // Filtra por nombre de falta o de tipo. Un tipo cuyo nombre coincide se
    // muestra entero; si la coincidencia está en las faltas, solo esas.
    const tiposVisibles = useMemo(() => {
        if (!catalogo) return [];
        const q = busqueda.trim().toLowerCase();
        if (!q) return catalogo.tipos;
        return catalogo.tipos
            .map((t) => {
                if (t.nombre.toLowerCase().includes(q)) return t;
                const faltas = t.faltas.filter(
                    (f) => f.nombre.toLowerCase().includes(q) ||
                        (f.medida || "").toLowerCase().includes(q)
                );
                return faltas.length ? { ...t, faltas } : null;
            })
            .filter((t): t is TipoFalta => t !== null);
    }, [catalogo, busqueda]);

    // Al buscar se abren todos los grupos con resultados: si no, el usuario ve
    // "3 faltas" y ninguna, y parece que la búsqueda no encontró nada.
    useEffect(() => {
        if (busqueda.trim() && catalogo) {
            setAbiertos(new Set(tiposVisibles.map((t) => t.id_tipo_falta)));
        }
    }, [busqueda, tiposVisibles, catalogo]);

    const alternar = (id: number) =>
        setAbiertos((prev) => {
            const s = new Set(prev);
            if (s.has(id)) s.delete(id); else s.add(id);
            return s;
        });

    // --- guardar tipo --------------------------------------------------------

    const guardarTipo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTipo) return;
        const nombre = formTipo.nombre.trim();
        if (nombre.length < 3) {
            toast.error("El nombre del tipo debe tener al menos 3 caracteres");
            return;
        }

        setGuardando(true);
        try {
            const esNuevo = formTipo.id === null;
            const res = await apiFetch(
                esNuevo ? "/conducta/tipos-falta" : `/conducta/tipos-falta/${formTipo.id}`,
                { method: esNuevo ? "POST" : "PUT", body: JSON.stringify({ nombre }) }
            );
            if (!res.ok) throw new Error(await mensajeDeError(res, "No se pudo guardar el tipo de falta"));
            const guardado = await res.json();

            setCatalogo((prev) => {
                if (!prev) return prev;
                if (esNuevo) {
                    const nuevo: TipoFalta = {
                        id_tipo_falta: guardado.id_tipo_falta, nombre: guardado.nombre,
                        faltas: [], total_faltas: 0, usos: 0,
                    };
                    return {
                        ...prev,
                        total_tipos: prev.total_tipos + 1,
                        tipos: [...prev.tipos, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
                    };
                }
                return {
                    ...prev,
                    tipos: prev.tipos
                        .map((t) => t.id_tipo_falta === guardado.id_tipo_falta
                            ? { ...t, nombre: guardado.nombre } : t)
                        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
                };
            });

            if (esNuevo) setAbiertos((s) => new Set(s).add(guardado.id_tipo_falta));
            toast.success(esNuevo ? `Tipo «${guardado.nombre}» creado` : "Tipo de falta actualizado");
            setFormTipo(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "No se pudo guardar el tipo de falta");
        } finally {
            setGuardando(false);
        }
    };

    // --- guardar falta -------------------------------------------------------

    const guardarFalta = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formFalta || !catalogo) return;

        const nombre = formFalta.nombre.trim();
        if (nombre.length < 3) {
            toast.error("El nombre de la falta debe tener al menos 3 caracteres");
            return;
        }
        if (formFalta.puntos.trim() === "") {
            toast.error("Indica cuántos puntos descuenta la falta");
            return;
        }
        const puntos = Number(formFalta.puntos);
        if (!Number.isInteger(puntos) || puntos < 0 || puntos > catalogo.puntaje_maximo) {
            toast.error(`Los puntos deben ser un número entero entre 0 y ${catalogo.puntaje_maximo}`);
            return;
        }
        if (!formFalta.id_tipo_falta) {
            toast.error("Elige a qué tipo pertenece la falta");
            return;
        }

        setGuardando(true);
        try {
            const esNueva = formFalta.id_nivel_conducta === null;
            const res = await apiFetch(
                esNueva ? "/conducta/faltas" : `/conducta/faltas/${formFalta.id_nivel_conducta}`,
                {
                    method: esNueva ? "POST" : "PUT",
                    body: JSON.stringify({
                        id_tipo_falta: formFalta.id_tipo_falta,
                        nombre,
                        puntos,
                        medida: formFalta.medida.trim() || null,
                        cambio_ie: formFalta.cambio_ie,
                        descripcion: formFalta.descripcion.trim() || null,
                    }),
                }
            );
            if (!res.ok) throw new Error(await mensajeDeError(res, "No se pudo guardar la falta"));
            const guardada: Falta = await res.json();

            // Se recoloca a mano en vez de recargar: la falta puede haber
            // cambiado de tipo, así que sale de un grupo y entra en otro.
            setCatalogo((prev) => {
                if (!prev) return prev;
                const tipos = prev.tipos.map((t) => {
                    const sinEsta = t.faltas.filter(
                        (f) => f.id_nivel_conducta !== guardada.id_nivel_conducta);
                    const lista = t.id_tipo_falta === guardada.id_tipo_falta
                        ? [...sinEsta, guardada].sort(
                            (a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"))
                        : sinEsta;
                    return {
                        ...t,
                        faltas: lista,
                        total_faltas: lista.length,
                        usos: lista.reduce((s, f) => s + f.usos, 0),
                    };
                });
                return {
                    ...prev,
                    tipos,
                    total_faltas: tipos.reduce((s, t) => s + t.total_faltas, 0),
                };
            });

            setAbiertos((s) => new Set(s).add(guardada.id_tipo_falta));
            if (!esNueva && guardada.usos > 0) {
                // El aviso importa: la nota de conducta se deduce al vuelo, así
                // que tocar los puntos cambia notas que ya se habían visto.
                toast.success("Falta actualizada", {
                    description: `Se recalcula la conducta de ${guardada.usos} ` +
                        `${guardada.usos === 1 ? "reporte" : "reportes"} que ya la usaban.`,
                });
            } else {
                toast.success(esNueva ? `Falta «${guardada.nombre}» creada` : "Falta actualizada");
            }
            setFormFalta(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "No se pudo guardar la falta");
        } finally {
            setGuardando(false);
        }
    };

    // --- borrar --------------------------------------------------------------

    const confirmarBorrado = async () => {
        if (!aBorrar) return;
        const objetivo = aBorrar;
        setABorrar(null);
        try {
            const url = objetivo.clase === "tipo"
                ? `/conducta/tipos-falta/${objetivo.dato.id_tipo_falta}`
                : `/conducta/faltas/${objetivo.dato.id_nivel_conducta}`;
            const res = await apiFetch(url, { method: "DELETE" });
            if (!res.ok) throw new Error(await mensajeDeError(res, "No se pudo eliminar"));

            setCatalogo((prev) => {
                if (!prev) return prev;
                if (objetivo.clase === "tipo") {
                    const tipos = prev.tipos.filter(
                        (t) => t.id_tipo_falta !== objetivo.dato.id_tipo_falta);
                    return { ...prev, tipos, total_tipos: tipos.length };
                }
                const tipos = prev.tipos.map((t) => {
                    const lista = t.faltas.filter(
                        (f) => f.id_nivel_conducta !== objetivo.dato.id_nivel_conducta);
                    return lista.length === t.faltas.length
                        ? t
                        : { ...t, faltas: lista, total_faltas: lista.length,
                            usos: lista.reduce((s, f) => s + f.usos, 0) };
                });
                return { ...prev, tipos, total_faltas: tipos.reduce((s, t) => s + t.total_faltas, 0) };
            });
            toast.success("Eliminado correctamente");
        } catch (err) {
            // Aquí caen los bloqueos con explicación del servidor ("está en 3
            // reportes"), así que el mensaje se enseña entero y sin recortar.
            toast.error("No se pudo eliminar", {
                description: err instanceof Error ? err.message : undefined,
                duration: 8000,
            });
        }
    };

    // --- pantallas de carga y error -----------------------------------------

    if (cargando) {
        return (
            <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                        <div className="h-5 w-64 bg-gray-100 rounded animate-pulse" />
                        <div className="h-3 w-40 bg-gray-100 rounded animate-pulse mt-3" />
                    </div>
                ))}
            </div>
        );
    }

    if (error || !catalogo) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 px-6 py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#701C32]/10 text-[#701C32] flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-[28px]">error</span>
                </div>
                <h3 className="font-black text-gray-800">No se pudo cargar el catálogo</h3>
                <p className="text-sm text-gray-600 mt-1.5 max-w-md mx-auto">{error}</p>
                <button
                    onClick={cargar}
                    className="mt-5 inline-flex items-center gap-2 bg-[#093E7A] hover:bg-[#072d5a] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Reintentar
                </button>
            </div>
        );
    }

    const sinResultados = tiposVisibles.length === 0;

    return (
        <div className="space-y-5">
            {/* ENCABEZADO */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-black text-[#093E7A] flex items-center gap-2">
                            <span className="material-symbols-outlined">gavel</span>
                            Catálogo de Faltas
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                            Los tipos de falta del Reglamento Interno y los puntos que descuenta cada
                            una. Es lo que el auxiliar elige al registrar un parte, y lo que se resta
                            de los <strong>{catalogo.puntaje_maximo} puntos</strong> con los que cada
                            alumno empieza el bimestre.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setFormTipo({ id: null, nombre: "" })}
                            className="flex items-center gap-2 bg-white border-2 border-[#093E7A] text-[#093E7A] hover:bg-[#093E7A]/5 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">create_new_folder</span>
                            Nuevo tipo
                        </button>
                        <button
                            onClick={() => setFormFalta({
                                ...FORM_FALTA_VACIO,
                                id_tipo_falta: catalogo.tipos[0]?.id_tipo_falta || 0,
                            })}
                            disabled={catalogo.tipos.length === 0}
                            title={catalogo.tipos.length === 0 ? "Crea primero un tipo de falta" : undefined}
                            className="flex items-center gap-2 bg-[#093E7A] hover:bg-[#072d5a] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            Nueva falta
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-5 pt-5 border-t border-gray-100">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar una falta, un tipo o una medida..."
                            className={`${input} pl-10`}
                        />
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-wider text-gray-500 shrink-0">
                        <span>{catalogo.total_tipos} {catalogo.total_tipos === 1 ? "tipo" : "tipos"}</span>
                        <span className="w-px h-4 bg-gray-200" />
                        <span>{catalogo.total_faltas} {catalogo.total_faltas === 1 ? "falta" : "faltas"}</span>
                    </div>
                </div>
            </div>

            {/* LISTA */}
            {sinResultados ? (
                <div className="bg-white rounded-2xl border border-gray-200 px-6 py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-[28px]">
                            {busqueda ? "search_off" : "gavel"}
                        </span>
                    </div>
                    <h3 className="font-black text-gray-800">
                        {busqueda ? "Ninguna falta coincide con la búsqueda" : "El catálogo está vacío"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1.5">
                        {busqueda
                            ? "Prueba con otra palabra."
                            : "Crea un tipo de falta y añade dentro las faltas del reglamento."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tiposVisibles.map((tipo) => {
                        const abierto = abiertos.has(tipo.id_tipo_falta);
                        return (
                            <div key={tipo.id_tipo_falta} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* CABECERA DEL TIPO */}
                                <div className="flex items-center gap-2 p-4 md:px-5">
                                    <button
                                        onClick={() => alternar(tipo.id_tipo_falta)}
                                        aria-expanded={abierto}
                                        className="flex-1 flex items-center gap-3 text-left min-w-0 group"
                                    >
                                        <span className={`material-symbols-outlined text-gray-400 transition-transform ${abierto ? "rotate-90" : ""}`}>
                                            chevron_right
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block font-black text-gray-800 truncate group-hover:text-[#093E7A] transition-colors">
                                                {tipo.nombre}
                                            </span>
                                            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                                                {tipo.total_faltas} {tipo.total_faltas === 1 ? "falta" : "faltas"}
                                                {tipo.usos > 0 && ` · ${tipo.usos} ${tipo.usos === 1 ? "reporte" : "reportes"}`}
                                            </span>
                                        </span>
                                    </button>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => setFormFalta({ ...FORM_FALTA_VACIO, id_tipo_falta: tipo.id_tipo_falta })}
                                            title="Añadir una falta a este tipo"
                                            className="p-2 text-gray-400 hover:text-[#093E7A] hover:bg-[#093E7A]/5 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">add</span>
                                        </button>
                                        <button
                                            onClick={() => setFormTipo({ id: tipo.id_tipo_falta, nombre: tipo.nombre })}
                                            title="Renombrar el tipo"
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => setABorrar({ clase: "tipo", dato: tipo })}
                                            disabled={tipo.total_faltas > 0}
                                            title={tipo.total_faltas > 0
                                                ? "Primero hay que vaciar el tipo: tiene faltas dentro"
                                                : "Eliminar el tipo"}
                                            className="p-2 text-gray-400 hover:text-[#701C32] hover:bg-[#701C32]/5 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                </div>

                                {/* FALTAS */}
                                {abierto && (
                                    <div className="border-t border-gray-100">
                                        {tipo.faltas.length === 0 ? (
                                            <p className="px-5 py-8 text-center text-sm text-gray-500">
                                                Este tipo todavía no tiene faltas.
                                            </p>
                                        ) : (
                                            <ul className="divide-y divide-gray-50">
                                                {tipo.faltas.map((falta) => (
                                                    <li key={falta.id_nivel_conducta}
                                                        className="flex items-start gap-3 px-4 md:px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                                                        {/* Puntos */}
                                                        <span className={`shrink-0 w-14 text-center py-1.5 rounded-lg text-xs font-black tabular-nums ${colorPuntos(falta.puntos, falta.cambio_ie)}`}
                                                            title={`Descuenta ${falta.puntos} de ${catalogo.puntaje_maximo} puntos`}>
                                                            −{falta.puntos}
                                                        </span>

                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-gray-800 text-sm">{falta.nombre}</p>
                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                                {falta.cambio_ie && (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#701C32]">
                                                                        <span className="material-symbols-outlined text-[13px]">gpp_maybe</span>
                                                                        Amerita cambio de I.E.
                                                                    </span>
                                                                )}
                                                                {falta.medida && (
                                                                    <span className="text-[11px] text-gray-500 font-medium">{falta.medida}</span>
                                                                )}
                                                                {falta.usos > 0 && (
                                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                                        {falta.usos} {falta.usos === 1 ? "reporte" : "reportes"}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {falta.descripcion && (
                                                                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{falta.descripcion}</p>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                onClick={() => setFormFalta({
                                                                    id_nivel_conducta: falta.id_nivel_conducta,
                                                                    id_tipo_falta: falta.id_tipo_falta,
                                                                    nombre: falta.nombre,
                                                                    puntos: String(falta.puntos),
                                                                    medida: falta.medida || "",
                                                                    cambio_ie: falta.cambio_ie,
                                                                    descripcion: falta.descripcion || "",
                                                                    usos: falta.usos,
                                                                })}
                                                                title="Editar la falta"
                                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-[19px]">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => setABorrar({ clase: "falta", dato: falta })}
                                                                disabled={falta.usos > 0}
                                                                title={falta.usos > 0
                                                                    ? `No se puede borrar: está en ${falta.usos} ${falta.usos === 1 ? "reporte" : "reportes"} de conducta`
                                                                    : "Eliminar la falta"}
                                                                className="p-2 text-gray-400 hover:text-[#701C32] hover:bg-[#701C32]/5 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                                                            >
                                                                <span className="material-symbols-outlined text-[19px]">delete</span>
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL: TIPO DE FALTA */}
            {formTipo && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4"
                    onClick={() => !guardando && setFormTipo(null)}>
                    <form onSubmit={guardarTipo} onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md modal-in overflow-hidden">
                        <div className="px-6 pt-6">
                            <h3 className="text-lg font-black text-[#093E7A]">
                                {formTipo.id === null ? "Nuevo tipo de falta" : "Renombrar tipo de falta"}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                El grupo bajo el que se ordenan las faltas del reglamento.
                            </p>
                        </div>
                        <div className="p-6">
                            <label className={etiqueta} htmlFor="cf_tipo_nombre">Nombre del tipo</label>
                            <input
                                id="cf_tipo_nombre"
                                autoFocus
                                maxLength={60}
                                value={formTipo.nombre}
                                onChange={(e) => setFormTipo({ ...formTipo, nombre: e.target.value })}
                                placeholder="Ej.: Respeto, Honradez, Puntualidad..."
                                className={input}
                            />
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                Entre 3 y 60 caracteres. {formTipo.nombre.trim().length}/60
                            </p>
                        </div>
                        <div className="flex gap-3 px-6 pb-6">
                            <button type="button" disabled={guardando} onClick={() => setFormTipo(null)}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-60">
                                Cancelar
                            </button>
                            <button type="submit" disabled={guardando}
                                className="flex-1 py-2.5 bg-[#093E7A] text-white font-bold rounded-xl hover:bg-[#072d5a] transition-colors disabled:opacity-60">
                                {guardando ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL: FALTA */}
            {formFalta && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4"
                    onClick={() => !guardando && setFormFalta(null)}>
                    <form onSubmit={guardarFalta} onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto modal-in">
                        <div className="px-6 pt-6">
                            <h3 className="text-lg font-black text-[#093E7A]">
                                {formFalta.id_nivel_conducta === null ? "Nueva falta" : "Editar falta"}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Lo que el auxiliar elegirá al registrar un parte de conducta.
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className={etiqueta} htmlFor="cf_falta_tipo">Tipo de falta</label>
                                <select id="cf_falta_tipo" value={formFalta.id_tipo_falta}
                                    onChange={(e) => setFormFalta({ ...formFalta, id_tipo_falta: Number(e.target.value) })}
                                    className={`${input} cursor-pointer`}>
                                    {catalogo.tipos.map((t) => (
                                        <option key={t.id_tipo_falta} value={t.id_tipo_falta}>{t.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={etiqueta} htmlFor="cf_falta_nombre">Falta</label>
                                <input id="cf_falta_nombre" autoFocus maxLength={120}
                                    value={formFalta.nombre}
                                    onChange={(e) => setFormFalta({ ...formFalta, nombre: e.target.value })}
                                    placeholder="Ej.: Tardanza al ingreso"
                                    className={input} />
                                <p className="text-[11px] text-gray-400 mt-1.5">
                                    Entre 3 y 120 caracteres. {formFalta.nombre.trim().length}/120
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={etiqueta} htmlFor="cf_falta_puntos">Puntos que descuenta</label>
                                    <input id="cf_falta_puntos" type="number" inputMode="numeric"
                                        min={0} max={catalogo.puntaje_maximo} step={1}
                                        value={formFalta.puntos}
                                        onChange={(e) => setFormFalta({ ...formFalta, puntos: e.target.value })}
                                        className={input} />
                                    <p className="text-[11px] text-gray-400 mt-1.5">
                                        De 0 a {catalogo.puntaje_maximo}.
                                    </p>
                                </div>
                                <div>
                                    <label className={etiqueta} htmlFor="cf_falta_medida">Medida (opcional)</label>
                                    <input id="cf_falta_medida" maxLength={60}
                                        value={formFalta.medida}
                                        onChange={(e) => setFormFalta({ ...formFalta, medida: e.target.value })}
                                        placeholder="Ej.: Acto reflexivo por 3 días"
                                        className={input} />
                                </div>
                            </div>

                            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:border-[#701C32]/40 transition-colors">
                                <input type="checkbox" checked={formFalta.cambio_ie}
                                    onChange={(e) => setFormFalta({ ...formFalta, cambio_ie: e.target.checked })}
                                    className="mt-0.5 w-4 h-4 accent-[#701C32] cursor-pointer" />
                                <span>
                                    <span className="block text-sm font-bold text-gray-800">Amerita cambio de I.E.</span>
                                    <span className="block text-[11px] text-gray-500 mt-0.5">
                                        Marca la conducta como crítica de inmediato, sin importar los puntos
                                        que le queden al alumno, y no se reinicia al cambiar de bimestre.
                                    </span>
                                </span>
                            </label>

                            <div>
                                <label className={etiqueta} htmlFor="cf_falta_desc">Descripción (opcional)</label>
                                <textarea id="cf_falta_desc" rows={3} maxLength={2000}
                                    value={formFalta.descripcion}
                                    onChange={(e) => setFormFalta({ ...formFalta, descripcion: e.target.value })}
                                    placeholder="Detalle del reglamento, si hace falta aclarar cuándo aplica."
                                    className={`${input} resize-y`} />
                            </div>

                            {/* El aviso solo aparece si la falta ya se usó: en una nueva no significa nada. */}
                            {formFalta.usos > 0 && (
                                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                                    <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0">info</span>
                                    <p className="text-[12px] text-amber-800 leading-relaxed">
                                        Esta falta está en <strong>{formFalta.usos} {formFalta.usos === 1 ? "reporte" : "reportes"}</strong> de
                                        conducta. La nota no se guarda calculada, se deduce de los reportes,
                                        así que cambiar los puntos <strong>recalcula la conducta de esos alumnos</strong>,
                                        también en bimestres ya cerrados.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 px-6 pb-6">
                            <button type="button" disabled={guardando} onClick={() => setFormFalta(null)}
                                className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-60">
                                Cancelar
                            </button>
                            <button type="submit" disabled={guardando}
                                className="flex-1 py-2.5 bg-[#093E7A] text-white font-bold rounded-xl hover:bg-[#072d5a] transition-colors disabled:opacity-60">
                                {guardando ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* CONFIRMAR BORRADO */}
            <ConfirmModal
                isOpen={aBorrar !== null}
                onClose={() => setABorrar(null)}
                onConfirm={confirmarBorrado}
                type="danger"
                title={aBorrar?.clase === "tipo" ? "Eliminar tipo de falta" : "Eliminar falta"}
                message={
                    aBorrar === null ? "" :
                        aBorrar.clase === "tipo"
                            ? `Se eliminará el tipo «${aBorrar.dato.nombre}». Esta acción no se puede deshacer.`
                            : `Se eliminará la falta «${aBorrar.dato.nombre}», que descuenta ${aBorrar.dato.puntos} puntos. ` +
                              `El auxiliar dejará de verla al registrar partes. Esta acción no se puede deshacer.`
                }
                confirmText="Sí, eliminar"
            />
        </div>
    );
}
