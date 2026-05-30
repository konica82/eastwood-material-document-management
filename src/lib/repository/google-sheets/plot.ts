/**
 * Google Sheets adapter — PlotRegistry, PlotDocuments, PlotOwners, PolygonCoordinates.
 * All sheets live in the shared Lô Rừng spreadsheet (SHEETS_ID_LORUNG), managed by AppSheet.
 *
 * PlotRegistry columns (A=0 … Z=25):
 *   A=PlotID, B=OwnerCount, C=LandTitle, D=AreaHa, E=GeolocationTypes,
 *   F=CenterLatitude, G=CenterLongitude, H=TreeSpecies, I=ScientificName,
 *   J=PlantedYear, K=HarvestDate, L=HarvestEndDate, M=VolumeM3, N=QuantityTon,
 *   O=CountryOfProduction, P=Province, Q=District, R=Commune, S=Certifications,
 *   T=DeforestationRiskStatus, U=RiskScore, V=VerificationDate, W=ValidationStatus,
 *   X=Image, Y=ImagesUrl, Z=Notes
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
  PLOT_ID: 0, OWNER_COUNT: 1, LAND_TITLE: 2, AREA_HA: 3, GEO_TYPES: 4,
  LAT: 5, LNG: 6, TREE_SPECIES: 7, SCIENTIFIC_NAME: 8, PLANTED_YEAR: 9,
  HARVEST_DATE: 10, HARVEST_END: 11, VOLUME_M3: 12, QUANTITY_TON: 13,
  COUNTRY: 14, PROVINCE: 15, DISTRICT: 16, COMMUNE: 17, CERTIFICATIONS: 18,
  DEFO_RISK: 19, RISK_SCORE: 20, VERIFICATION_DATE: 21, VALIDATION_STATUS: 22,
  IMAGE: 23, IMAGES_URL: 24, NOTES: 25,
} as const;

const R_LEN = 26;

const O = { ID: 0, PLOT_ID: 1, TEN: 2, CCCD: 3, VAI_TRO: 4, TY_LE: 5 } as const;
const C = { ID: 0, PLOT_ID: 1, LAT: 2, LNG: 3, THU_TU: 4 } as const;
const D = { ID: 0, PLOT_ID: 1, TEN_TAI_LIEU: 2, LOAI: 3, DRIVE_URL: 4, UPLOADED_AT: 5, UPLOADED_BY: 6 } as const;

const SHEET = "PlotRegistry";
const OWNERS_SHEET = "PlotOwners";
const POLY_SHEET = "PolygonCoordinates";
const DOCS_SHEET = "PlotDocuments";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a bare year ("2022" or 2022) to an ISO date string "2022-01-01". */
function yearToIso(value: string | null): string | null {
  if (!value) return null;
  const year = parseInt(value, 10);
  if (isNaN(year) || year < 1900 || year > 2100) return null;
  return `${year}-01-01`;
}

// ─── Row mapping ──────────────────────────────────────────────────────────────

export function rowToPlot(row: string[]): PlotRegistry {
  return {
    PlotID: cell(row, R.PLOT_ID),
    LandTitle: cell(row, R.LAND_TITLE),
    AreaHa: numCell(row, R.AREA_HA),
    TreeSpecies: cell(row, R.TREE_SPECIES),
    DeforestationRiskStatus: (strOrNull(row, R.DEFO_RISK) ?? 'Chưa đánh giá') as DeforestationRiskStatus,
    ActualQuantityDelivered: numCell(row, R.QUANTITY_TON),
    nha_may: "",  // shared sheet — no plant filter
    lat: numOrNull(row, R.LAT),
    lng: numOrNull(row, R.LNG),
    commune: strOrNull(row, R.COMMUNE),
    district: strOrNull(row, R.DISTRICT),
    province: strOrNull(row, R.PROVINCE),
    planted_at: yearToIso(strOrNull(row, R.PLANTED_YEAR)),
    harvest_plan: strOrNull(row, R.HARVEST_DATE),
    rotation_years: null,
    density_per_ha: null,
    prev_harvests: 0,
    elevation_m: null,
    slope_deg: null,
    soil_type: null,
    certificate: strOrNull(row, R.CERTIFICATIONS),
    cert_id: strOrNull(row, R.VALIDATION_STATUS),
    created_at: strOrNull(row, R.VERIFICATION_DATE) ?? "",
    updated_at: strOrNull(row, R.VERIFICATION_DATE) ?? "",
  };
}

export function plotToRow(p: PlotRegistry): string[] {
  const row = new Array<string>(R_LEN).fill("");
  row[R.PLOT_ID] = p.PlotID;
  row[R.LAND_TITLE] = p.LandTitle;
  row[R.AREA_HA] = String(p.AreaHa);
  row[R.TREE_SPECIES] = p.TreeSpecies;
  row[R.DEFO_RISK] = p.DeforestationRiskStatus;
  row[R.QUANTITY_TON] = String(p.ActualQuantityDelivered);
  row[R.LAT] = p.lat != null ? String(p.lat) : "";
  row[R.LNG] = p.lng != null ? String(p.lng) : "";
  row[R.COMMUNE] = p.commune ?? "";
  row[R.DISTRICT] = p.district ?? "";
  row[R.PROVINCE] = p.province ?? "";
  row[R.PLANTED_YEAR] = p.planted_at ?? "";
  row[R.HARVEST_DATE] = p.harvest_plan ?? "";
  row[R.CERTIFICATIONS] = p.certificate ?? "";
  row[R.VALIDATION_STATUS] = p.cert_id ?? "";
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

    const rows = await readRangeById(LORUNG_SHEETS_ID, `${SHEET}!A2:Z`);
    const plots = rows
      .filter((r) => r[R.PLOT_ID])   // skip blank rows
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
      const rows = await readRangeById(LORUNG_SHEETS_ID, `${SHEET}!A2:Z`);
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
