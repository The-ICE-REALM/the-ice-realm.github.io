import { useEffect, useRef } from 'react'

// Fixed backdrop for the whole site: a starfield with drifting ice shards in the logo's blues.
// Shards shift slightly with the pointer for depth. With reduced motion it draws one still frame.

const SHARD_COLOURS = [
  ['#90D8F3', '#256AA6'],
  ['#6196C3', '#0A315F'],
  ['#B9E9FA', '#29548C'],
]

function makeShard(w, h) {
  const size = 6 + Math.random() ** 2.4 * 34
  const points = 4 + Math.floor(Math.random() * 3)
  const verts = Array.from({ length: points }, (_, i) => {
    const a = (i / points) * Math.PI * 2 + Math.random() * 0.6
    const r = size * (0.55 + Math.random() * 0.6)
    return [Math.cos(a) * r, Math.sin(a) * r * (0.5 + Math.random() * 0.7)]
  })
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    depth: 0.3 + Math.random() * 0.9,
    vx: (Math.random() - 0.5) * 0.12,
    vy: -0.04 - Math.random() * 0.1,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.004,
    verts,
    colours: SHARD_COLOURS[Math.floor(Math.random() * SHARD_COLOURS.length)],
    alpha: 0.35 + Math.random() * 0.5,
  }
}

export default function SpaceBackdrop() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let stars = []
    let shards = []
    let frame = 0
    let raf = 0
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const area = (w * h) / 10000
      stars = Array.from({ length: Math.round(area * 1.6) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() < 0.08 ? 1.4 + Math.random() : 0.4 + Math.random() * 0.8,
        a: 0.25 + Math.random() * 0.6,
        tw: Math.random() * Math.PI * 2,
      }))
      shards = Array.from({ length: Math.max(10, Math.round(area / 7)) }, () => makeShard(w, h))
    }

    const drawShard = (s) => {
      const px = s.x + pointer.x * 24 * s.depth
      const py = s.y + pointer.y * 24 * s.depth
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(s.rot)
      ctx.scale(s.depth, s.depth)
      const g = ctx.createLinearGradient(-20, -20, 20, 20)
      g.addColorStop(0, s.colours[0])
      g.addColorStop(1, s.colours[1])
      ctx.globalAlpha = s.alpha * Math.min(1, s.depth + 0.2)
      ctx.beginPath()
      s.verts.forEach(([vx, vy], i) => (i ? ctx.lineTo(vx, vy) : ctx.moveTo(vx, vy)))
      ctx.closePath()
      ctx.fillStyle = g
      ctx.fill()
      // a lit edge, like the logo's highlight facets
      ctx.globalAlpha *= 0.9
      ctx.strokeStyle = '#D9F4FF'
      ctx.lineWidth = 0.8 / s.depth
      ctx.beginPath()
      ctx.moveTo(...s.verts[0])
      ctx.lineTo(...s.verts[1])
      ctx.stroke()
      ctx.restore()
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const st of stars) {
        const a = still ? st.a : st.a * (0.7 + 0.3 * Math.sin(st.tw + frame * 0.02))
        ctx.globalAlpha = a
        ctx.fillStyle = st.r > 1.3 ? '#CFEFFF' : '#D9E0ED'
        ctx.beginPath()
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      for (const s of shards) drawShard(s)
    }

    const tick = () => {
      frame++
      pointer.x += (pointer.tx - pointer.x) * 0.04
      pointer.y += (pointer.ty - pointer.y) * 0.04
      for (const s of shards) {
        s.x += s.vx * s.depth
        s.y += s.vy * s.depth
        s.rot += s.vr
        if (s.y < -60) { s.y = h + 60; s.x = Math.random() * w }
        if (s.x < -60) s.x = w + 60
        if (s.x > w + 60) s.x = -60
      }
      draw()
      raf = requestAnimationFrame(tick)
    }

    const onPointer = (e) => {
      pointer.tx = e.clientX / w - 0.5
      pointer.ty = e.clientY / h - 0.5
    }

    resize()
    window.addEventListener('resize', resize)
    if (still) {
      draw()
    } else {
      window.addEventListener('pointermove', onPointer, { passive: true })
      raf = requestAnimationFrame(tick)
    }
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])

  return (
    <>
      <div className="space-nebula" aria-hidden="true" />
      <canvas ref={ref} className="space-canvas" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
