import { describeAuthorizationRules, describeDistributionRules } from 'jinaga';
import { authorization } from './authorization/index.js';
import { model } from './model/index.js';
import { distribution } from './distribution/index.js';

// Utility function for testing integration
export function getModelInfo() {
    return {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        modules: ['model', 'authorization', 'distribution'],
    };
}

// Re-export the modules
export { authorization } from './authorization/index.js';
export { distribution } from './distribution/index.js';
export { model } from './model/index.js';

// Default export for CommonJS compatibility
export default {
    authorization,
    distribution,
    model,
    getModelInfo,
    describeAuthorizationRules,
    describeDistributionRules,
};

// Generate authorization and distribution rules when this file is executed
// via the command line with the --generate-policies flag
if (
    typeof process !== 'undefined' &&
    process.argv &&
    process.argv.includes('--generate-policies')
) {
    const authorizationRules = describeAuthorizationRules(model, authorization);
    const distributionRules = describeDistributionRules(distribution);
    console.log(authorizationRules);
    console.log(distributionRules);
}
