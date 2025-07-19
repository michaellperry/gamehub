import { DistributionRules } from 'jinaga';
import { bookkeepingDistribution } from './bookkeepingDistribution.js';
import { tenantDistribution } from './tenantDistribution.js';

export const distribution = (d: DistributionRules) =>
    d.with(tenantDistribution).with(bookkeepingDistribution);
