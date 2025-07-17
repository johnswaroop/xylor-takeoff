declare module "pdf-poppler" {
  interface ConvertOptions {
    format?: "png" | "jpeg" | "pdf";
    out_dir?: string;
    out_prefix?: string;
    page?: number;
    single_file?: boolean;
    print_only_subpdf?: boolean;
    scale?: number;
    opw?: string;
    upw?: string;
  }

  function convert(file: string, options?: ConvertOptions): Promise<string[]>;

  export = { convert };
}
