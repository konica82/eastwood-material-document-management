/**
 * Google Sheets repository adapter exports.
 *
 * Each factory function accepts a plantId and returns the repository
 * implementation that reads from/writes to that plant's spreadsheet.
 *
 * The repository factory (src/lib/repository/index.ts) selects the default
 * plant; callers that need per-request plant scoping pass plantId explicitly.
 */

export { makeUserRepository } from "./user";
export { makeMaterialRepository } from "./material";
export { makeDriverRepository } from "./driver";
export { makeSupplierRepository } from "./supplier";
export { makePlotRepository } from "./plot";
export { makeWeighingSlipRepository } from "./weighing-slip";
export { makeCargoRepository } from "./cargo";
export { makeActivityLogRepository } from "./activity-log";
export { makeDashboardRepository } from "./dashboard";
