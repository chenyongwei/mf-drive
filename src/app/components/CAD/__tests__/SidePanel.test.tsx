import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import SidePanel from "../SidePanel";
import { PART_SOURCE_DRAG_MIME } from "../types/CADCanvasTypes";

function renderSidePanel(overrides: Partial<React.ComponentProps<typeof SidePanel>> = {}) {
  const baseProps: React.ComponentProps<typeof SidePanel> = {
    files: [
      { id: "part-a", name: "Part A", type: "PRTS" },
      { id: "part-b", name: "Part B", type: "PRTS" },
    ],
    selectedFileId: null,
    selectedFileIds: new Set<string>(),
    checkedFileIds: new Set(["part-a", "part-b"]),
    onFileSelect: () => undefined,
    onSelectionClear: () => undefined,
    onFileCheck: () => undefined,
    isNestingMode: true,
    activeTab: "PRTS",
    onTabChange: () => undefined,
    allowedFileTypes: ["PRTS"],
    theme: "dark",
  };

  return render(<SidePanel {...baseProps} {...overrides} />);
}

function createDataTransferMock(): DataTransfer {
  return {
    setData: jest.fn(),
    getData: jest.fn(),
    effectAllowed: "none",
    dropEffect: "none",
  } as unknown as DataTransfer;
}

