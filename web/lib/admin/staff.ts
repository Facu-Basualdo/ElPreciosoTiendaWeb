// Personal del panel (tabla staff). Todo el staff activo es administrador: no hay roles.
export type PersonaStaff = {
  userId: string;
  email: string;
  nombre: string;
  activo: boolean;
};
