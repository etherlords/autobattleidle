declare module "node:fs" {
  export const readFileSync: (path: URL, encoding: "utf8") => string;
  export const writeFileSync: (path: URL, value: string) => void;
}
