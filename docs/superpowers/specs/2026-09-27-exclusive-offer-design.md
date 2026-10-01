# Exclusive Offer Design

## Purpose

Allow administrators to mark a promotional offer as exclusive and make that status immediately visible to customers. An exclusive offer remains a normal active offer; exclusivity only adds an explicit membership-oriented visual designation.

## Scope

The feature spans the existing destination-service offer API, the reusable dashboard offer CRUD workspace, and the public offers page. It does not introduce membership authorization or restrict booking claims; that is outside this feature.

## Data Contract and Persistence

`Tripora.DestinationService.Models.Offer` gains `IsExclusive`, a non-null boolean defaulting to `false`. `OfferRequest` gains the matching property with the same default, and `OffersController.Apply` maps it for both creates and updates.

An EF Core migration adds the non-null `IsExclusive` column to `Offers` with a database default of `false`. This preserves every existing offer as non-exclusive and makes rollback remove only that column.

The existing public GET response serializes the entity, so the new property reaches customers as `isExclusive` through the standard ASP.NET Core camel-case JSON policy.

## Exclusive Toggle API

`OffersController` adds `PATCH /api/offers/{id}/exclusive`, protected by the existing Admin role. The endpoint accepts `{ isExclusive: boolean }`, returns `404` when the offer does not exist, persists the supplied value, and returns the updated offer on success.

This narrow endpoint prevents the table switch from sending a stale full-offer PUT payload and limits the one-click mutation to its single responsibility.

## Admin Experience

The existing `CrudModule` remains the shared form/table implementation. The Offers configuration in `AdminDashboard.jsx` adds an `Exclusive Offer` checkbox alongside `Available for booking`; its unchecked default is `false`. The configuration payload forwards `isExclusive` on both POST and PUT.

The shared module gains an optional per-record quick action. For Offers, it renders an accessible Exclusive switch in a dedicated Exclusivity column. A click immediately updates that row locally, sends `PATCH /api/offers/{id}/exclusive`, and replaces the row with the server response on success. If the request fails, the row is restored to its prior value and an inline error is shown. The switch is disabled while its request is in flight, preventing conflicting toggles.

## Customer Experience

`Offers.jsx` conditionally renders a `MEMBERS EXCLUSIVE` badge inside the existing `.offer-card-media` region when `offer.isExclusive === true`. The badge is positioned at the upper edge of the card and uses a red luxury treatment with high-contrast text. It is omitted entirely for ordinary offers.

The public card continues to render and claim both ordinary and exclusive offers identically; exclusivity is presentation metadata only in this delivery.

## Error Handling and Compatibility

Older records and responses without `isExclusive` are treated as non-exclusive. The migration default protects existing database rows. Standard backend validation and existing API error rendering remain unchanged.

## Verification

- Backend build/tests verify the offer contract compiles with `IsExclusive` and the migration is valid.
- Dashboard regression coverage verifies the Offers form exposes the checkbox, a returned exclusive record has an indicator, and the switch optimistically updates then rolls back on a failed PATCH.
- Public offers coverage verifies the red badge renders only for an offer with `isExclusive: true`.
- Frontend production build and full suite run; unrelated failures are reported separately.
