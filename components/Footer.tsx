import Link from "next/link";
import { getSettings } from "@/lib/db";
import { LogoStacked, Wordmark } from "./Logo";
import NewsletterForm from "./NewsletterForm";

export default async function Footer() {
  const s = await getSettings();
  const wa = (text: string) => `https://wa.me/${s.whatsappNumber}?text=${encodeURIComponent(text)}`;
  const chat = wa("Hi Sri's Threads, I have a question.");
  const social = [
    { href: s.twitterUrl, label: "X (Twitter)", icon: "social-1" },
    { href: s.instagramUrl, label: "Instagram", icon: "social-2" },
    { href: s.facebookUrl, label: "Facebook", icon: "social-3" },
  ];
  const company: [string, string][] = [
    ["About us", "/#about"],
    ["Track Order", wa("Hi, I'd like to track my order. My order number is ")],
    ["Contact us", chat],
    ["Chat with us", chat],
    ["Talk to us", chat],
    ["Write to us", chat],
  ];
  const policies: [string, string][] = [
    ["Return Policy", wa("Hi, could you share your return policy?")],
    ["Refund Policy", wa("Hi, could you share your refund policy?")],
    ["Shipping Policy", wa("Hi, could you share your shipping policy?")],
    ["Bulk Order", wa("Hi, I'd like to place a bulk order.")],
  ];
  const links = (items: [string, string][]) =>
    items.map(([label, href]) => (
      <li key={label}>
        {href.startsWith("/") ? <Link href={href}>{label}</Link> : <a href={href} target="_blank" rel="noopener noreferrer">{label}</a>}
      </li>
    ));

  return (
    <footer className="site-footer" id="about">
      <section className="footer-newsletter">
        <div className="footer-newsletter__inner">
          <h2>Get notified when we launch</h2>
          <NewsletterForm />
        </div>
      </section>
      <div className="footer-main">
        <div className="footer-logo"><LogoStacked /></div>
        <div className="footer-links">
          <div className="footer-links__col"><h3>Company</h3><ul>{links(company)}</ul></div>
          <div className="footer-links__col"><h3>Policies</h3><ul>{links(policies)}</ul></div>
          <div className="footer-links__col">
            <h3>Social</h3>
            <ul>
              {social.map((x) => (
                <li key={x.label}>{x.href ? <a href={x.href} target="_blank" rel="noopener noreferrer">{x.label}</a> : <span style={{ fontSize: 12, color: "#737373" }}>{x.label}</span>}</li>
              ))}
              <li><a href={chat} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-art">
          <div className="footer-art__arch">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/img/footer-weavers.webp" alt="Weavers at a handloom" loading="lazy" />
          </div>
          <div className="footer-art__word"><Wordmark height={44} /></div>
        </div>
      </div>
      <div className="footer-base">
        <div className="footer-base__inner">
          <div className="socials">
            {social.map((x) => (
              <a key={x.label} href={x.href || "#"} aria-label={x.label} {...(x.href ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/assets/icons/${x.icon}.svg`} alt="" />
              </a>
            ))}
          </div>
          <a className="whatsapp-note" href={chat} target="_blank" rel="noopener noreferrer">
            Orders are confirmed personally on WhatsApp — no online payment needed.
          </a>
          <p className="copyright"><span className="c" aria-hidden="true">©</span><span>Copyright {new Date().getFullYear()} Sri&rsquo;s Threads. All rights reserved.</span></p>
        </div>
      </div>
    </footer>
  );
}
