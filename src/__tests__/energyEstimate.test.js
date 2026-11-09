import { describe, it, expect } from "vitest";
import { wallU, heatBalance, estimateHeating, CEILING_INSULATION_U, HDD_ZONES, UB_CLIMATE } from "../energyEstimate.js";

describe("wallU", () => {
  it("дулаалга нэмэхэд U буурна", () => {
    const bare = wallU("cement_block", "none", 0.2);
    const ins = wallU("cement_block", "eps100", 0.2);
    expect(ins).toBeLessThan(bare);
    expect(ins).toBeGreaterThan(0.25);
    expect(ins).toBeLessThan(0.4);
  });
  it("үл мэдэгдэх хана → null", () => {
    expect(wallU("nope", "eps100", 0.2)).toBeNull();
  });
});

describe("heatBalance", () => {
  it("Q = H·ΔT, жилийн кВт·ц = H·24·ГХ/1000", () => {
    const r = heatBalance({ wallArea: 100, winArea: 10, roofArea: 50, floorArea: 50, volume: 135, uWall: 0.3, uWin: 1.8, uRoof: 0.2 });
    expect(r.dT).toBe(UB_CLIMATE.tIn - UB_CLIMATE.tOut);
    expect(r.Q).toBeCloseTo(r.H * r.dT);
    expect(r.annualKwh).toBeCloseTo(r.H * 24 * UB_CLIMATE.hdd / 1000);
  });
});

describe("estimateHeating — таазны дулаалга", () => {
  const geo = { extNet: 100, winArea: 8, floors: 1, sumArea: 60, floorArea: 60 };
  const settings = { extT: 0.3, wallH: 2.7 };
  const base = { extWall: "eps_block", insulation: "eps100", windows: "pvc" };
  const opts = { roofU: 1.1, ach: 0.5, tIn: 20, tOut: -39, hdd: 7800, price: 180 };

  it("материалын сонголтын U-г ашиглана", () => {
    const r = estimateHeating(geo, settings, { ...base, ceilInsulation: "rw200" }, opts);
    expect(r.uRoof).toBe(CEILING_INSULATION_U.rw200);
  });
  it("200мм нь дулаалгагүйгээс хэмнэлттэй", () => {
    const a = estimateHeating(geo, settings, { ...base, ceilInsulation: "rw200" }, opts);
    const b = estimateHeating(geo, settings, { ...base, ceilInsulation: "none" }, opts);
    expect(a.annualCost).toBeLessThan(b.annualCost);
  });
  it("хуучин төсөлд (ceilInsulation байхгүй) гараар сонгосон roofU-г ашиглана", () => {
    const r = estimateHeating(geo, settings, base, opts);
    expect(r.uRoof).toBe(opts.roofU);
  });
});

describe("HDD_ZONES", () => {
  it("4 бүс, буурах дарааллаар", () => {
    expect(HDD_ZONES.map((z) => z.hdd)).toEqual([7000, 6500, 6000, 5000]);
  });
});
