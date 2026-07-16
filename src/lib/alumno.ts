// El backend devuelve dos formas de alumno: buscar-alumnos entrega
// nombres/apellidos y alumnos-en-riesgo entrega nombre_completo.
export function nombreAlumno(alumno: any): string {
  return (
    alumno?.nombre_completo ||
    `${alumno?.nombres ?? ""} ${alumno?.apellidos ?? ""}`.trim()
  );
}
