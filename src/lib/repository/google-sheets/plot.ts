/**
 * Google Sheets adapter — PlotRegistry, PlotDocuments, PlotOwners, PolygonCoordinates.
 * All sheets live in the shared Lô Rừng spreadsheet (SHEETS_ID_LORUNG), managed by AppSheet.
 *
 * PlotRegistry columns (A–X):
 *   A=PlotID, B=LandTitle, C=AreaHa, D=TreeSpecies, E=DeforestationRiskStatus,
 *   F=ActualQuantityDelivered, G=nha_may, H=lat, I=lng, J=commune, K=district,
 *   L=province, M=planted_at, N=harvest_plan, O=rotation_years, P=density_per_ha,
 *   Q=prev_harvests, R=elevation_m, S=slope_deg, T=soil_type, U=certificate,
 *   V=cert_id, W=created_at, X=updated_at
 *
 * PlotOwners: A=id, B=plot_id, C=ten, D=cccd, E=vai_tro, F=ty_le
 * PolygonCoordinates: A=id, B=plot_id, C=lat, D=lng, E=thu_tu
 * PlotDocuments: A=id, B=plot_id, C=ten_tai_lieu, D=loai, E=drive_url, F=uploaded_at, G=uploaded_by
 */

import type {
  PlotRegistry,
  PlotOwner,
  PolygonCoordinate,
  PlotDocument,
  DeforestationRiskStatus,
} from "../../../types/index";
import type { PlotRepository } from "../types";
import type { ListQuery } from "../../../types/api";
import { readRangeById, cell, numCell, numOrNull, strOrNull, queueUpdateById } from "./base";
import { cache, TTL, cacheKey, listCacheKey } from "../../cache";
import { LORUNG_SHEETS_ID } from "../../plants/config";

// ─── Column indices ───────────────────────────────────────────────────────────

const R = {
  PLOT_ID: 0, LAND_TITLE: 1, AREA_HA: 2, TREE_SPECIES: 3, DEFO_RISK: 4,
  ACTUAL_QTY: 5, NHA_MAY: 6, LAT: 7, LNG: 8, COMMUNE: 9, DISTRICT: 10,
  PROVINCE: 11, PLANTED_AT: 12, HARVEST_PLAN: 13, ROTATION_YEARS: 14,
  DENSITY_PER_HA: 15, PREV_HARVESTS: 16, ELEVATION_M: 17, SLOPE_DEG: 18,
  SOIL_TYPE: 19, CERTIFICATE: 20, CERT_ID: 21, CREATED_AT: 22, UPDATED_AT: 23,
} as const;

const R_LEN = 24;

const O = { ID: 0, PLOT_ID: 1, TEN: 2, CCCD: 3, VAI_TRO: 4, TY_LE: 5 } as const;
const C = { ID: 0, PLOT_ID: 1, LAT: 2, LNG: 3, THU_TU: 4 } as const;
const D = { ID: 0, PLOT_ID: 1, TEN_TAI_LIEU: 2, LOAI: 3, DRIVE_URL: 4, UPLOADED_AT: 5, UPLOADED_BY: 6 } as const;

const SHEET = "PlotRegistry";
const OWNERS_SHEET = "PlotOwners";
const POLY_SHEET = "PolygonCoordinates";
const DOCS_SHEET = "PlotDocuments";

// ─── Row mapping ──────────────────────────────────────────────────────────────

