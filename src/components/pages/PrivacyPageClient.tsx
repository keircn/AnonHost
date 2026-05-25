'use client';

export function PrivacyPageClient() {
  return (
    <div className="container mx-auto max-w-2xl py-8 md:py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
        </div>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-foreground font-semibold">What we collect</h2>
            <p>
              We collect your email address and a display name when you register
              an account. We store files you upload along with their metadata
              (filename, size, upload timestamp).
            </p>
            <p>
              Anonymous uploads are not linked to any account. We store the
              upload timestamp and the file itself.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground font-semibold">
              What we don&apos;t collect
            </h2>
            <p>
              We don&apos;t use tracking cookies, analytics scripts, or
              third-party trackers. We don&apos;t sell your data. We don&apos;t
              read your files.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground font-semibold">Data retention</h2>
            <p>
              Account data is kept until you delete your account. Uploaded files
              are kept until you delete them or until an account is deleted.
              Anonymous uploads are kept indefinitely unless deleted via the
              deletion link.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground font-semibold">Third parties</h2>
            <p>
              Files are stored on Cloudflare R2. We use a Postgres database
              hosted on the same server. No third party has access to your data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-foreground font-semibold">Contact</h2>
            <p>
              For privacy questions:{' '}
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
