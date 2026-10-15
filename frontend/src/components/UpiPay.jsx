import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { formatRupees } from '../lib/format.js'

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

/**
 * Shows the UPI payment request two ways: a "Pay with GPay" button that opens
 * the UPI app on phones, and a QR code to scan from a laptop screen.
 */
export default function UpiPay({ upi, amount, bookingRef }) {
  const [qr, setQr] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(upi.uri, { width: 480, margin: 1, color: { dark: '#0F2A3D', light: '#FFFFFF' } })
      .then(setQr)
      .catch(() => setQr(null))
  }, [upi.uri])

  const copyVpa = async () => {
    try {
      await navigator.clipboard.writeText(upi.payeeVpa)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked; the ID is visible to copy by hand.
    }
  }

  return (
    <div className="upi">
      <div className="upi-qr">
        {qr ? <img src={qr} alt={`UPI QR code to pay ${formatRupees(amount)} to ${upi.payeeName}`} width="240" height="240" />
          : <div className="upi-qr-fallback">Loading QR code…</div>}
        <p className="muted">Scan with GPay, PhonePe, Paytm or any UPI app</p>
      </div>
      <div className="upi-actions">
        <a className="btn btn-primary btn-wide" href={upi.uri}>Pay {formatRupees(amount)} with GPay</a>
        {!isMobile() && <p className="muted small">The button opens GPay on your phone. On a computer, scan the QR code instead.</p>}
        <dl className="upi-details">
          <div><dt>Pay to</dt><dd>{upi.payeeName}</dd></div>
          <div>
            <dt>UPI ID</dt>
            <dd>{upi.payeeVpa} <button type="button" className="link-button" onClick={copyVpa}>{copied ? 'Copied' : 'Copy'}</button></dd>
          </div>
          <div><dt>Note</dt><dd>Ice Realm {bookingRef}</dd></div>
        </dl>
      </div>
    </div>
  )
}
