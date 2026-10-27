# Sri's Threads

Women's ethnic-wear store (sarees, chudidhar, kurtis, lehengas, …) built with **Next.js 14 (App Router) + TypeScript**,
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

**Storefront** – branded loader (~2 s, first visit per session) · home (hero carousel, featured collections, shop-by cards,
trending, looks, testimonials) · **Top Collection / Shop by Fabric / Shop by Occasion** pages · all-products page with search,
sort and filters · product page (gallery, colours, sale countdown, coupon cards, add to bag / buy now) · wishlist · bag with
coupon codes · checkout (name, mobile, address → WhatsApp).

**Admin (`/admin`)**
- **Products** – add / edit / delete, photo upload, per-product **discount %**, stock, colours, collection / fabric / occasion,
  trending & “New” flags, sale end time, “discount everything” shortcut.
- **Collections** – add / edit / hide / delete the groups shown on the storefront (e.g. *Chudidhar*, *Kurtis*, *Lehengas*,
  *Wedding Wear*, *Silk*), each with its own card image and display order. A new collection appears straight away on the
  collection page, the menu, the shop filters, the product form, and (if “Show on the home page” is ticked, the default) the home page.
- **Coupons** – percent or flat, minimum order, max discount, usage limit, expiry, enable/disable.
- **Orders** – status, WhatsApp the customer, delete. Cancelling an order puts its stock back.
- **Settings** – WhatsApp number, announcement bar, social links, newsletter subscribers.

## How the data is stored

Everything is in MongoDB: `products`, `collections`, `coupons`, `orders`, `settings`, `subscribers`, and **`images`**
(uploaded photos are stored as binary documents and served from `/uploads/<id>` with long-lived cache headers).
Nothing is written to disk, so it works on Vercel's read-only filesystem.

- Photos are resized in the browser (max 1400 px, WebP) before upload — usually 50–300 KB each — which keeps well inside
  Vercel's 4.5 MB request limit and makes the free 512 MB Atlas tier last for thousands of photos. Images no longer used by
  any product or collection are deleted automatically.
- Prices, discounts, coupons and stock are always decided on the server. Stock and coupon usage are claimed atomically, so
  simultaneous orders can't oversell an item or exceed a coupon's usage limit.
- Admin login is a signed, httpOnly cookie; repeated failed logins are throttled (stored in MongoDB so it works across
  serverless instances).

## Logo

Hand-built SVG: `components/Logo.tsx` (header, loader, footer, admin) plus standalone `public/logo-emblem.svg` and `public/logo.svg`.

## Content notes

* The sample collections *Chudidhar / Kurtis / Lehengas / Anarkali* reuse the Figma photos as placeholders — upload real
  images in **Admin → Collections**. Likewise replace the sample saree products with your own.
* The three collection pages in Figma shared the same six cards; here each page has its own admin-managed list.
* The customer reviews on the home page are the Figma sample text — replace them in `components/Testimonials.tsx`.
