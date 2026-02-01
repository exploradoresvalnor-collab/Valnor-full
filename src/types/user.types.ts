/**
 * Tipos de Usuario - Valnor Juego
 */

export interface User {
  id: string;
  email: string;
  username: string;
  isVerified: boolean;
  walletAddress?: string;
  val: number;
  boletos: number;
  evo: number;
  energia: number;
  energiaMaxima: number;
  ultimoReinicioEnergia?: Date;
  invocaciones: number;
  evoluciones: number;
  boletosDiarios: number;
  ultimoReinicio?: Date;
  personajeActivoId?: string;
  personajes: any[];
  inventarioEquipamiento: string[];
  inventarioConsumibles: any[];
  limiteInventarioEquipamiento: number;
  limiteInventarioConsumibles: number;
  fechaRegistro: Date;
  ultimaActualizacion: Date;
  receivedPioneerPackage?: boolean;
}
