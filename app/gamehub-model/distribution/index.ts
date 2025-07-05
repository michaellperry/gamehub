import { DistributionRules } from "jinaga";
import { tenantDistribution } from "./tenantDistribution.js";

export const distribution = (d: DistributionRules) => d
  .with(tenantDistribution)
  ;