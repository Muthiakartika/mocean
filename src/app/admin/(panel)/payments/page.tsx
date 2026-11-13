import Link from "next/link";
import { property } from "@/config/property";
import { getDb } from "@/lib/db";
import { siteOrigin } from "@/lib/booking/native/guest-link";
import { bankReady, loadPaymentSettings } from "@/lib/booking/native/payment-settings";
import { METHOD_LABEL, recentPayments } from "@/lib/booking/native/payments";
import { formatMoney } from "@/lib/booking/stay";
import { xenditConfigured } from "@/lib/payments/xendit";
import { savePaymentSettingsAction } from "../../actions";
import { Flash, PaymentBadge, one, resortTime } from "../../ui";

/**
 * How guests pay: the deposit rule, bank transfer details, online payment through Xendit (its keys are environment
 * variables, so this page only shows whether they are set and what to do), and the payments that came in.
 */
export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const db = await getDb();
  const [settings, recent] = await Promise.all([loadPaymentSettings(db), recentPayments(db, 25)]);
  const connected = xenditConfigured();
  const onlineLive = connected && settings.onlineEnabled;
  const webhook = `${siteOrigin()}/api/payments/xendit/`;

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Payments</h1>
          <p className="adm-muted">How guests pay the deposit that confirms a booking, and the money that came in.</p>
        </div>
      </div>
      <Flash done={one(query.done)} error={one(query.error)} />

      {!bankReady(settings) && !onlineLive && (
        <p className="adm-flash adm-flash--warn" role="note">
          Guests are not told how to pay yet. Switch on bank transfer or online payment below; until then, emails say you will arrange the deposit.
        </p>
      )}

      <div className="adm-pay-grid">
        <section className="adm-card" aria-labelledby="deposit-title">
          <h2 id="deposit-title">Deposit</h2>
          <p className="adm-muted adm-small">What a guest pays to confirm a booking. It applies to new bookings; bookings already made keep their deposit.</p>
          <form action={savePaymentSettingsAction} className="adm-stack">
            <input type="hidden" name="section" value="deposit" />
            <fieldset className="adm-choices">
              <legend className="sr-only">Deposit</legend>
              <label className="adm-choice">
                <input type="radio" name="depositMode" value="first-night" defaultChecked={settings.depositMode === "first-night"} />
                <span>
                  <strong>The first night of each room</strong>
                  <small>As on the Cloudbeds page.</small>
                </span>
              </label>
              <label className="adm-choice">
                <input type="radio" name="depositMode" value="percent" defaultChecked={settings.depositMode === "percent"} />
                <span>
                  <strong>A part of the total</strong>
                  <span className="adm-choice-inline">
                    <input
                      type="number"
                      name="depositPercent"
                      min={1}
                      max={100}
                      defaultValue={settings.depositPercent}
                      aria-label="Deposit, percent of the total"
                    />
                    % of the total
                  </span>
                </span>
              </label>
              <label className="adm-choice">
                <input type="radio" name="depositMode" value="full" defaultChecked={settings.depositMode === "full"} />
                <span>
                  <strong>The whole stay</strong>
                  <small>The guest pays everything to confirm.</small>
                </span>
              </label>
            </fieldset>
            <div>
              <button className="adm-btn" type="submit">
                Save deposit rule
              </button>
            </div>
          </form>
        </section>

        <section className="adm-card" aria-labelledby="bank-title">
          <h2 id="bank-title">Bank transfer</h2>
          <p className="adm-muted adm-small">Shown to guests on their booking page and in emails, with their booking number as the reference. You record the transfer when it arrives.</p>
          <form action={savePaymentSettingsAction} className="adm-stack">
            <input type="hidden" name="section" value="bank" />
            <label className="adm-check">
              <input type="checkbox" name="bankEnabled" defaultChecked={settings.bankEnabled} /> Offer bank transfer
            </label>
            <div className="adm-room-grid">
              <div>
                <label htmlFor="bankName">Bank</label>
                <input id="bankName" name="bankName" type="text" maxLength={80} defaultValue={settings.bankName} placeholder="e.g. Bank Mandiri" />
              </div>
              <div>
                <label htmlFor="bankAccountNumber">Account number</label>
                <input id="bankAccountNumber" name="bankAccountNumber" type="text" inputMode="numeric" maxLength={40} defaultValue={settings.bankAccountNumber} />
              </div>
              <div className="adm-span-2">
                <label htmlFor="bankAccountName">Account name</label>
                <input id="bankAccountName" name="bankAccountName" type="text" maxLength={120} defaultValue={settings.bankAccountName} />
              </div>
              <div className="adm-span-2">
                <label htmlFor="bankNote">
                  Note for guests <span className="adm-label-hint">optional</span>
                </label>
                <textarea id="bankNote" name="bankNote" rows={2} maxLength={300} defaultValue={settings.bankNote} placeholder="e.g. Please send a photo of the transfer slip on WhatsApp." />
              </div>
            </div>
            <div>
              <button className="adm-btn" type="submit">
                Save bank transfer
              </button>
            </div>
          </form>
        </section>

        <section className="adm-card adm-span-2" aria-labelledby="online-title">
          <div className="adm-pay-head">
            <h2 id="online-title">Online payment (Xendit)</h2>
            <span className={`adm-badge ${onlineLive ? "adm-badge--confirmed" : connected ? "adm-badge--pending" : "adm-badge--cancelled"}`}>
              {onlineLive ? "On" : connected ? "Connected, switched off" : "Not connected"}
            </span>
          </div>
          <p className="adm-muted adm-small">
            The guest presses &quot;Pay online&quot; on their booking page and pays on a Xendit page; when Xendit reports the payment, it is recorded here and a waiting
            request is confirmed by itself.
          </p>

          {connected ? (
            <form action={savePaymentSettingsAction} className="adm-stack">
              <input type="hidden" name="section" value="online" />
              <label className="adm-check">
                <input type="checkbox" name="onlineEnabled" defaultChecked={settings.onlineEnabled} /> Offer online payment on the guest&apos;s booking page
              </label>
              <div>
                <button className="adm-btn" type="submit">
                  Save
                </button>
              </div>
              <div className="adm-code-box">
                <span>Webhook address for Xendit (Settings &gt; Webhooks, invoices paid and expired)</span>
                <code>{webhook}</code>
              </div>
            </form>
          ) : (
            <ol className="adm-steps">
              <li>Open a Xendit account for {property.name}&apos;s company and finish its verification.</li>
              <li>
                In the Xendit Dashboard, <strong>Settings &gt; API Keys</strong>: make a secret key. Start with a test key: test payments move no money.
              </li>
              <li>
                <strong>Settings &gt; Webhooks</strong>: copy the verification token, and set this address for invoices: <code>{webhook}</code>
              </li>
              <li>
                On the server (Vercel &gt; Settings &gt; Environment Variables): <code>XENDIT_SECRET_KEY</code> and <code>XENDIT_CALLBACK_TOKEN</code>, then redeploy.
              </li>
              <li>Come back here, switch online payment on, and pay a test booking from start to end.</li>
            </ol>
          )}
        </section>

        <section className="adm-card adm-span-2" aria-labelledby="recent-title">
          <h2 id="recent-title">Recent payments</h2>
          {recent.length === 0 ? (
            <p className="adm-muted">No payments yet.</p>
          ) : (
            <div className="adm-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Booking</th>
                    <th>How</th>
                    <th>Status</th>
                    <th className="adm-num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(({ payment, code, firstName, lastName }) => (
                    <tr key={payment.id}>
                      <td>{resortTime(payment.paidAt ?? payment.createdAt)}</td>
                      <td>
                        <Link href={`/admin/reservations/${code}/#payments`}>{code}</Link>
                        <div className="adm-muted adm-small">
                          {firstName} {lastName}
                        </div>
                      </td>
                      <td>
                        {METHOD_LABEL[payment.method]}
                        {payment.channel && <div className="adm-muted adm-small">{payment.channel}</div>}
                      </td>
                      <td>
                        <PaymentBadge status={payment.status} />
                      </td>
                      <td className="adm-num">{formatMoney(payment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
