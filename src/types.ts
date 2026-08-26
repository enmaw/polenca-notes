export interface Casal {
  id: string;
  membros: string[];
  nomes?: Record<string, string>;
  codigoConvite: string;
  criadoEm: number;
}

export interface Nota {
  id: string;
  casalId: string;
  autorId: string;
  autorNome: string;
  texto: string;
  humor?: string;
  fotoUrl?: string;
  reacoes?: Record<string, string>;
  animacoes?: number;
  criadoEm: number;
  editadoEm?: number;
  privada: boolean;
}

export interface Status {
  id: string;
  casalId: string;
  texto: string;
  emoji?: string;
  atualizadoEm: number;
}