describe("SidePanel selection behavior", () => {
  test("renders part name and removes legacy PRTS row badge", () => {
    renderSidePanel();

    const row = screen.getByTestId("file-item-part-a");
    expect(within(row).getByText("Part A")).toBeInTheDocument();
    expect(within(row).queryByText(/^PRTS$/)).not.toBeInTheDocument();
  });

  test("keeps full part metadata in row tooltip for compact display", () => {
    renderSidePanel({
      files: [{ id: "part-a", name: "Part A", type: "PRTS", quantity: 8 }],
      checkedFileIds: new Set(["part-a"]),
      partUnplacedCountByPartId: { "part-a": 3 },
      totalUnplacedCount: 3,
    });

    const row = screen.getByTestId("file-item-part-a");
    expect(row).toHaveAttribute("title", expect.stringContaining("Part A"));
    expect(row).toHaveAttribute("title", expect.stringContaining("Part ID: part-a"));
    expect(row).toHaveAttribute("title", expect.stringContaining("数量: 8"));
    expect(row).toHaveAttribute("title", expect.stringContaining("未排: 3"));
  });

  test("shows quantity controls and thumbnail on the same part row", () => {
    renderSidePanel();

    const row = screen.getByTestId("file-item-part-a");
    expect(within(row).getByDisplayValue("1")).toBeInTheDocument();
    expect(within(row).getByTitle("零件缩略图")).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "-" })).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "+" })).toBeInTheDocument();
  });

  test("supports Ctrl/Cmd row multi-select in nesting PRTS mode", () => {
    const onFileSelect = jest.fn();
    renderSidePanel({ onFileSelect });

    fireEvent.click(screen.getByTestId("file-item-part-a"), { ctrlKey: true });

    expect(onFileSelect).toHaveBeenCalledWith("part-a", {
      additive: true,
      source: "row",
    });
  });

  test("checkbox toggle does not trigger list-row selection callback", () => {
    const onFileSelect = jest.fn();
    const onFileCheck = jest.fn();
    renderSidePanel({
      onFileSelect,
      onFileCheck,
      checkedFileIds: new Set(),
    });

    fireEvent.click(screen.getByTestId("file-checkbox-part-a"));

    expect(onFileCheck).toHaveBeenCalledWith("part-a", true);
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  test("clicking list blank area clears multi selection", () => {
    const onSelectionClear = jest.fn();
    renderSidePanel({ onSelectionClear });

    fireEvent.click(screen.getByTestId("file-list-container"));

    expect(onSelectionClear).toHaveBeenCalledTimes(1);
  });

  test("shows unplaced count summary and row-level unplaced count in PRTS mode", () => {
    renderSidePanel({
      partUnplacedCountByPartId: {
        "part-a": 2,
        "part-b": 1,
      },
      totalUnplacedCount: 3,
    });

    expect(screen.getByText("已选 2 / 2 个文件 · 未排 3")).toBeInTheDocument();
    expect(within(screen.getByTestId("file-item-part-a")).getByText("未排 2")).toBeInTheDocument();
    expect(within(screen.getByTestId("file-item-part-b")).getByText("未排 1")).toBeInTheDocument();
  });

  test("does not show unplaced count outside nesting PRTS mode", () => {
    renderSidePanel({
      files: [{ id: "file-a", name: "Drawing A", type: "DXF" }],
      checkedFileIds: new Set(["file-a"]),
      isNestingMode: false,
      activeTab: "DXF",
      allowedFileTypes: ["DXF"],
      partUnplacedCountByPartId: { "file-a": 3 },
      totalUnplacedCount: 3,
    });

    expect(screen.queryByText(/未排/)).not.toBeInTheDocument();
  });

  test("checked PRTS row supports drag payload for CAD drop", () => {
    renderSidePanel();
    const row = screen.getByTestId("file-item-part-a");
    const dataTransfer = createDataTransferMock();

    fireEvent.dragStart(row, { dataTransfer });

    expect(row).toHaveProperty("draggable", true);
    expect(dataTransfer.setData).toHaveBeenCalledWith(
      PART_SOURCE_DRAG_MIME,
      expect.any(String),
    );
    const payloadRaw = (dataTransfer.setData as unknown as { mock: { calls: Array<[string, string]> } }).mock.calls.find(
      (call) => call[0] === PART_SOURCE_DRAG_MIME,
    )?.[1];
    expect(JSON.parse(payloadRaw)).toEqual({
      sourcePartId: "part-a",
      fileId: "part-a",
      name: "Part A",
    });
  });

  test("unchecked PRTS row is not draggable", () => {
    renderSidePanel({ checkedFileIds: new Set(["part-b"]) });
    const row = screen.getByTestId("file-item-part-a");
    const dataTransfer = createDataTransferMock();

    fireEvent.dragStart(row, { dataTransfer });

    expect(row).toHaveProperty("draggable", false);
    expect(dataTransfer.setData).not.toHaveBeenCalled();
  });

  test("renders thumbnail from part entities (outer + inner) instead of simplified contour", () => {
    const { container } = renderSidePanel({
      files: [
        {
          id: "part-round",
          fileId: "part-round",
          partId: "part-round",
          name: "Round",
          type: "PRTS",
          contour: [
            { x: -80, y: -80 },
            { x: 80, y: -80 },
            { x: 80, y: 80 },
            { x: -80, y: 80 },
          ],
          bbox: { minX: -80, minY: -80, maxX: 80, maxY: 80 },
        },
      ],
      checkedFileIds: new Set(["part-round"]),
      partEntitiesByFileId: {
        "part-round": [
          {
            id: "outer",
            type: "CIRCLE",
            geometry: { center: { x: 0, y: 0 }, radius: 80 },
            processCode: "CUT_NORMAL",
          },
          {
            id: "inner",
            type: "CIRCLE",
            geometry: { center: { x: 0, y: 0 }, radius: 24 },
            isInnerContour: true,
            processCode: "CUT_NORMAL",
          },
        ],
      },
    });

    const path = container.querySelector('[data-testid="file-item-part-round"] svg path');
    expect(path).toBeTruthy();
    const d = path?.getAttribute("d") ?? "";
    expect((d.match(/M/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(path?.getAttribute("fill-rule")).toBe("evenodd");
    expect(path?.getAttribute("stroke")).toBe("#22c55e");
  });

  test("does not render tab switcher labels and shows mixed file list together", () => {
    renderSidePanel({
      files: [
        { id: "file-dxf", name: "Drawing A", type: "DXF" },
        {
          id: "file-pdf",
          name: "Bracket",
          type: "DXF",
          displayType: "PDF",
        },
      ],
      activeTab: "PDF",
      allowedFileTypes: ["DXF", "PDF"],
      checkedFileIds: new Set(["file-pdf", "file-dxf"]),
      isNestingMode: false,
    });

    expect(screen.queryByText("DXF (1)")).not.toBeInTheDocument();
    expect(screen.queryByText("PDF (1)")).not.toBeInTheDocument();
    expect(screen.getByTestId("file-item-file-dxf")).toBeInTheDocument();
    expect(screen.getByTestId("file-item-file-pdf")).toBeInTheDocument();
    expect(screen.getByText("已选 2 / 2 个文件")).toBeInTheDocument();
  });

  test("shows extended attribute preview and full tooltip details on PDF row", () => {
    renderSidePanel({
      files: [
        {
          id: "file-pdf",
          name: "Bracket",
          type: "DXF",
          displayType: "PDF",
          extendedAttributes: [
            { key: "图号", value: "DRW-001" },
            { key: "零件名称", value: "连接支架" },
            { key: "材料", value: "SUS304" },
            { key: "版本", value: "A2" },
          ],
        },
      ],
      activeTab: "PDF",
      allowedFileTypes: ["PDF"],
      checkedFileIds: new Set(["file-pdf"]),
      isNestingMode: false,
    });

    const row = screen.getByTestId("file-item-file-pdf");
    expect(within(row).getByText(/图号: DRW-001/)).toBeInTheDocument();
    expect(within(row).getByText(/零件名称: 连接支架/)).toBeInTheDocument();
    expect(within(row).getByText(/材料: SUS304/)).toBeInTheDocument();
    expect(row).toHaveAttribute("title", expect.stringContaining("版本: A2"));
  });
});
