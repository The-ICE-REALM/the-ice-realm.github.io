import { useState } from 'react'

/** Asks for the mobile number a booking was made with, to prove it's theirs. */
export default function PhonePrompt({ onSubmit, error, withRef = false, initialRef = '' }) {
  const [phone, setPhone] = useState('')
  const [ref, setRef] = useState(initialRef)

  return (
    <form className="phone-prompt" onSubmit={(e) => { e.preventDefault(); onSubmit(phone, ref.trim().toUpperCase()) }}>
      {withRef && (
        <label className="field">
          <span>Booking reference</span>
          <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="IR-XXXXXX" autoCapitalize="characters" />
        </label>
      )}
      <label className="field">
        <span>Mobile number you booked with</span>
        <input type="tel" inputMode="numeric" maxLength={10} placeholder="10 digits" value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} />
      </label>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button className="btn btn-secondary" type="submit" disabled={phone.length !== 10 || (withRef && !ref.trim())}>
        Show my booking
      </button>
    </form>
  )
}
