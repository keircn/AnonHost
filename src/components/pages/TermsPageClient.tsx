"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Ban, Scale } from "lucide-react";

const sections = [
  {
    icon: <Shield className="text-primary h-6 w-6" />,
    title: "Acceptable Use",
    content: [
      "You agree to use AnonHost for lawful purposes only",
      "No hosting of malicious content or malware",
      "No copyright infringement or illegal material",
      "Respect the privacy and rights of others",
    ],
  },
  {
    icon: <Lock className="text-primary h-6 w-6" />,
    title: "Privacy & Security",
    content: [
      "We protect your personal information",
      "Data is encrypted and stored securely",
      "You control your content's privacy settings",
      "We don't sell your personal data",
    ],
  },
  {
    icon: <Ban className="text-primary h-6 w-6" />,
    title: "Limitations",
    content: [
      "Free accounts have limited storage space",
      "Maximum file size restrictions apply",
      "API rate limits are enforced",
      "We may remove inactive accounts",
    ],
  },
  {
    icon: <Scale className="text-primary h-6 w-6" />,
    title: "Legal",
    content: [
      "Service provided 'as is' without warranty",
      "We reserve the right to modify these terms",
      "You retain ownership of your content",
      "We may terminate accounts for violations",
    ],
  },
];

export function TermsPageClient() {
  return (
    <div className="container py-8 md:py-12">
      <div className="space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            Welcome to AnonHost. By using our service, you agree to these terms. Please read them
            carefully.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title}>
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    {section.icon}
                    <h2 className="text-xl font-semibold">{section.title}</h2>
                  </div>
                  <ul className="space-y-2">
                    {section.content.map((item, i) => (
                      <li key={i} className="text-muted-foreground flex items-start">
                        <span className="text-primary mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="text-muted-foreground mx-auto max-w-2xl text-center text-sm">
          <p className="mb-4">
            These terms were last updated on April 2, 2025. If you have any questions about these
            terms, please contact us at <span className="text-primary">support@anonhost.cc</span>
          </p>
          <p>
            AnonHost reserves the right to update these terms at any time. Continued use of the
            service constitutes acceptance of any changes.
          </p>
        </div>
      </div>
    </div>
  );
}
