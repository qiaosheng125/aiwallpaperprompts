export const metadata = {
  title: "Privacy",
  alternates: {
    canonical: "/privacy"
  }
};

export default function PrivacyPage() {
  return (
    <main className="plainPage">
      <section>
        <p className="eyebrow">PRIVACY</p>
        <h1>Privacy</h1>
        <p>
          The gallery displays curated images, public prompt text, and visual
          tags. It does not require login and does not ask visitors to upload
          files.
        </p>
        <p>
          If analytics IDs are configured, analytics may collect basic page
          usage data such as page views and interaction events. Prompt copy
          events may be measured without collecting private user files.
        </p>
        <p>
          For privacy questions or bug reports, email{" "}
          <a href="mailto:support@aiwallpaperprompts.com">
            support@aiwallpaperprompts.com
          </a>
          . Your email address and message are used only to respond to your request.
        </p>
      </section>
    </main>
  );
}
