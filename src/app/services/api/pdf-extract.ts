import type {
  DrawingPdfExtractRequest,
  DrawingPdfExtractResponse,
} from "@platform/contracts/generated/http";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isPdfFile(file: File): boolean {
  return normalizeDrawingDocumentMimeType(file) === "application/pdf";
}

const SUPPORTED_DRAWING_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/x-tiff",
] as const;

const SUPPORTED_DRAWING_DOCUMENT_MIME_SET = new Set<string>(
  SUPPORTED_DRAWING_DOCUMENT_MIME_TYPES,
);

function inferDrawingDocumentMimeTypeFromName(fileName: string): string {
  const lower = String(fileName).toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg")) return "image/jpg";
  if (lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".bmp")) return "image/bmp";
  if (lower.endsWith(".tif")) return "image/tiff";
  if (lower.endsWith(".tiff")) return "image/tiff";
  return "application/octet-stream";
}

export function normalizeDrawingDocumentMimeType(file: File): string {
  const fromType = String(file.type || "").toLowerCase();
  if (SUPPORTED_DRAWING_DOCUMENT_MIME_SET.has(fromType)) {
    return fromType;
  }
  const inferred = inferDrawingDocumentMimeTypeFromName(file.name);
  if (SUPPORTED_DRAWING_DOCUMENT_MIME_SET.has(inferred)) {
    return inferred;
  }
  return fromType || inferred;
}

export function isSupportedDrawingDocument(file: File): boolean {
  return SUPPORTED_DRAWING_DOCUMENT_MIME_SET.has(
    normalizeDrawingDocumentMimeType(file),
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.replace(/^data:[^;]+;base64,/, ""));
    };
    reader.onerror = () => reject(reader.error ?? new Error("failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function buildPdfExtractRequest(file: File): Promise<DrawingPdfExtractRequest> {
  const base64 = await fileToBase64(file);
  return {
    files: [
      {
        fileName: file.name,
        mimeType: normalizeDrawingDocumentMimeType(file),
        base64,
      },
    ],
    options: {
      table: {
        mode: "balanced",
        extractTitleBlock: true,
        extractBom: true,
      },
      cad: {
        enable: true,
        extractContours: true,
        partRecognitionMode: "off",
      },
      ocr: {
        enableFallback: true,
      },
    },
  };
}

export async function extractPdfDrawing(
  file: File,
  testParams = "",
): Promise<DrawingPdfExtractResponse> {
  const request = await buildPdfExtractRequest(file);
  const url = `/api/drawing/pdf/extract${isNonEmptyString(testParams) ? testParams : ""}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = String(payload?.message ?? payload?.error ?? `HTTP_${response.status}`);
    throw new Error(message);
  }
  return payload as DrawingPdfExtractResponse;
}
