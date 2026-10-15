// Venue photos. To use real ones, drop files into src/assets/photos/
// named photo-1.jpg, photo-2.jpg, photo-3.jpg (or .png/.webp); they replace the placeholders automatically.

const real = import.meta.glob('../assets/photos/photo-*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' })
const placeholder = import.meta.glob('../assets/photos/placeholder-*.svg', { eager: true, import: 'default' })

const CAPTIONS = [
  'Glacier, our 7-a-side pitch at Lokhandwala, under the floodlights',
  'Igloo futsal arena, Powai',
  'Sunday league at Baner',
]

function photoAt(i) {
  const n = i + 1
  const match = Object.entries(real).find(([path]) => path.includes(`photo-${n}.`))
  return match ? match[1] : placeholder[`../assets/photos/placeholder-${n}.svg`]
}

export default function VenueGallery() {
  return (
    <section className="section gallery" aria-labelledby="gallery-title">
      <div className="wrap editorial">
        <p className="label">Grounds</p>
        <div>
        <h2 id="gallery-title" className="section-title">Under the lights</h2>
        <div className="gallery-grid">
          {CAPTIONS.map((caption, i) => (
            <figure key={caption} className={`gallery-item gallery-item-${i + 1}`}>
              <img src={photoAt(i)} alt={caption} loading="lazy" />
              <figcaption>{caption}</figcaption>
            </figure>
          ))}
        </div>
        </div>
      </div>
    </section>
  )
}
