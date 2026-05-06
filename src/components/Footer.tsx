"use client";

import { useI18n } from "@/i18n/context";

export function Footer() {
  const { t } = useI18n();

  const productItems = t.footer.productItems.split(",");
  const resourceItems = t.footer.resourceItems.split(",");
  const legalItems = t.footer.legalItems.split(",");

  return (
    <footer className="border-t border-card-border bg-bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">
                TS
              </div>
              <span className="text-lg font-bold text-foreground">
                Token<span className="text-primary">Scope</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: t.footer.desc.replace("。", "。<br />") }} />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">{t.footer.product}</h4>
            <ul className="mt-3 space-y-2">
              {productItems.map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted transition-colors hover:text-foreground">{item.trim()}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">{t.footer.resources}</h4>
            <ul className="mt-3 space-y-2">
              {resourceItems.map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted transition-colors hover:text-foreground">{item.trim()}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">{t.footer.legal}</h4>
            <ul className="mt-3 space-y-2">
              {legalItems.map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted transition-colors hover:text-foreground">{item.trim()}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">{t.footer.business}</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <a href="mailto:32284762@qq.com" className="inline-flex items-center gap-1.5 text-sm text-primary transition-colors hover:text-primary-light">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  32284762@qq.com
                </a>
              </li>
              <li className="text-xs text-muted">{t.footer.businessDesc}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-card-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TokenScope. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
