# Sri's Threads

Ethnic-wear store for **Women, Men, Kids and Accessories** (sarees, chudidhar, kurtas, sherwanis, kids lehengas, jewellery, …) built with **Next.js 14 (App Router) + TypeScript**,
backed by **MongoDB Atlas** and ready to deploy on **Vercel**. Frontend, backend (route handlers) and admin panel live in
this one project. There is **no online payment**: customers add items to their bag, enter their mobile number and address,
and the order opens in **WhatsApp** so you can confirm and process it there. Every order is also saved and visible in the admin.

Design source: the Figma file "Sri's threads".

## Deploy to Vercel (≈10 minutes)

**1. MongoDB Atlas (free)**
1. Create a free **M0** cluster at <https://www.mongodb.com/atlas>. Pick a region near your Vercel region
   (Vercel's default is Washington DC `iad1` ↔ AWS `us-east-1`; for customers in India choose Atlas **Mumbai** and set
   Vercel → Settings → Functions → Region to **Mumbai (bom1)**).
2. *Database Access* → add a user with a password (read/write to any database).
3. *Network Access* → **Add IP Address → Allow access from anywhere (0.0.0.0/0)**. Vercel uses changing IPs, so this is required.
4. *Connect → Drivers* → copy the connection string (`mongodb+srv://…`) and put your password in it.

