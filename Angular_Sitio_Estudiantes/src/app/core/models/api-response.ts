export interface ApiResponse<T> {
  operacionExitosa: boolean;
  mensaje: string;
  errores: string[];
  resultado: T;
}
