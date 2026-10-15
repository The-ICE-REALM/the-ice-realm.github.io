const STEPS = [
  { title: 'Pick a ground and an hour', body: 'Choose your city, a turf and a free slot. Slots with scan lines are already taken.' },
  { title: 'Pay with GPay', body: 'Scan the QR code or tap Pay with GPay. The amount and booking reference are filled in for you.' },
  { title: 'Show your ticket at the gate', body: "Enter the 12-digit UTR from your receipt. We'll confirm the slot, and your ticket lights up ice blue." },
]

export default function HowItWorks() {
  return (
    <section className="section" id="how" aria-labelledby="how-title">
      <div className="wrap editorial">
        <p className="label">How it works</p>
        <div>
          <h2 id="how-title" className="section-title">Booking takes a minute</h2>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="step-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
