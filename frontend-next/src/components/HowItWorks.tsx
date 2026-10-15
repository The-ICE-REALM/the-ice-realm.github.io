const steps = [
  {
    title: "Select your territory",
    body: "Tap the crest to find turfs near you, or filter by city and format.",
  },
  {
    title: "Pick your pitch and day",
    body: "Choose a pitch at the ground and any day this week. Each date shows how many hours are still open.",
  },
  {
    title: "Lock your hour",
    body: "Pick a start time and play for one, two or three hours. We hold the slot for 15 minutes.",
  },
  {
    title: "Pay with UPI",
    body: "Scan the QR code or tap Pay, then send the 12-digit UTR. Once we confirm it, show your code at the gate.",
  },
];

export function HowItWorks() {
  return (
    <section
      className="how-section page-frame"
      id="how-it-works"
      aria-labelledby="how-heading"
      data-testid="how-it-works-section"
    >
      <div className="section-heading-row">
        <h2 id="how-heading" data-testid="how-heading">
          Four steps
          <br />
          <em>to kick-off.</em>
        </h2>
        <p className="section-lede">From the group chat to the centre circle in under a minute. No app to install.</p>
      </div>

      <ol className="fixture-line">
        {steps.map((step, index) => (
          <li key={step.title} data-testid={`how-step-${index + 1}`}>
            <span className="fixture-step">{String(index + 1).padStart(2, "0")}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
