# Firstmate Routing Evaluation — Run v1

## Objective

Improve this small TypeScript commerce application by completing the six
independent work items below.

Treat the tasks as independent wherever possible. Work in isolated worktrees or
branches so unrelated tasks can proceed concurrently and do not overwrite one
another.

Do not change requirements merely to make implementation easier.

Run the relevant tests and type-checking for completed implementation work.

## Task 1 — Catalogue querying

Extend `filterProducts` with:

- optional free-text query `q`
- optional sort:
  - `price-asc`
  - `price-desc`
  - `name-asc`

Requirements:

- `q` searches product names case-insensitively.
- Leading/trailing query whitespace is ignored.
- An empty/whitespace-only query behaves as though no query was supplied.
- Existing category, price, stock and active filtering continues to work.
- Sorting must not mutate the input array.
- Equal sort values must be deterministic using product `id` as the tie-breaker.
- Add appropriate tests.

## Task 2 — Catalogue summary

Add a catalogue-summary utility in a new module.

For an array of products, return:

- number of active products
- number of active products currently in stock
- total stock across active products
- minimum active-product price, or `null` when none exist
- maximum active-product price, or `null` when none exist
- count of active products grouped by category

Inactive products must not contribute to any aggregate.

Add appropriate tests.

## Task 3 — Permission introspection

Add:

```ts
allowedActions(user)
```

to the permissions domain.

It must return every action the supplied user may perform according to the
existing `can()` policy.

Requirements:

- no duplicated authorization logic
- deterministic output
- preserve the existing `can()` public API and behavior
- add appropriate tests

## Task 4 — Google resource handling

Improve the Google-resource integration.

Add:

```ts
formatGoogleResource(resource)
```

which produces the canonical `gcp://` representation accepted by
`parseGoogleResource`.

Also strengthen parsing so:

- project IDs cannot be empty
- resource paths cannot be empty
- leading or trailing whitespace around the complete input is ignored
- malformed service names remain rejected
- parsing followed by formatting produces a canonical representation
- formatting followed by parsing round-trips valid resources

Do not introduce a Google SDK dependency for this task.

Add appropriate tests.

## Task 5 — Reservation lifecycle

The inventory reservation implementation needs a safer lifecycle.

Extend it to support:

- `active`
- `committed`
- `released`

reservation states.

Required behavior:

- reserving stock creates an active reservation and deducts stock exactly once
- releasing an active reservation restores stock exactly once
- releasing an already released reservation is idempotent
- committing an active reservation permanently consumes the reserved stock
- a committed reservation cannot subsequently restore stock
- attempting to reuse an existing reservation ID remains invalid regardless of its state
- callers can inspect a reservation's current state
- invalid state transitions must fail clearly

Preserve the existing public behavior wherever these new lifecycle requirements
do not require a change.

Add thorough tests, especially around repeated and invalid transitions.

## Task 6 — Multi-tenant architecture proposal

The application may eventually serve multiple independent merchants.

Create:

`docs/multi-tenant-architecture.md`

Do not implement the architecture yet.

The proposal should address:

- tenant isolation
- authorization boundaries
- catalogue and inventory ownership
- reservation isolation
- data-partitioning strategy
- tenant-aware identifiers
- migration from the current single-tenant application
- observability/auditability
- testing strategy
- major failure modes and security risks
- unresolved decisions that require product/owner input

Requirements are intentionally incomplete. Identify ambiguity rather than
silently inventing business policy.

## Delivery

For implementation tasks:

- keep each work item inspectable
- run relevant tests
- run the repository type-check
- avoid unrelated cleanup

For the architecture task:

- produce the requested document only
- distinguish decided technical recommendations from unresolved product decisions

Do not merge unrelated work merely to reduce the number of workers.
