import { AuthorizationRules } from "jinaga";
import { Administrator, Tenant } from "../model/index.js";

export const tenantAuthorization = (a: AuthorizationRules) => a
  // Only the creator can create a tenant
  .type(Tenant, tenant => tenant.creator.predecessor())
  
  // Administrators can add other administrators to their tenant
  .type(Administrator, admin => Administrator.usersOf(admin.tenant))
  ;