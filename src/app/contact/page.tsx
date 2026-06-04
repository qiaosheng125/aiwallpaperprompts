export const metadata = {
  title: "Contact",
  alternates: {
    canonical: "/contact"
  }
};

export default function ContactPage() {
  return (
    <main className="plainPage">
      <section>
        <p className="eyebrow">CONTACT</p>
        <h1>Contact</h1>
        <p>
          Send feedback about broken image links, prompt quality, category
          mistakes, or images that should be reviewed again.
        </p>
        <p>
          Email:{" "}
          <a href="mailto:support@aiwallpaperprompts.com">
            support@aiwallpaperprompts.com
          </a>
        </p>
      </section>
    </main>
  );
}
