// Erro "esperado": lançado deliberadamente pela camada de service quando uma
// regra de negócio ou validação falha (ex: email já cadastrado, senha errada).
// Diferente de um erro inesperado (bug), que deve ir pro log como "error" e
// nunca vazar detalhe interno pro cliente.
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
