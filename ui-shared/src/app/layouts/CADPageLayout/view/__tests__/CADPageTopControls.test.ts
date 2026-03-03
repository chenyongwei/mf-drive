import { resolveFileInputAccept } from "../CADPageTopControls.accept";

describe("CADPageTopControls", () => {
  test("file input accept includes pdf and image extensions when PDF upload is enabled", () => {
    const accept = resolveFileInputAccept(["DXF", "PDF"]);
    expect(accept).toContain(".dxf");
    expect(accept).toContain(".pdf");
    expect(accept).toContain(".png");
    expect(accept).toContain(".jpg");
    expect(accept).toContain(".jpeg");
    expect(accept).toContain(".webp");
    expect(accept).toContain(".bmp");
    expect(accept).toContain(".tif");
    expect(accept).toContain(".tiff");
  });
});
