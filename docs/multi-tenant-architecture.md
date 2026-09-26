# Multi-tenant architecture proposal

Status: proposal only; no implementation or approved business policy. This document
addresses independent merchants sharing a future application. Technical recommendations
below are the design choices proposed here, not claims about features already present.
Open product decisions are tracked separately and must be resolved before the affected
features ship. No database, hosting provider, identity provider, or compliance regime has
been selected.

## Current application and scope

The current application is a small TypeScript domain library, as described in
[system.md](system.md). There is no HTTP boundary, authenticated session, database,
background worker, or tenant registry in the checked-in application.

- [types.ts](../src/types.ts) defines `Product` with an unscoped ID and `stock`, and
  `User` with a single global `viewer`, `editor`, or `admin` role.
- [permissions.ts](../src/security/permissions.ts) checks only role and action.
  Admins pass every action; editors pass everything except `admin:manage`.
  This is not an object-ownership or tenant-membership check.
- [filterProducts.ts](../src/catalog/filterProducts.ts) filters an array by active
  status, category, price, and stock. It provides no authorization boundary.
- [reservations.ts](../src/inventory/reservations.ts) keeps stock by SKU and
  reservations by ID in process-local maps. Reserving decrements available stock;
  releasing restores it and deletes the reservation. There is no persistence,
  expiry, actor, tenant, or durable record of released reservations.
- [googleResource.ts](../src/integrations/googleResource.ts) parses Google resource
  strings. Successful parsing establishes neither ownership nor permission.

For this proposal, a tenant is the isolation unit assigned to a merchant. Whether a
merchant has multiple shops, legal entities, or warehouses is unresolved (P1). The
technical design must not infer tenancy from a category, SKU, email domain, or Google
project ID. Cross-merchant commerce and shared inventory are not assumed.

## Technical recommendations

### 1. Tenant isolation and authorization boundaries

Introduce an immutable tenant ID and a server-resolved tenant context. Authenticate the
principal first, resolve the requested tenant against authoritative configuration, and
verify active membership and permission before entering a tenant-scoped domain service.
A route, subdomain, header, or payload can select a tenant but cannot grant access to it.
Reject missing, unknown, conflicting, or unauthorized tenant context; never fall back to
the original merchant in the general application.

Separate identity from membership: a principal identifies a person or service; a
membership associates that principal with a tenant and its permissions. This permits
multiple memberships without deciding whether product onboarding will allow them (P2).
A user could be an admin for merchant A and a viewer for merchant B. Switching tenants
requires another membership check and must not carry A's privileges into B.

