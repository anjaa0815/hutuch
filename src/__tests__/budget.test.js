import { describe, it, expect } from "vitest";
import { SYSTEMS, COMMON_ITEMS, DEFAULT_SELECTIONS } from "../BuildEstimator.jsx";
import { lineToMass } from "../miBenchmark.jsx";
import { CEILING_INSULATION_U } from "../energyEstimate.js";

const ALL = [...SYSTEMS.flatMap((s) => s.options.flatMap((o) => o.items)), ...COMMON_ITEMS];

describe("Төсвийн мөрүүд", () => {
  it("материалын key давхцахгүй", () => {
    const keys = ALL.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it("анхдагч сонголт бүр SYSTEMS-д байна", () => {
    for (const sys of SYSTEMS) {
      expect(sys.options.some((o) => o.id === DEFAULT_SELECTIONS[sys.comp]), sys.comp).toBe(true);
    }
  });
  it("мөр бүрийг RASMI жишиг таньдаг (miBenchmark RULES)", () => {
    const unknown = ALL.filter((d) => lineToMass(d.name, d.unit, 1) === null).map((d) => d.key);
    expect(unknown).toEqual([]);
  });
  it("таазны дулаалгын сонголт бүр U-утгатай (energyEstimate)", () => {
    const sys = SYSTEMS.find((s) => s.comp === "ceilInsulation");
    for (const o of sys.options) expect(CEILING_INSULATION_U[o.id], o.id).toBeTypeOf("number");
  });
});
