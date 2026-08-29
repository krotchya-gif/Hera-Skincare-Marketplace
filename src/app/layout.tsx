import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { STORE_NAME, STORE_DESCRIPTION } from "@/utils/storeConfig";
import { getSeoSettings } from "@/lib/seo";
import { ToastProvider } from "@/components/Toast";
import ErrorBoundary from "@/components/ErrorBoundary";
import UtmCapture from "@/components/UtmCapture";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();

  return {
    title: seo.default_title || `${STORE_NAME} — Marketplace Skincare & Perawatan Pribadi`,
    description: seo.default_description || STORE_DESCRIPTION,
    keywords: seo.default_keywords || undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seo = await getSeoSettings();

  return (
    <html lang="id">
      {/* T-66: GA4 + GTM dirender di <head> (bukan body) — verifikasi GSC
          via Analytics/GTM mensyaratkan snippet berada di head home page.
          Interpolasi ID aman: nilai hanya bisa diisi admin. */}
      <head>
        {seo.ga4_measurement_id && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${seo.ga4_measurement_id}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${seo.ga4_measurement_id}');`,
              }}
            />
          </>
        )}
        {seo.gtm_id && (
          // eslint-disable-next-line @next/next/next-script-for-ga -- verifikasi GSC mensyaratkan container GTM di <head>; komponen @next/third-parties tidak menjamin posisi head
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${seo.gtm_id}');`,
            }}
          />
        )}
      </head>
      <body className="font-sans antialiased">
        <ToastProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ToastProvider>
        {/* T-41: Capture UTM dari URL (campaign tracking) */}
        <UtmCapture />

        {/* Meta Pixel */}
        {seo.meta_pixel_id && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${seo.meta_pixel_id}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element -- tracking pixel di dalam noscript; next/image tidak bisa dipakai tanpa JS */}
              <img
                height="1" width="1" style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${seo.meta_pixel_id}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}

        {/* GA4 + GTM kini di <head> (T-66) — blok afterInteractive lama dihapus
            agar tidak dobel load */}

        {/* T-42: Microsoft Clarity */}
        {seo.clarity_id && (
          <Script id="clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${seo.clarity_id}");
            `}
          </Script>
        )}

        {/* T-42: Google Ads conversion tracking */}
        {seo.ads_id && (
          <Script id="google-ads" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${seo.ads_id}');
            `}
          </Script>
        )}

        {/* T-42: TikTok Pixel */}
        {seo.tiktok_id && (
          <Script id="tiktok-pixel" strategy="afterInteractive">
            {`
              !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
              ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,
              ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");
              o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
              var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${seo.tiktok_id}');ttq.page();
              }(window, document, 'ttq');
            `}
          </Script>
        )}

        {/* T-42: JSON-LD LocalBusiness (GEO) */}
        {(seo.geo_lat || seo.geo_lng) && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                name: STORE_NAME,
                ...(seo.geo_lat && seo.geo_lng
                  ? { geo: { "@type": "GeoCoordinates", latitude: seo.geo_lat, longitude: seo.geo_lng } }
                  : {}),
              }),
            }}
          />
        )}
      </body>
    </html>
  );
}
