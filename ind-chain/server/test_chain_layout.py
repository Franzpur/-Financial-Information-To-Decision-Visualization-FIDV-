"""BE-CHAIN-LAYOUT fixture test (M3 acceptance)."""
from __future__ import annotations

from chain_layout import assign_chain_rings


def test_half_disk_sides_and_center():
    companies = [
        {"id": 0, "name": "CENTER", "side": None},
        {"id": 1, "name": "SupA", "side": "supplier", "linkPct": 40.0},
        {"id": 2, "name": "SupB", "side": "supplier", "linkPct": None},
        {"id": 3, "name": "CustA", "side": "customer", "linkPct": 20.0},
        {"id": 4, "name": "CustB", "side": "customer", "linkPct": 5.0},
    ]
    assign_chain_rings(companies, center_id=0)
    by_id = {c["id"]: c for c in companies}
    assert by_id[0]["ringCos"] == 0.0 and by_id[0]["ringSin"] == 0.0
    assert by_id[0]["revScore"] == 100.0
    # USER_X_SIGN=-1 ⇒ x = 5 - ringCos*R; supplier needs ringCos > 0
    assert by_id[1]["ringCos"] > 0
    assert by_id[2]["ringCos"] > 0
    assert by_id[3]["ringCos"] < 0
    assert by_id[4]["ringCos"] < 0
    # Stronger supplier nearer center than missing pct
    assert by_id[1]["radial"] < by_id[2]["radial"]


if __name__ == "__main__":
    test_half_disk_sides_and_center()
    print("ok: chain_layout fixture")
