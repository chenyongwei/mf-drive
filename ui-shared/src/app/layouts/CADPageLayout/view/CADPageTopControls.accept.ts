export type CadUploadFileType = "DXF" | "PRTS" | "PDF";

const ACCEPT_BY_TYPE: Record<CadUploadFileType, string> = {
  DXF: ".dxf",
  PRTS: ".prts",
  PDF: ".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff",
};

export function resolveFileInputAccept(
  allowedFileTypes: CadUploadFileType[],
): string {
  return allowedFileTypes.map((type) => ACCEPT_BY_TYPE[type]).join(",");
}
