import { DistributionRules } from 'jinaga';
import { bookkeepingDistribution } from './bookkeepingDistribution.js';
import { challengeDistribution } from './challengeDistribution.js';
import { playerDistribution } from './playerDistribution.js';
import { tenantDistribution } from './tenantDistribution.js';

export const distribution = (d: DistributionRules) => d
    .with(tenantDistribution)
    .with(playerDistribution)
    .with(bookkeepingDistribution)
    .with(challengeDistribution)
    ;
