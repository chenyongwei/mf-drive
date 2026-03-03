import { shouldNotifyAllPlaced } from "../unplacedCountNotifier";

describe("shouldNotifyAllPlaced", () => {
  test("returns true only when count transitions from positive to zero", () => {
    expect(shouldNotifyAllPlaced(3, 0)).toBe(true);
    expect(shouldNotifyAllPlaced(1, 0)).toBe(true);
  });

  test("does not notify when zero stays zero or first value is unknown", () => {
    expect(shouldNotifyAllPlaced(0, 0)).toBe(false);
    expect(shouldNotifyAllPlaced(null, 0)).toBe(false);
    expect(shouldNotifyAllPlaced(undefined, 0)).toBe(false);
  });

  test("does not notify when there are still unplaced parts", () => {
    expect(shouldNotifyAllPlaced(4, 2)).toBe(false);
    expect(shouldNotifyAllPlaced(2, 1)).toBe(false);
  });
});
