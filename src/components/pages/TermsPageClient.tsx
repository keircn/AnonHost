'use client';

export function TermsPageClient() {
  return (
    <div className="container mx-auto max-w-2xl py-8 md:py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Terms of Service
          </h1>
        </div>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-foreground font-semibold">Acceptable use</h2>
            <p>
              Don&apos;t use AnonHost to host malware, phishing pages, or
              illegal content. Don&apos;t abuse the service to attack other
              systems or users.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground font-semibold">Accounts</h2>
            <p>
              You are responsible for keeping your API key and account
              credentials secure. Free accounts have storage and rate limits
              which may change over time.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground font-semibold">Content ownership</h2>
            <p>
              You retain ownership of files you upload. By uploading, you grant
              us permission to store and serve those files as part of operating
              the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground font-semibold">
              Limitation of liability
            </h2>
            <p>
              The service is provided &quot;as is&quot; without warranty. We are
              not liable for data loss, downtime, or any damages arising from
              use of the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground font-semibold">Changes</h2>
            <p>
              We may update these terms. Continued use after changes takes
              effect constitutes acceptance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground font-semibold">Contact</h2>
            <p>
              Questions:{' '}
              <a
                href="mailto:support@anonhost.cc"
                className="text-foreground hover:underline"
              >
                support@anonhost.cc
              </a>
            </p>
          </section>
        </div>

        <p className="text-xs text-muted-foreground">
          Last updated: April 2, 2025.
        </p>
      </div>
    </div>
  );
}
