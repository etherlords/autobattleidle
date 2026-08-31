type D1Result<T> = {
  readonly results: readonly T[];
};
type D1RunResult = {
  readonly meta: { readonly changes: number };
};
type D1PreparedStatement = {
  bind(...values: readonly unknown[]): D1PreparedStatement;
  all<T>(): Promise<D1Result<T>>;
  first<T>(): Promise<T | null>;
  raw<T>(): Promise<readonly T[]>;
  run(): Promise<D1RunResult>;
};
type D1Database = {
  prepare(query: string): D1PreparedStatement;
};
type ExportedHandler<E> = {
  fetch(request: Request, env: E): Response | Promise<Response>;
};
