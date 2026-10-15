// Text that rolls up to a copy of itself on hover or focus of its closest .roll-host.
// The copy is hidden from screen readers so the label is announced once.
export default function Roll({ children }) {
  return (
    <span className="roll">
      <span className="roll-a">{children}</span>
      <span className="roll-b" aria-hidden="true">{children}</span>
    </span>
  )
}
