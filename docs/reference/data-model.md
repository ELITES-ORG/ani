# Data model

Schema lives in `backend/src/db/schema/`, one file per subject area.
Migrations are in `backend/drizzle/`.

```
users ──┬── vendors ──── products
        │      │            │
        └── orders ─────────┴── order_items

municipalities ─── barangays
```

---

## users

One account per person. Buying and selling are the same account; selling is a
role added later ([ADR 0007](../decisions/0007-one-account-selling-is-a-role.md)).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `username` | text unique | Lowercased at write time |
| `password_hash` | text | Argon2id |
| `first_name`, `last_name` | text | Required |
| `middle_name`, `suffix` | text null | Optional. Middle is often the mother's maiden surname |
| `phone` | text | `+63` E.164. Not a login credential |
| `email` | text null | Many users have none |
| `municipality_id`, `barangay_id` | uuid null → geography | Home address. Null for accounts that predate collecting it |
| `address_detail` | text null | Purok, house number, or a landmark. Personal data — only on `CurrentUser` |
| `is_admin` | boolean | |
| `suspended_at` | timestamptz null | Checked on every authenticated request |

## vendors

A farm. One per user account.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `user_id` | uuid unique → users | Cascade delete |
| `farm_name` | text | |
| `municipality_id`, `barangay_id` | uuid → geography | Both required |
| `landmark` | text null | How people actually navigate here |
| `status` | `vendor_status` | `pending` → `approved` / `suspended` |

New farms are `pending` and invisible to buyers
([ADR 0011](../decisions/0011-vendors-are-reviewed-before-listing.md)).

## products

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `vendor_id` | uuid → vendors | Cascade delete |
| `name`, `description` | text | |
| `category` | `product_category` | |
| `price_centavos` | integer | Never a float ([ADR 0010](../decisions/0010-money-is-integer-centavos.md)) |
| `stock_amount` | numeric(12,3) | Fractional kilos. **Zero is valid** — sold out |
| `unit` | `sell_unit` | |
| `image_urls` | text[] | First is the card image |
| `is_listed` | boolean | Separate from stock: a farm between harvests unlists |
| `harvested_at` | timestamptz null | |

`is_listed` and `stock_amount` are deliberately independent. Sold out and
withdrawn are different states, and conflating them loses the listing's
history.

## orders

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `customer_id` | uuid → users | Restrict delete |
| `vendor_id` | uuid → vendors | **Exactly one farm per order** |
| `status` | `order_status` | See the transition table in [api.md](./api.md) |
| `fulfillment` | `fulfillment_method` | `pickup` or `delivery` |
| `delivery_*` | uuid / text null | Required when delivering |
| `notes` | text null | |

## order_items

| Column | Type | Notes |
|---|---|---|
| `order_id` | uuid → orders | Cascade delete |
| `product_id` | uuid → products | Restrict delete |
| `product_name` | text | **Copied, not joined** |
| `quantity_amount` | numeric(12,3) | |
| `unit` | `sell_unit` | Copied |
| `unit_price_centavos` | integer | Copied |
| `line_total_centavos` | integer | `round(unit_price × quantity)` |

Name, unit, and price are snapshots. A farm raising a price next week must
never rewrite what a buyer already agreed to. This is why `product_id` is
restrict-delete rather than cascade: an order's history outlives the listing.

Order totals are summed from the lines and never stored, so they cannot drift.

## municipalities, barangays

Biliran's eight municipalities and their barangays, seeded from
`db/seed/geography-data.ts`. A barangay slug is unique per municipality, not
globally — several have a Poblacion.

No coordinates, no PostGIS. See [constraints §6](../explanation/constraints.md).

## sessions

`sid`, serialised `data`, `expires_at`. Swept hourly. Postgres rather than
Redis — one fewer service to run.

---

## Enums

| Enum | Values |
|---|---|
| `vendor_status` | `pending`, `approved`, `suspended` |
| `product_category` | `vegetables`, `fruits`, `rice_and_grains`, `seafood`, `meat_and_poultry`, `dairy_and_eggs`, `herbs_and_spices`, `processed` |
| `sell_unit` | `kg`, `gram`, `piece`, `bundle`, `sack`, `tray`, `liter` |
| `order_status` | `pending`, `confirmed`, `ready`, `out_for_delivery`, `completed`, `cancelled` |
| `fulfillment_method` | `pickup`, `delivery` |

Adding a value is a migration. Removing one needs a data migration first.
