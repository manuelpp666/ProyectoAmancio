"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/src/lib/api";
import { AlumnoBase } from "@/src/interfaces/admision";
import { Familiar, PARENTESCOS } from "@/src/interfaces/familiar";

interface Grado {
  id_grado: number;
  nombre: string;
  nivel?: { nombre: string };
}

interface Props {
  alumno: AlumnoBase | null;
  onClose: () => void;
  onSaved: () => void;
}

const TALLAS = ["4", "6", "8", "10", "12", "14", "16", "S", "M", "L"];

const FAM_VACIO = {
  nombres: "",
  apellidos: "",
  dni: "",
  telefono: "",
  email: "",
  direccion: "",
  tipo_parentesco: "",
};

const soloDigitos = (valor: string, max: number) => valor.replace(/\D/g, "").slice(0, max);

const input =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors duration-150 disabled:bg-gray-50 disabled:text-gray-500";
const label = "text-[11px] font-bold text-slate-600 uppercase tracking-wide";

export function ModalEditarEstudiante({ alumno, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<"datos" | "familiares">("datos");
  const [grados, setGrados] = useState<Grado[]>([]);
  const [guardando, setGuardando] = useState(false);

  // --- Datos del alumno ---
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    dni: "",
    fecha_nacimiento: "",
    genero: "",
    direccion: "",
    enfermedad: "",
    talla_polo: "",
    colegio_procedencia: "",
    id_grado_ingreso: "",
    password: "",
    activo: true,
  });

  // --- Familiares ---
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [cargandoFam, setCargandoFam] = useState(false);
  const [famForm, setFamForm] = useState(FAM_VACIO);
  const [famEditando, setFamEditando] = useState<number | null>(null); // id_familiar en edición
  const [famAbierto, setFamAbierto] = useState(false); // formulario visible
  const [famGuardando, setFamGuardando] = useState(false);
  const [confirmarBaja, setConfirmarBaja] = useState<Familiar | null>(null);

  const abierto = !!alumno;

  // Cargar grados una sola vez
  useEffect(() => {
    if (!abierto || grados.length > 0) return;
    const cargar = async () => {
      try {
        const res = await apiFetch("/academic/grados/");
        if (res.ok) setGrados(await res.json());
      } catch {
        toast.error("No se pudieron cargar los grados");
      }
    };
    cargar();
  }, [abierto, grados.length]);

  const cargarFamiliares = useCallback(async (idAlumno: number) => {
    setCargandoFam(true);
    try {
      const res = await apiFetch(`/alumnos/${idAlumno}/familiares`);
      if (res.ok) setFamiliares(await res.json());
      else toast.error("No se pudieron cargar los familiares");
    } catch {
      toast.error("Error de conexión al cargar los familiares");
    } finally {
      setCargandoFam(false);
    }
  }, []);

  // Volcar los datos del alumno al abrir
  useEffect(() => {
    if (!alumno) return;
    setTab("datos");
    setForm({
      nombres: alumno.nombres ?? "",
      apellidos: alumno.apellidos ?? "",
      dni: alumno.dni ?? "",
      fecha_nacimiento: alumno.fecha_nacimiento ?? "",
      genero: alumno.genero ?? "",
      direccion: alumno.direccion ?? "",
      enfermedad: alumno.enfermedad ?? "",
      talla_polo: alumno.talla_polo ?? "",
      colegio_procedencia: alumno.colegio_procedencia ?? "",
      id_grado_ingreso: alumno.id_grado_ingreso ? String(alumno.id_grado_ingreso) : "",
      password: "",
      activo: alumno.usuario?.activo ?? true,
    });
    setFamForm(FAM_VACIO);
    setFamEditando(null);
    setFamAbierto(false);
    setConfirmarBaja(null);
    cargarFamiliares(alumno.id_alumno);
  }, [alumno, cargarFamiliares]);

  if (!alumno) return null;

  const guardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.dni.length !== 8) {
      toast.error("El DNI del estudiante debe tener 8 dígitos.");
      return;
    }
    if (form.password && form.password.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setGuardando(true);
    try {
      const payload: Record<string, unknown> = {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        dni: form.dni,
        fecha_nacimiento: form.fecha_nacimiento || null,
        genero: form.genero || null,
        direccion: form.direccion.trim() || null,
        enfermedad: form.enfermedad.trim() || null,
        talla_polo: form.talla_polo || null,
        colegio_procedencia: form.colegio_procedencia.trim() || null,
        id_grado_ingreso: form.id_grado_ingreso ? Number(form.id_grado_ingreso) : null,
        activo: form.activo,
      };
      // La contraseña solo viaja si el admin escribió una nueva
      if (form.password) payload.password = form.password;

      const res = await apiFetch(`/alumnos/${alumno.id_alumno}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Datos del estudiante actualizados");
        setForm((f) => ({ ...f, password: "" }));
        onSaved();
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.detail?.[0]?.msg || err?.detail || "No se pudo actualizar el estudiante");
      }
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setGuardando(false);
    }
  };

  const abrirNuevoFamiliar = () => {
    setFamForm(FAM_VACIO);
    setFamEditando(null);
    setFamAbierto(true);
  };

  const abrirEditarFamiliar = (f: Familiar) => {
    setFamForm({
      nombres: f.nombres ?? "",
      apellidos: f.apellidos ?? "",
      dni: f.dni ?? "",
      telefono: f.telefono ?? "",
      email: f.email ?? "",
      direccion: f.direccion ?? "",
      tipo_parentesco: f.parentesco ?? "",
    });
    setFamEditando(f.id_familiar);
    setFamAbierto(true);
  };

  const guardarFamiliar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (famForm.dni.length !== 8) {
      toast.error("El DNI del familiar debe tener 8 dígitos.");
      return;
    }
    if (famForm.telefono.length !== 9) {
      toast.error("El teléfono del familiar debe tener 9 dígitos.");
      return;
    }
    setFamGuardando(true);
    try {
      const payload = {
        nombres: famForm.nombres.trim(),
        apellidos: famForm.apellidos.trim(),
        dni: famForm.dni,
        telefono: famForm.telefono,
        email: famForm.email.trim() || null,
        direccion: famForm.direccion.trim() || null,
        tipo_parentesco: famForm.tipo_parentesco,
      };
      const url = famEditando
        ? `/alumnos/${alumno.id_alumno}/familiares/${famEditando}`
        : `/alumnos/${alumno.id_alumno}/familiares`;

      const res = await apiFetch(url, {
        method: famEditando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(famEditando ? "Familiar actualizado" : "Familiar agregado");
        setFamAbierto(false);
        setFamForm(FAM_VACIO);
        setFamEditando(null);
        cargarFamiliares(alumno.id_alumno);
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.detail?.[0]?.msg || err?.detail || "No se pudo guardar el familiar");
      }
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setFamGuardando(false);
    }
  };

  const eliminarFamiliar = async () => {
    if (!confirmarBaja) return;
    setFamGuardando(true);
    try {
      const res = await apiFetch(`/alumnos/${alumno.id_alumno}/familiares/${confirmarBaja.id_familiar}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Familiar eliminado");
        setConfirmarBaja(null);
        cargarFamiliares(alumno.id_alumno);
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.detail || "No se pudo eliminar el familiar");
      }
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setFamGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-editar-estudiante"
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col modal-in"
      >
        {/* HEADER */}
        <div className="p-6 bg-[#093E7A] text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shrink-0">
              <span className="material-symbols-outlined text-2xl">edit_note</span>
            </div>
            <div className="min-w-0">
              <h3 id="titulo-editar-estudiante" className="text-lg font-black tracking-tight leading-none truncate">
                Editar Estudiante
              </h3>
              <p className="text-blue-100 text-[11px] mt-1 font-bold truncate">
                {alumno.nombres} {alumno.apellidos} · DNI {alumno.dni}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 hover:bg-white/10 rounded-full transition-colors duration-150 shrink-0"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-6 px-6 border-b border-gray-100 bg-white shrink-0">
          {([
            { id: "datos", label: "Datos del estudiante", icon: "person" },
            { id: "familiares", label: `Familiares (${familiares.length})`, icon: "family_restroom" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-3.5 border-b-2 flex items-center gap-2 text-sm font-bold transition-colors duration-150 ${
                tab === t.id
                  ? "border-[#093E7A] text-[#093E7A]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* --- TAB: DATOS DEL ESTUDIANTE --- */}
        {tab === "datos" && (
          <form onSubmit={guardarDatos} className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-6">

              <section>
                <h4 className="text-[#093E7A] font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#093E7A] rounded-full" /> Datos personales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-1.5">
                    <label className={label} htmlFor="ed_nombres">Nombres <span className="text-red-500">*</span></label>
                    <input id="ed_nombres" required value={form.nombres}
                      onChange={(e) => setForm({ ...form, nombres: e.target.value })} className={input} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={label} htmlFor="ed_apellidos">Apellidos <span className="text-red-500">*</span></label>
                    <input id="ed_apellidos" required value={form.apellidos}
                      onChange={(e) => setForm({ ...form, apellidos: e.target.value })} className={input} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={label} htmlFor="ed_dni">DNI <span className="text-red-500">*</span></label>
                    <input id="ed_dni" required value={form.dni} inputMode="numeric" maxLength={8}
                      onChange={(e) => setForm({ ...form, dni: soloDigitos(e.target.value, 8) })} className={input} />
                    <p className="text-[11px] text-gray-500">
                      Al cambiarlo, el usuario del estudiante pasa a ser el nuevo DNI.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className={label} htmlFor="ed_fecha">Fecha de nacimiento</label>
                    <input id="ed_fecha" type="date" value={form.fecha_nacimiento}
                      onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} className={input} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={label} htmlFor="ed_genero">Género</label>
                    <select id="ed_genero" value={form.genero}
                      onChange={(e) => setForm({ ...form, genero: e.target.value })} className={input}>
                      <option value="">Seleccione...</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={label} htmlFor="ed_talla">Talla de polo</label>
                    <select id="ed_talla" value={form.talla_polo}
                      onChange={(e) => setForm({ ...form, talla_polo: e.target.value })} className={input}>
                      <option value="">Seleccione...</option>
                      {TALLAS.map((t) => <option key={t} value={t}>{t.length > 2 ? t : `Talla ${t}`}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className={label} htmlFor="ed_direccion">Dirección domiciliaria</label>
                    <input id="ed_direccion" value={form.direccion}
                      onChange={(e) => setForm({ ...form, direccion: e.target.value })} className={input} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className={label} htmlFor="ed_enfermedad">Enfermedades / Alergias</label>
                    <input id="ed_enfermedad" value={form.enfermedad} placeholder="Ninguna o especifique..."
                      onChange={(e) => setForm({ ...form, enfermedad: e.target.value })} className={input} />
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-[#093E7A] font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#093E7A] rounded-full" /> Datos académicos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-1.5">
                    <label className={label} htmlFor="ed_grado">Grado de ingreso</label>
                    <select id="ed_grado" value={form.id_grado_ingreso}
                      onChange={(e) => setForm({ ...form, id_grado_ingreso: e.target.value })} className={input}>
                      <option value="">Sin definir</option>
                      {grados.map((g) => (
                        <option key={g.id_grado} value={g.id_grado}>
                          {g.nombre} {g.nivel ? `(${g.nivel.nombre})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={label} htmlFor="ed_colegio">Colegio de procedencia</label>
                    <input id="ed_colegio" value={form.colegio_procedencia}
                      onChange={(e) => setForm({ ...form, colegio_procedencia: e.target.value })} className={input} />
                  </div>
                </div>
              </section>

              {/* ACCESO AL CAMPUS */}
              <section>
                <h4 className="text-[#093E7A] font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#093E7A] rounded-full" /> Acceso al campus
                </h4>

                {alumno.id_usuario ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-slate-50 border border-slate-100 rounded-2xl p-5">
                    <div className="space-y-1.5">
                      <label className={label} htmlFor="ed_usuario">Nombre de usuario</label>
                      <input id="ed_usuario" value={form.dni} disabled className={input} />
                      <p className="text-[11px] text-gray-500">Siempre es el DNI del estudiante.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className={label} htmlFor="ed_password">Nueva contraseña</label>
                      <input id="ed_password" type="password" value={form.password} autoComplete="new-password"
                        placeholder="Dejar vacío para no cambiarla" minLength={6}
                        onChange={(e) => setForm({ ...form, password: e.target.value })} className={input} />
                      <p className="text-[11px] text-gray-500">Mínimo 6 caracteres.</p>
                    </div>
                    <label className="md:col-span-2 flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.activo}
                        onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                        className="w-4 h-4 accent-[#093E7A]" />
                      <span className="text-sm font-bold text-slate-700">Cuenta activa</span>
                      <span className="text-xs text-gray-500">
                        Si se desactiva, el estudiante no podrá iniciar sesión.
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800 leading-relaxed">
                    Este estudiante todavía no tiene usuario del campus. Se le crea automáticamente
                    al ser admitido, usando su DNI como nombre de usuario.
                  </div>
                )}
              </section>
            </div>

            {/* FOOTER */}
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0">
              <button type="button" onClick={onClose}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors duration-150">
                Cancelar
              </button>
              <button type="submit" disabled={guardando}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#093E7A] rounded-lg hover:bg-[#072d5a] transition-[background-color,transform] duration-150 ease-out active:scale-[0.98] disabled:opacity-60 flex items-center gap-2">
                {guardando && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}

        {/* --- TAB: FAMILIARES --- */}
        {tab === "familiares" && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-4">

              {/* Formulario de alta / edición (en línea, no otro modal) */}
              {famAbierto ? (
                <form onSubmit={guardarFamiliar} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 surface-in">
                  <h4 className="text-sm font-black text-slate-800">
                    {famEditando ? "Editar familiar" : "Agregar familiar"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1.5">
                      <label className={label} htmlFor="fm_nombres">Nombres <span className="text-red-500">*</span></label>
                      <input id="fm_nombres" required value={famForm.nombres}
                        onChange={(e) => setFamForm({ ...famForm, nombres: e.target.value })} className={input} />
                    </div>
                    <div className="space-y-1.5">
                      <label className={label} htmlFor="fm_apellidos">Apellidos <span className="text-red-500">*</span></label>
                      <input id="fm_apellidos" required value={famForm.apellidos}
                        onChange={(e) => setFamForm({ ...famForm, apellidos: e.target.value })} className={input} />
                    </div>
                    <div className="space-y-1.5">
                      <label className={label} htmlFor="fm_dni">DNI <span className="text-red-500">*</span></label>
                      <input id="fm_dni" required value={famForm.dni} inputMode="numeric" maxLength={8} placeholder="8 dígitos"
                        onChange={(e) => setFamForm({ ...famForm, dni: soloDigitos(e.target.value, 8) })} className={input} />
                      {!famEditando && (
                        <p className="text-[11px] text-gray-500">Si el DNI ya existe, se vincula ese familiar (caso hermanos).</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className={label} htmlFor="fm_telefono">Teléfono <span className="text-red-500">*</span></label>
                      <input id="fm_telefono" required value={famForm.telefono} inputMode="numeric" maxLength={9} placeholder="9 dígitos"
                        onChange={(e) => setFamForm({ ...famForm, telefono: soloDigitos(e.target.value, 9) })} className={input} />
                    </div>
                    <div className="space-y-1.5">
                      <label className={label} htmlFor="fm_parentesco">Parentesco <span className="text-red-500">*</span></label>
                      <select id="fm_parentesco" required value={famForm.tipo_parentesco}
                        onChange={(e) => setFamForm({ ...famForm, tipo_parentesco: e.target.value })} className={input}>
                        <option value="">Seleccione...</option>
                        {PARENTESCOS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={label} htmlFor="fm_email">Correo electrónico</label>
                      <input id="fm_email" type="email" value={famForm.email} placeholder="correo@ejemplo.com"
                        onChange={(e) => setFamForm({ ...famForm, email: e.target.value })} className={input} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className={label} htmlFor="fm_direccion">Dirección</label>
                      <input id="fm_direccion" value={famForm.direccion}
                        onChange={(e) => setFamForm({ ...famForm, direccion: e.target.value })} className={input} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-1">
                    <button type="button" onClick={() => { setFamAbierto(false); setFamEditando(null); }}
                      className="px-5 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors duration-150">
                      Cancelar
                    </button>
                    <button type="submit" disabled={famGuardando}
                      className="px-5 py-2 text-sm font-bold text-white bg-[#093E7A] rounded-lg hover:bg-[#072d5a] transition-[background-color,transform] duration-150 ease-out active:scale-[0.98] disabled:opacity-60 flex items-center gap-2">
                      {famGuardando && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
                      {famEditando ? "Guardar familiar" : "Agregar familiar"}
                    </button>
                  </div>
                </form>
              ) : (
                <button onClick={abrirNuevoFamiliar}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:border-[#093E7A]/40 hover:text-[#093E7A] transition-colors duration-150 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                  Agregar familiar
                </button>
              )}

              {/* Listado */}
              {cargandoFam ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-[74px] bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : familiares.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="material-symbols-outlined text-4xl text-gray-300">family_restroom</span>
                  <h4 className="font-black text-gray-700 mt-2">Sin familiares registrados</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Agregue al menos un apoderado para poder contactarlo y citarlo.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {familiares.map((f) => (
                    <li key={f.id_familiar}
                      className="flex items-center justify-between gap-3 p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-blue-50 text-[#093E7A] shrink-0">
                          <span className="material-symbols-outlined">family_restroom</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-700 truncate">{f.nombre}</p>
                          <p className="text-[11px] text-slate-500 font-bold uppercase truncate">
                            {f.parentesco || "Sin parentesco"} · DNI {f.dni} · Tel {f.telefono || "sin número"}
                          </p>
                          {f.email && <p className="text-[11px] text-slate-400 truncate">{f.email}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => abrirEditarFamiliar(f)} title="Editar familiar"
                          className="p-2 text-slate-400 hover:text-[#093E7A] hover:bg-[#093E7A]/5 rounded-lg transition-colors duration-150">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button onClick={() => setConfirmarBaja(f)} title="Eliminar familiar"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150">
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMACIÓN DE BAJA (encima del modal) */}
      {confirmarBaja && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div role="alertdialog" aria-modal="true" className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-in">
            <h3 className="text-lg font-black text-gray-900">Quitar familiar</h3>
            <p className="text-gray-600 text-sm mt-2 leading-relaxed">
              ¿Seguro que desea quitar a <b>{confirmarBaja.nombre}</b> de {alumno.nombres} {alumno.apellidos}?
              Si no está vinculado a otro estudiante, su registro se eliminará.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmarBaja(null)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-150">
                Cancelar
              </button>
              <button onClick={eliminarFamiliar} disabled={famGuardando}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-[background-color,transform] duration-150 ease-out active:scale-[0.98] disabled:opacity-60">
                {famGuardando ? "Quitando..." : "Sí, quitar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