Authorize each operation using principal, tenant, action, and resource ownership. Check
both source and destination for operations involving multiple resources. Fetch objects
through tenant-scoped queries; do not load by an unscoped ID and rely on a later UI check.
Lists, search, counts, exports, bulk changes, and administrative endpoints need the same
boundary. Use an explicit action allowlist and deny unknown actions at runtime. The
current broad editor rule must not automatically authorize new actions. This follows
OWASP's guidance to deny by default and validate permission on every request.
[OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

Treat merchant administration and platform operations as separate authority domains.
A merchant admin has no platform-wide privilege. Do not create an implicit super-admin
bypass. If support access is approved under P2, use a separate, narrowly scoped,
time-limited grant with a reason and an audit trail. Service credentials likewise need
explicit tenant scopes. Revoked memberships must invalidate cached authorization; jobs
acting for users must recheck authority when executed. Autonomous maintenance jobs need
their own scoped service authority, not a fabricated user session.

Pass tenant context explicitly into domain services and repositories; avoid a mutable
process-wide current tenant. Internal APIs should make an unscoped tenant-owned lookup
unavailable. Typed IDs and context reduce mistakes but do not replace runtime checks.
Isolation also applies to caches, object storage, search indexes, queues, exports, and
integration credentials. Namespace keys and messages with tenant ID; validate the
namespace on reads and job consumption. Bind signed download URLs and webhook mappings
to the authorized tenant. A parsed Google resource must be checked against that tenant's
configured resource bindings before any future access.

### 2. Catalogue and inventory ownership

Recommend exclusive tenant ownership for merchant-controlled catalogue entries, prices,
stock records, and reservations until sharing is explicitly designed under P3. Every
such record has a non-null, immutable tenant ID. Tenant A's product cannot reference B's
inventory or reservations. Ownership transfers must be a separately authorized workflow,
not a writable `tenantId` field in normal update requests.

Keep catalogue identity separate from stock identity. Define the missing product-to-SKU
relationship explicitly: current `Product.id` and reservation `sku` are not linked by the
code. Recommend a tenant-owned stock item linked to a tenant-owned product; whether
products have variants, locations, or bundles remains P3. A SKU is a merchant-local
business identifier and can repeat across merchants. Do not assume two equal SKUs refer
to the same physical goods.

Choose one authoritative inventory balance. Recommend treating catalogue `Product.stock`
as a derived availability value rather than an independently writable balance. Availability
must come from the same tenant's stock records. Define any projection lag exposed by
`inStockOnly`; a catalogue read cannot guarantee a later reservation succeeds. The exact
meaning of on-hand, available, reserved, damaged, and oversellable quantities needs P4.
A shared descriptive product registry, if later desired, should have explicit references
from private merchant offers; it must not implicitly share prices or stock.

### 3. Reservation isolation and consistency

Key reservation identity and retry handling by tenant. Every reserve, inspect, release,
and future expiry operation must match the reservation's tenant and stock item's tenant.
A release for A must not reveal or alter B's reservation, even if both use `r1`. Check
caller permission within the tenant too; membership alone does not determine which
reservations someone may release (P2/P4).

Replace process-local mutation with one atomic persistence transaction when production
persistence is introduced: validate quantity, create a reservation, and decrement the
same tenant's availability only if enough remains. Use a conditional update or lock so
concurrent reservations cannot both consume the last unit. Commit neither change if
any step fails. Multi-item reservations must either commit all their stock changes or
follow an explicitly approved partial-allocation policy (P4).

Recommend a durable reservation state and tenant-scoped idempotency key. Repeating an
identical reserve request returns the original outcome; reusing its key for a different
payload conflicts. A terminal transition such as release restores stock at most once,
using an atomic state transition. Keeping the outcome instead of immediately deleting
all evidence prevents delayed retries from restoring or consuming stock twice. Key
retention, reservation expiry, checkout consumption, cancellation, and ownership rules
remain P4; this is a proposed change from the current duplicate-ID error behavior.

If expiry or fulfillment workers are introduced, carry verified tenant context and
reservation identity into them. Make retries safe and resolve release/expiry/consume
races through conditional transitions. Persist an event-outbox entry in the same
transaction for downstream effects; consumers deduplicate within the tenant. Do not
claim exactly-once delivery across external systems.

### 4. Data partitioning and tenant-aware identifiers

Recommend starting with shared relational tables and tenant-keyed rows, provided P5
permits shared infrastructure. It offers a manageable migration path for this small
application and transactional stock updates. This is a conditional technical choice,
not an approved isolation or regulatory commitment.

| Option | Tradeoff and selection trigger |
| --- | --- |
| Shared tables | Lowest initial operational duplication; omitted scope predicates have a large blast radius. Requires enforced tenant constraints and isolation tests. |
| Schema per tenant | Separates namespaces but multiplies schema migrations; shared credentials or privileged access can still cross boundaries. |
| Database per tenant | Better independent backup/restore and operational separation; increases provisioning, connection, and migration costs. Consider for contractual isolation or tenant-specific recovery needs. |
| Separate deployment per tenant | Stronger compute and operational separation, at higher cost. Consider if shared-runtime risk or residency constraints rule out pooling. |

Use globally unique opaque tenant IDs and stable opaque resource IDs. Still treat the
canonical tenant-owned key as `(tenant_id, resource_id)`. Scope merchant-facing SKUs,
external IDs, reservation retry keys, and any uniqueness checks to the tenant unless a
separate global namespace is explicitly intended. Never use display names or mutable
slugs as ownership keys. Opaque IDs make enumeration harder; they are not authorization.

Require tenant ID in tenant-owned rows, uniqueness constraints, and relationships. For
example, a reservation's `(tenant_id, stock_item_id)` must reference a stock item with
that same pair. Include tenant scope in joins and bulk writes, not merely the top-level
query. Identity and tenant registry data are platform-owned exceptions accessed through
restricted interfaces, not an excuse for unscoped merchant repositories.

Prefer a datastore with database-enforced row access policies as a second boundary.
Configure the application role so it cannot bypass those policies; use separate migration
credentials. Set tenant context transaction-locally and test pooled connection reuse and
missing-context rejection. Application authorization is still required. Index common
access paths beginning with tenant ID, then their lookup/filter fields. Physical table
partitioning or sharding is a later capacity choice, not an authorization control.

Introduce a tenant-to-storage placement mapping if dedicated databases or shards become
necessary. Keep resource IDs stable across placement moves. Budget per-tenant quotas,
query timeouts, and queue concurrency to limit noisy neighbors; numerical limits and
service tiers need P5. Pooling does not remove shared outage, privileged operator, or
backup exposure risks. These isolation tradeoffs and the need to include caches and
background work in the boundary align with the
[OWASP Multi-Tenant Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html).

### 5. Migration from the single-tenant application

1. **Inventory and approve mappings.** Identify actual deployments and data sources;
   this repository itself has no durable data migration to execute. Resolve P1 and
   P5, identify the original merchant's owner, and document product/SKU mappings.
   Confirm how existing users map to memberships. Do not convert a global admin to
   a platform operator automatically.
2. **Introduce scope behind compatibility boundaries.** Add tenant-aware identities,
   services, repositories, and authorization in a future implementation. An explicitly
   configured legacy adapter may bind old calls to the original tenant while only
   that tenant is served. Missing context elsewhere must fail. Preserve existing
   domain behavior in that tenant until policy changes are approved.
3. **Import and reconcile.** Assign existing records to the owner-approved original
   tenant, resolve duplicate keys and orphan relationships, then enforce non-null and
   composite constraints. In-memory stock cannot be recovered after process exit:
   capture it from the running owner-controlled source under a write pause, or rebuild
   from a verified source of truth. Current map balances already exclude reservations;
   importing them as available balances must not subtract active reservations again.
   Reconcile balances, active reservations, record counts, and memberships before
   switching reads and writes.
4. **Validate and cut over.** Rehearse on a snapshot or fixtures, test isolation with
   two synthetic tenants, and take a recoverable snapshot of real data if any exists.
   Prefer a bounded write pause and a single authoritative writer over unverified dual
   writes. Resolve acceptable downtime under P6. Reconcile queued work and rebuild
   caches/search with tenant scope before admitting a second tenant.
5. **Remove legacy ambiguity.** Enable tenants gradually only after scope and policy
   gates pass. Remove or isolate unscoped adapters so new tenant traffic cannot reach
   them. Monitor authorization failures and balance reconciliation during rollout.

Before additional tenants write, rollback can restore the verified original-tenant
snapshot and routing. After additional tenants write, reverting to unscoped application
code would risk mixing merchants: disable affected traffic, keep tenant-aware storage,
and repair forward or restore into an isolated environment with tenant-specific
reconciliation. Test the chosen recovery plan before launch; a shared backup restore
must not overwrite unrelated tenants' newer data.

### 6. Observability and auditability

Attach server-verified tenant ID, principal/service ID, action, resource ID, request or
job correlation ID, result, and timestamp to structured operational events. Mark attempted
untrusted tenant selectors separately from verified scope. Record membership changes,
privilege grants, stock adjustments, reservation transitions, exports, support access,
and denied cross-tenant operations. For successful mutations, commit durable audit
metadata with the transaction, then export asynchronously; do not report success if the
required audit write failed.

Use append-only audit access with separate write/read privileges and monitored privileged
access. Avoid credentials, tokens, full payloads, and unnecessary personal data in logs.
Tenant-visible audit queries require the same scope enforcement as catalogue queries;
central operator visibility requires explicit operational authority. Retention, deletion,
merchant access, and regional storage are P7, not implied by this proposal.

Monitor authorization denials, scope mismatches, reservation conflicts, negative-balance
invariants, job retries, queue lag, and per-tenant resource consumption. Alert on abnormal
cross-tenant attempts and integrity failures. Use bounded metric labels and restricted
logs/traces for arbitrary tenant IDs to avoid uncontrolled metric cardinality. Test that
alerts can identify the affected tenant without leaking its data to other merchants.

### 7. Testing and acceptance strategy

The future implementation must preserve the current tests under an explicit original
tenant and add adversarial isolation coverage. This documentation change does not
implement these tests or claim they pass.

| Test layer | Required evidence before enabling a second tenant |
| --- | --- |
| Domain and authorization | Same SKU and reservation ID in A and B remain independent. A user with different roles in A/B gets the right permissions; absent, revoked, unknown-action, and wrong-tenant cases deny. |
| Repository/database integration | Real constraints and row policies reject mixed-tenant relationships and reads/writes using the application role. Test joins, pagination, counts, bulk operations, and connection reuse after success and failure. |
| API and secondary stores | Tamper with route/header/body tenant and object IDs. Verify search, exports, caches, signed URLs, webhooks, and worker retries cannot disclose or mutate another tenant's data. |
| Concurrency and recovery | Race reserves for the last unit; race release/expiry/consume; replay identical and conflicting keys. Inject crashes between steps and prove no partial commit or duplicate stock restoration. |
| Migration and operations | Rehearse imports, reconcile existing available stock without double subtraction, test tenant-specific recovery, revoked job authority, audit permissions, and noisy-neighbor limits. |

Add property-based operation sequences: operations for A leave B unchanged, available
stock never falls below zero under the no-oversell technical baseline, and each reservation
restores stock at most once. If P4 approves overselling, replace that invariant with the
explicit approved bound. Run the existing `npm run check` alongside future isolation
suites; green baseline tests alone do not establish multi-tenant security.

### 8. Major failure modes and security risks

| Failure | Prevention and detection | Residual concern |
| --- | --- | --- |
| Forged tenant selector or object ID | Authoritative membership checks, scoped lookups, deny unknown actions, adversarial tests | Stolen valid credentials still require revocation and incident response. |
| Omitted query scope or cross-tenant join | Scoped repositories, composite references, database policies, integration tests | Privileged database access can bypass application protections. |
| Stale role, cache collision, pooled-context leak | Scope cache keys, invalidate authorization, transaction-local context, reuse tests | Revocation propagation needs a defined operational bound. |
| Wrong-tenant webhook, export, or job | Scoped service grants and resource bindings; validate again at execution/delivery | External providers and leaked signed URLs remain separate trust boundaries. |
| Oversell or duplicate stock restoration | Atomic transactions, conditional state changes, durable deduplication, reconciliation | Incorrect stock imports or approved oversell rules require explicit handling. |
| Noisy neighbor or broad outage | Tenant quotas, concurrency budgets, monitoring, optional dedicated placement | Shared infrastructure still shares capacity and outage risk. |
| Incorrect backfill, restore, or deletion | Owner-approved mappings, snapshots, rehearsals, tenant reconciliation | Shared backups complicate individual tenant restore and erasure. |
| Support misuse or sensitive audit leakage | Separate scoped grants, restricted audit access, redaction, access review | Retention and support policy require owner approval. |

## Unresolved product and owner decisions

These are decision requests for the next implementation phase, not silently selected
business defaults. The proposal can be reviewed without answering them; implementation
must stop at the relevant gate rather than inventing policy.

| ID | Decision and owner input needed | Affected gate |
| --- | --- | --- |
| P1 | Product/merchant owner: what constitutes a tenant—merchant, legal entity, shop, or group? Are subsidiaries separate tenants? Who may create, suspend, merge, transfer, or delete one? | Ownership model, onboarding, migration mappings |
| P2 | Product/security owner: can people join multiple merchants? Who invites users or grants roles? Are catalogues public? Which actions and individual reservations can each role access? Is support impersonation allowed, and under what approval and revocation rules? | Identity, authorization, public endpoints, support tooling |
| P3 | Product/catalogue owner: are products private, shared descriptive records, or marketplace listings? How do products map to SKUs, variants, warehouses, and shared fulfillment? Can merchants transfer goods or ownership? What currencies/pricing rules exist beyond `priceCents`? | Catalogue model and stock ownership |
| P4 | Product/inventory owner: what does stock represent? Are overselling, partial allocation, expiry, checkout consumption, reservation transfer, and cancellation supported? Who owns a reservation and how long must retry outcomes survive? | Inventory invariants, state transitions, idempotency retention |
| P5 | Business/security/operations owner: expected tenant count and size, residency and isolation commitments, resource quotas, service tiers, and budget? Do any merchants require dedicated storage or runtime? | Storage selection and capacity plan |
| P6 | Operations/merchant owner: what downtime and recovery objectives are acceptable? What source proves current stock and user ownership? How are in-flight reservations reconciled and merchant-specific restores approved? | Migration and rollback approval |
| P7 | Product/security/privacy owner: which audit events can merchants see, for how long, and in which regions? What are export, deletion, backup expiry, and support-access retention requirements? | Audit, offboarding, retention, incident procedures |

Recommended rollout gates are explicit ownership mappings, approved access rules,
reconciled inventory semantics, an accepted isolation/recovery model, and passing
cross-tenant tests. Decisions that later permit sharing need a separate explicit grant
model; they must not weaken the tenant boundary by removing scope checks.
