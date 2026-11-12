import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { freeUnits, nightlyRate, ratesForStay, seasonOn, stayDays, type SeasonRange } from "@/lib/booking/native/engine";

const PRICES = { priceLow: 2_200_000, priceShoulder: 2_337_500, priceHigh: 2_800_000 };
const RULES = { extendedStayMinNights: 3, extendedStayDiscountPct: 5 };

describe("stayDays", () => {
  it("lists the nights: check-in day up to, not including, check-out day", () => {
    assert.deepEqual(stayDays("2026-12-10", "2026-12-13"), ["2026-12-10", "2026-12-11", "2026-12-12"]);
  });

  it("crosses month and year ends", () => {
    assert.deepEqual(stayDays("2026-12-30", "2027-01-02"), ["2026-12-30", "2026-12-31", "2027-01-01"]);
  });

  it("has no nights when check-out is not after check-in", () => {
    assert.deepEqual(stayDays("2026-12-10", "2026-12-10"), []);
    assert.deepEqual(stayDays("2026-12-10", "2026-12-09"), []);
  });
});

describe("seasonOn", () => {
  const ranges: SeasonRange[] = [
    { season: "shoulder", startsOn: "2026-05-01", endsOn: "2026-07-01" },
    { season: "high", startsOn: "2026-06-15", endsOn: "2026-09-01" },
  ];

  it("is low season outside every range", () => {
    assert.equal(seasonOn("2026-12-10", ranges), "low");
    assert.equal(seasonOn("2026-12-10", []), "low");
  });

  it("includes the first day of a range and excludes the day it ends on", () => {
    assert.equal(seasonOn("2026-05-01", ranges), "shoulder");
    assert.equal(seasonOn("2026-04-30", ranges), "low");
    assert.equal(seasonOn("2026-08-31", ranges), "high");
    assert.equal(seasonOn("2026-09-01", ranges), "low");
  });

  it("lets high season win where ranges overlap", () => {
    assert.equal(seasonOn("2026-06-20", ranges), "high");
  });
});

describe("nightlyRate", () => {
  it("prices each night by its own season", () => {
    const ranges: SeasonRange[] = [{ season: "high", startsOn: "2026-12-20", endsOn: "2027-01-05" }];
    const rates = stayDays("2026-12-19", "2026-12-22").map((day) => nightlyRate(PRICES, day, ranges));
    assert.deepEqual(rates, [2_200_000, 2_800_000, 2_800_000]);
  });
});

describe("freeUnits", () => {
  const days = stayDays("2026-12-10", "2026-12-13");

  it("is every room when nothing holds any", () => {
    assert.equal(freeUnits(4, days, []), 4);
  });

  it("lets a guest arrive on the day another leaves", () => {
    const holds = [{ startsOn: "2026-12-07", endsOn: "2026-12-10", units: 1 }];
    assert.equal(freeUnits(1, days, holds), 1);
  });

  it("counts a stay that overlaps by one night", () => {
    const holds = [{ startsOn: "2026-12-12", endsOn: "2026-12-14", units: 1 }];
    assert.equal(freeUnits(1, days, holds), 0);
    assert.equal(freeUnits(2, days, holds), 1);
  });

  it("is decided by the busiest night of the stay", () => {
    const holds = [
      { startsOn: "2026-12-10", endsOn: "2026-12-11", units: 1 },
      { startsOn: "2026-12-11", endsOn: "2026-12-12", units: 3 },
    ];
    assert.equal(freeUnits(4, days, holds), 1);
  });

  it("never goes below zero and is zero without nights", () => {
    assert.equal(freeUnits(1, days, [{ startsOn: "2026-12-01", endsOn: "2026-12-30", units: 5 }]), 0);
    assert.equal(freeUnits(4, [], []), 0);
  });
});

describe("ratesForStay", () => {
  const days = stayDays("2026-12-10", "2026-12-13");
  const nightly = [2_200_000, 2_200_000, 2_200_000];

  it("offers the extended-stay rate first from three nights, 5% under the standard rate", () => {
    const [extended, standard] = ratesForStay("dlx-king", days, nightly, RULES);
    assert.equal(standard.name, "Standard Rate");
    assert.equal(standard.total, 6_600_000);
    assert.equal(extended.name, "Extended Stay - Three Nights or More");
    assert.equal(extended.total, 6_270_000);
    assert.equal(extended.compareAtTotal, 6_600_000);
    assert.deepEqual(extended.nightly[0], { date: "2026-12-10", rate: 2_090_000 });
  });

  it("offers only the standard rate for shorter stays", () => {
    const rates = ratesForStay("dlx-king", days.slice(0, 2), nightly.slice(0, 2), RULES);
    assert.deepEqual(
      rates.map((rate) => rate.name),
      ["Standard Rate"],
    );
  });

  it("switches the extended rate off at 0%", () => {
    assert.equal(ratesForStay("dlx-king", days, nightly, { ...RULES, extendedStayDiscountPct: 0 }).length, 1);
  });

  it("applies the discount to each night, so mixed seasons stay in proportion", () => {
    const [extended] = ratesForStay("dlx-king", days, [2_200_000, 2_800_000, 2_800_000], RULES);
    assert.equal(extended.total, 2_090_000 + 2_660_000 + 2_660_000);
  });
});