export function rowToPlot(row: string[]): PlotRegistry {
  return {
    PlotID: cell(row, R.PLOT_ID),
    LandTitle: cell(row, R.LAND_TITLE),
    AreaHa: numCell(row, R.AREA_HA),
    TreeSpecies: cell(row, R.TREE_SPECIES),
    DeforestationRiskStatus: cell(row, R.DEFO_RISK) as DeforestationRiskStatus,
    ActualQuantityDelivered: numCell(row, R.ACTUAL_QTY),
    nha_may: cell(row, R.NHA_MAY),
    lat: numOrNull(row, R.LAT),
    lng: numOrNull(row, R.LNG),
    commune: strOrNull(row, R.COMMUNE),
    district: strOrNull(row, R.DISTRICT),
    province: strOrNull(row, R.PROVINCE),
    planted_at: strOrNull(row, R.PLANTED_AT),
    harvest_plan: strOrNull(row, R.HARVEST_PLAN),
    rotation_years: numOrNull(row, R.ROTATION_YEARS),
    density_per_ha: numOrNull(row, R.DENSITY_PER_HA),
    prev_harvests: numCell(row, R.PREV_HARVESTS),
    elevation_m: numOrNull(row, R.ELEVATION_M),
    slope_deg: numOrNull(row, R.SLOPE_DEG),
    soil_type: strOrNull(row, R.SOIL_TYPE),
    certificate: strOrNull(row, R.CERTIFICATE),
    cert_id: strOrNull(row, R.CERT_ID),
    created_at: cell(row, R.CREATED_AT),
    updated_at: cell(row, R.UPDATED_AT),
  };
}

export function plotToRow(p: PlotRegistry): string[] {
  const row = new Array<string>(R_LEN).fill("");
  row[R.PLOT_ID] = p.PlotID;
  row[R.LAND_TITLE] = p.LandTitle;
  row[R.AREA_HA] = String(p.AreaHa);
  row[R.TREE_SPECIES] = p.TreeSpecies;
  row[R.DEFO_RISK] = p.DeforestationRiskStatus;
  row[R.ACTUAL_QTY] = String(p.ActualQuantityDelivered);
  row[R.NHA_MAY] = p.nha_may;
  row[R.LAT] = p.lat != null ? String(p.lat) : "";
  row[R.LNG] = p.lng != null ? String(p.lng) : "";
  row[R.COMMUNE] = p.commune ?? "";
  row[R.DISTRICT] = p.district ?? "";
  row[R.PROVINCE] = p.province ?? "";
  row[R.PLANTED_AT] = p.planted_at ?? "";
  row[R.HARVEST_PLAN] = p.harvest_plan ?? "";
  row[R.ROTATION_YEARS] = p.rotation_years != null ? String(p.rotation_years) : "";
  row[R.DENSITY_PER_HA] = p.density_per_ha != null ? String(p.density_per_ha) : "";
  row[R.PREV_HARVESTS] = String(p.prev_harvests);
  row[R.ELEVATION_M] = p.elevation_m != null ? String(p.elevation_m) : "";
  row[R.SLOPE_DEG] = p.slope_deg != null ? String(p.slope_deg) : "";
  row[R.SOIL_TYPE] = p.soil_type ?? "";
  row[R.CERTIFICATE] = p.certificate ?? "";
  row[R.CERT_ID] = p.cert_id ?? "";
  row[R.CREATED_AT] = p.created_at;
  row[R.UPDATED_AT] = p.updated_at;
  return row;
}

function rowToOwner(row: string[]): PlotOwner {
  return {
    id: cell(row, O.ID),
    plot_id: cell(row, O.PLOT_ID),
    ten: cell(row, O.TEN),
    cccd: cell(row, O.CCCD),
    vai_tro: cell(row, O.VAI_TRO),
    ty_le: numOrNull(row, O.TY_LE),
  };
}

function rowToCoord(row: string[]): PolygonCoordinate {
  return {
    id: cell(row, C.ID),
    plot_id: cell(row, C.PLOT_ID),
    lat: numCell(row, C.LAT),
    lng: numCell(row, C.LNG),
    thu_tu: numCell(row, C.THU_TU),
  };
}