**2. Vercel**
1. Push this repo to GitHub → <https://vercel.com/new> → import it (framework is detected automatically).
2. Add these **Environment Variables** (Production + Preview):

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | your Atlas connection string |
| `MONGODB_DB` | `sris-threads` (any name) |
| `ADMIN_USERNAME` | your admin username |
| `ADMIN_PASSWORD` | a strong password |
| `SESSION_SECRET` | long random string (`openssl rand -hex 32`) |
| `WHATSAPP_NUMBER` | country code + number, digits only, e.g. `919876543210` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | *(recommended)* product photo hosting — see [Images](#images-cloudinary) |
| `NEXT_PUBLIC_SITE_URL` | *(optional)* your custom domain, for sitemap/link previews |

3. Deploy. Open `/admin`, sign in, and you're live. The first request seeds sample products, collections and coupons
   — delete or edit them in the admin. (`ADMIN_PASSWORD` and `SESSION_SECRET` are required in production; the app refuses to
   issue admin sessions without them.)

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000  — works with no setup (see below)
npm run typecheck
```

* **No `.env.local` needed to try it.** If `MONGODB_URI` is empty, `npm run dev` starts a local development MongoDB
  automatically (first run downloads it, ~1 minute; data is kept in `.data/mongo`). Dev login: `admin` / `admin123`.
* To use your Atlas cluster locally, copy `.env.example` to `.env.local` and fill in `MONGODB_URI`.
* In **production** (`next start` / Vercel) `MONGODB_URI`, `ADMIN_PASSWORD` and `SESSION_SECRET` are required — if
  `MONGODB_URI` is missing the page shows an error telling you exactly that.

## What's in it

**Storefront** – branded loader (~2 s, first visit per session) · home (hero, department tiles, featured collections, trending,
looks, testimonials) · one page per department (by default Women / Men / Kids / Accessories — all managed in the admin), each with the collections created for it ·
**Top Collection / Shop by Fabric / Shop by Occasion** pages · **shop page** with server-side filters (department, collection,
fabric, occasion, price range, size, colour, minimum discount, in stock, new), search, sort (featured, newest, price, biggest
discount, A–Z), removable filter chips, pagination and URL-shareable state (mobile uses a bottom-sheet) · product page
(gallery + lightbox, colours, **sizes**, sale countdown, coupons, sticky mobile buy bar) · wishlist · bag · checkout
(name, mobile, address → WhatsApp, with the chosen size in the message).

**Motion** – Framer Motion with one shared easing and timing system (`components/motion/`): scroll-triggered reveals and
staggers that play once, parallax imagery, smart header (hides on scroll down, returns on scroll up), scroll-progress bar,
back-to-top, fly-to-bag, animated filter chips and sheets, page transitions. It respects *reduce motion*, only animates
`transform`/`opacity`, doesn't shift layout (CLS 0) and content stays visible with JavaScript disabled.

**Admin (`/admin`)**
- **Overview** – revenue and order counts, 30-day chart, best sellers, low-stock list, newest orders.
- **Products** – search and filter by department / collection / status, sort, **bulk actions** (show/hide, discount %, stock,
  move department / collection, feature, delete), duplicate, inline stock editing, CSV export, per-product discount %, sizes,
  colours, SKU, sale end time.
- **Departments** – the main sections of the store (Women, Men, Kids, Accessories… or anything you like). **Switch any department on or off** (off = hidden from the menu, home page, shop, product pages and the sitemap, with nothing deleted), **rename** it, **add new ones** (e.g. *Dhoti & Veshti*), **reorder** them, set its picture, description and size options. A department's web address (e.g. `/men`) is fixed when it is created so links never break when you rename it. You can't delete a department that still has products or collections (switch it off instead), and at least one must stay on.
- **Collections** – add / edit / hide / delete groups per department (e.g. *Sherwani Sets* under Men), each with a card image and order.
- **Coupons** – percent or flat, minimum order, max discount, usage limit, expiry, enable/disable.
- **Orders** – status, private notes, WhatsApp the customer, delete. Cancelling an order puts its stock back.
- **Customers** – everyone who ordered, grouped by mobile number, with order count and total spend.
- **Settings** – WhatsApp number, announcement bar, social links, subscribers, image-storage status and one-click move of existing photos to Cloudinary.

## How the data is stored

Everything is in MongoDB: `products`, `collections`, `coupons`, `orders`, `settings`, `subscribers`, and **`images`**
(photos uploaded while Cloudinary isn't configured are stored as binary documents and served from `/uploads/<id>` with long-lived cache headers).
Nothing is written to disk, so it works on Vercel's read-only filesystem.

- Photos are resized in the browser (max 1400 px, WebP) before upload — usually 50–300 KB each — which keeps well inside
  Vercel's 4.5 MB request limit and makes the free 512 MB Atlas tier last for thousands of photos. Images no longer used by
  any product or collection are deleted automatically.
- Prices, discounts, coupons and stock are always decided on the server. Stock and coupon usage are claimed atomically, so
  simultaneous orders can't oversell an item or exceed a coupon's usage limit.
- Admin login is a signed, httpOnly cookie; repeated failed logins are throttled (stored in MongoDB so it works across
  serverless instances).

## Images (Cloudinary)

Product photos go to **Cloudinary** (free plan is plenty), uploaded straight from the admin's browser with a signature made
by the server — so Vercel's 4.5 MB request limit never applies and the API secret never leaves the server.

1. Create a free account at <https://cloudinary.com>, then copy **Cloud name**, **API Key** and **API Secret** from the dashboard.
2. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (or the single `CLOUDINARY_URL`) in Vercel
   → Settings → Environment Variables, and redeploy. Optional: `CLOUDINARY_FOLDER` (default `sris-threads`).
3. In **Admin → Settings → Image storage** click **Move images to Cloudinary** to transfer photos already stored in MongoDB.

* **Live and development never mix**: uploads go to `sris-threads/production`, `…/preview` or `…/development` depending on
  where the app runs (local machines are always `development`), and a server only ever deletes assets in its own folder.
* **Nothing breaks without it**: if Cloudinary isn't configured (or you're offline in development), uploads fall back to
  MongoDB exactly as before, and both kinds of image can live side by side.
* Photos are delivered optimised (`f_auto,q_auto`, responsive widths) from Cloudinary's CDN.

## Tests

```bash
npm test          # unit tests: pricing, coupons, catalogue query parsing, Cloudinary signing/URL safety
npm run typecheck
```

## Logo

The real Sri's Threads logo artwork: `public/logo-full.webp` (loader, login), `public/logo-lockup.webp` (header), `public/logo-emblem.webp` (footer, admin), favicons in `app/icon.png` / `app/apple-icon.png`. All are transparent and wired up in `components/Logo.tsx`.

## Content notes

* The sample collections *Chudidhar / Kurtis / Lehengas / Anarkali* reuse the Figma photos as placeholders — upload real
  images in **Admin → Collections**. Likewise replace the sample saree products with your own.
* The three collection pages in Figma shared the same six cards; here each page has its own admin-managed list.
* The customer reviews on the home page are the Figma sample text — replace them in `components/Testimonials.tsx`.
