# Sri's Threads

Mobile-first (and desktop-responsive) saree storefront built with **Next.js 14 (App Router) + TypeScript**.
Frontend, backend (route handlers) and admin panel live in this one project. There is **no online payment**:
customers add items to their bag, enter their mobile number + address, and the order opens in **WhatsApp**
so you can confirm and process it there. Every order is also saved and visible in the admin.

Design source: the Figma file "Sri's threads" (Home, Collection, Shop by fabric / occasion, Product pages).

## Run it

```bash
npm install
cp .env.example .env.local      # then edit the values
npm run dev                     # http://localhost:3000
# production
npm run build && npm start
```

| Variable | Purpose |
| --- | --- |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Admin login (`/admin`). **Required in production.** In dev it defaults to `admin` / `admin123`. |
| `SESSION_SECRET` | Long random string that signs the admin cookie. **Required in production.** |
| `WHATSAPP_NUMBER` | First-run default for the order WhatsApp number (country code + number, digits only). Change it any time in **Admin → Settings**. |
| `DATA_DIR` | Optional. Where `db.json` and uploaded images are stored (default `./data`). |

## What's in it

**Storefront** – loader (≈2 s, first visit per session) · home (hero carousel, collections, shop-by cards, trending carousel,
looks, testimonials) · Top Collection / Shop by Fabric / Shop by Occasion · all-products page with search, sort and filters ·
product page (gallery, colour options, sale countdown, coupon cards, add to bag / buy now, accordion) · wishlist · bag with
coupon codes · checkout (name, mobile, address → WhatsApp).

**Admin (`/admin`, login required)** – add / edit / delete products (images upload, per-product **discount %**, stock, colours,
collection / fabric / occasion, trending & “New” flags, sale end time, bulk “discount all”) · **coupon codes** (percent or flat,
minimum order, max discount, usage limit, expiry, enable/disable) · orders (status, WhatsApp the customer, delete) ·
settings (WhatsApp number, announcement bar, social links) · newsletter subscribers.

**Backend** – `app/api/*` route handlers. Prices, discounts and coupons are always recomputed on the server when an order is
placed, so the browser can't tamper with totals. Admin routes check a signed, httpOnly session cookie (and `middleware.ts` guards the UI).

## Data storage

A small JSON file (`data/db.json`, created and seeded on first run) plus uploaded images in `data/uploads`.
That is ideal for a single server / VPS / Docker volume. On serverless hosts with a read-only or ephemeral disk
(e.g. Vercel) swap the functions in `lib/db.ts` for a hosted database – everything else goes through that one file.
Back up the `data/` folder.

## Logo

The logo is hand-built SVG: `components/Logo.tsx` (used in the header, loader, footer, admin), plus standalone
`public/logo-emblem.svg` and `public/logo.svg`.

## Notes on the Figma content

* Brand text “House of Qalakari” / “Qala Banarasi” is replaced with **Sri's Threads**; payment-method icons are removed.
* The Figma file reuses placeholder content (jeans photos in “Trending”, hair-oil copy in the product accordion, sample
  reviews with generic names). Products are seeded with the saree photos from the file; edit/replace them in the admin.
  The testimonials are still the Figma sample text – swap them for real customer feedback in `components/Testimonials.tsx`.
* The three “collection” pages share the same six arch cards in Figma; here each page has its own labels so the cards can
  filter products (admin picks a fabric / occasion / collection per product).
