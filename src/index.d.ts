declare namespace NodeJS {
  interface ProcessEnv {
    readonly PORT: number;
    readonly ADDRESS: string;
  }
}