function rowToDocument(row: string[]): PlotDocument {
  return {
    id: cell(row, D.ID),
    plot_id: cell(row, D.PLOT_ID),
    ten_tai_lieu: cell(row, D.TEN_TAI_LIEU),
    loai: cell(row, D.LOAI),
    drive_url: cell(row, D.DRIVE_URL),
    uploaded_at: cell(row, D.UPLOADED_AT),
    uploaded_by: cell(row, D.UPLOADED_BY),
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

export function makePlotRepository(plantId: string): PlotRepository {
  async function getAllPlots(): Promise<PlotRegistry[]> {
    const key = listCacheKey("plot", plantId, "all");
    const cached = cache.get<PlotRegistry[]>(key);
    if (cached) return cached;

    const rows = await readRangeById(LORUNG_SHEETS_ID, `${SHEET}!A2:X`);
    const plots = rows
      .filter((r) => r[R.PLOT_ID] && r[R.NHA_MAY] === plantId)
      .map(rowToPlot);

    cache.set(key, plots, TTL.REFERENCE);
    return plots;
  }

  return {
    async list(_plantId: string, query?: ListQuery): Promise<PlotRegistry[]> {
      const all = await getAllPlots();
      if (!query?.search) return all;
      const q = query.search.toLowerCase();
      return all.filter(
        (p) =>
          p.PlotID.toLowerCase().includes(q) ||
          p.LandTitle.toLowerCase().includes(q) ||
          p.TreeSpecies.toLowerCase().includes(q),
      );
    },

    async get(_plantId: string, id: string): Promise<PlotRegistry | null> {
      const key = cacheKey("plot", plantId, id);
      const cached = cache.get<PlotRegistry>(key);
      if (cached) return cached;

      const all = await getAllPlots();
      const found = all.find((p) => p.PlotID === id) ?? null;
      if (found) cache.set(key, found, TTL.REFERENCE);
      return found;
    },

    async update(_plantId: string, id: string, patch: Partial<PlotRegistry>): Promise<PlotRegistry> {
      cache.invalidate(`plot:${plantId}:*`);
      const rows = await readRangeById(LORUNG_SHEETS_ID, `${SHEET}!A2:X`);
      const idx = rows.findIndex((r) => r[R.PLOT_ID] === id);
      if (idx === -1) throw new Error(`Plot ${id} not found`);

      const updated: PlotRegistry = {
        ...rowToPlot(rows[idx]),
        ...patch,
        updated_at: new Date().toISOString(),
      };
      await queueUpdateById(LORUNG_SHEETS_ID, `${SHEET}!A${idx + 2}:X${idx + 2}`, [plotToRow(updated)]);
      cache.invalidate(`plot:${plantId}:*`);
      return updated;
    },

    async getWithDetails(_plantId: string, plotId: string): Promise<PlotRegistry | null> {
      const key = cacheKey("plot-detail", plantId, plotId);
      const cached = cache.get<PlotRegistry>(key);
      if (cached) return cached;

      const all = await getAllPlots();
      const plot = all.find((p) => p.PlotID === plotId);
      if (!plot) return null;

      const [ownerRows, coordRows, docRows] = await Promise.all([
        readRangeById(LORUNG_SHEETS_ID, `${OWNERS_SHEET}!A2:F`),
        readRangeById(LORUNG_SHEETS_ID, `${POLY_SHEET}!A2:E`),
        readRangeById(LORUNG_SHEETS_ID, `${DOCS_SHEET}!A2:G`),
      ]);

      const result: PlotRegistry = {
        ...plot,
        owners: ownerRows.filter((r) => r[O.PLOT_ID] === plotId).map(rowToOwner),
        polygon: coordRows
          .filter((r) => r[C.PLOT_ID] === plotId)
          .map(rowToCoord)
          .sort((a, b) => a.thu_tu - b.thu_tu),
        documents: docRows.filter((r) => r[D.PLOT_ID] === plotId).map(rowToDocument),
      };

      cache.set(key, result, TTL.REFERENCE);
      return result;
    },
  };
}
