// The three formats as glass panes, each with a line-art pitch and one team lined up.
// Player positions are in a 100 x 60 box, left half only.

const FORMATS = [
  {
    name: '5-a-side',
    players: 10,
    size: '40 x 20 m',
    from: 1200,
    blurb: 'Quick, tight games. The cage keeps the ball in play.',
    team: [[8, 30], [26, 16], [26, 44], [40, 30], [46, 14]],
  },
  {
    name: '7-a-side',
    players: 14,
    size: '60 x 35 m',
    from: 1800,
    blurb: 'Room for real positions, rolling subs and league nights.',
    team: [[6, 30], [20, 14], [20, 30], [20, 46], [34, 20], [34, 40], [45, 30]],
  },
  {
    name: 'Futsal',
    players: 10,
    size: '38 x 20 m',
    from: 1500,
    blurb: 'Indoors and air-cooled. Plays the same through the monsoon.',
    team: [[8, 30], [24, 30], [34, 14], [34, 46], [45, 30]],
  },
]

function MiniPitch({ team }) {
  return (
    <svg viewBox="0 0 100 60" className="mini-pitch" aria-hidden="true">
      <rect x="1" y="1" width="98" height="58" />
      <line x1="50" y1="1" x2="50" y2="59" />
      <circle cx="50" cy="30" r="9" />
      <rect x="1" y="18" width="12" height="24" />
      <rect x="87" y="18" width="12" height="24" />
      {team.map(([x, y], i) => <circle key={i} className="player" cx={x} cy={y} r="2.4" />)}
      {team.map(([x, y], i) => <circle key={`o${i}`} className="player away" cx={100 - x} cy={60 - y} r="2.4" />)}
    </svg>
  )
}

export default function TurfFormats() {
  return (
    <section className="section" aria-labelledby="formats-title">
      <div className="wrap editorial">
        <p className="label">Formats</p>
        <div>
          <h2 id="formats-title" className="section-title">Choose how you play</h2>
          <ul className="format-list">
            {FORMATS.map((f) => (
              <li key={f.name} className="format">
                <MiniPitch team={f.team} />
                <div className="format-body">
                  <p className="label">{f.players} players · {f.size}</p>
                  <h3>{f.name}</h3>
                  <p>{f.blurb}</p>
                  <p className="format-price">From ₹{f.from.toLocaleString('en-IN')}/hr</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
