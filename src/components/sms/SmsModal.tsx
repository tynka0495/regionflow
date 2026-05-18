import { useState } from 'react';
import type { Contact } from '../../types';
import './SmsModal.css';

interface SmsModalProps {
  areaName: string;
  countryCode: string;
  recipients: Contact[];
  customTemplate?: string;
  onClose: () => void;
}

const MAX_CHARS = 160;

const LOCALE_MAP: Record<string, string> = {
  CZ: 'cs-CZ', DE: 'de-DE', AT: 'de-AT', PL: 'pl-PL',
  SK: 'sk-SK', FR: 'fr-FR', HU: 'hu-HU', NL: 'nl-NL',
  IT: 'it-IT', ES: 'es-ES', BE: 'fr-BE', CH: 'de-CH',
  SE: 'sv-SE', NO: 'nb-NO', DK: 'da-DK', FI: 'fi-FI',
  PT: 'pt-PT', RO: 'ro-RO', BG: 'bg-BG', HR: 'hr-HR',
  SI: 'sl-SI', GR: 'el-GR', IE: 'en-IE', LT: 'lt-LT',
  LV: 'lv-LV', EE: 'et-EE', GB: 'en-GB', RS: 'sr-RS',
  BA: 'bs-BA', AL: 'sq-AL', MK: 'mk-MK',
};

const TEMPLATES: Record<string, (date: string) => string> = {
  CZ: d => `Dobrý den, oznamujeme Vám nový výkup materiálů dne ${d}. Těšíme se na vaši spolupráci. Tým RegionFlow`,
  DE: d => `Guten Tag, wir informieren Sie über einen neuen Materialankauf am ${d}. Wir freuen uns auf Ihre Zusammenarbeit. Team RegionFlow`,
  AT: d => `Guten Tag, wir informieren Sie über einen neuen Materialankauf am ${d}. Wir freuen uns auf Ihre Zusammenarbeit. Team RegionFlow`,
  PL: d => `Dzień dobry, informujemy o nowym skupie materiałów w dniu ${d}. Cieszymy się na współpracę. Zespół RegionFlow`,
  SK: d => `Dobrý deň, oznamujeme Vám nový výkup materiálov dňa ${d}. Tešíme sa na vašu spoluprácu. Tím RegionFlow`,
  FR: d => `Bonjour, nous vous informons d'un nouveau rachat de matériaux le ${d}. Nous nous réjouissons de votre collaboration. Équipe RegionFlow`,
  HU: d => `Jó napot! Értesítjük, hogy ${d}-én új anyagfelvásárlás lesz. Várjuk együttműködését. RegionFlow csapat`,
  NL: d => `Goedendag, wij informeren u over een nieuwe materiaalopkoop op ${d}. We kijken uit naar uw samenwerking. Team RegionFlow`,
  IT: d => `Buongiorno, la informiamo di un nuovo acquisto di materiali il ${d}. Attendiamo la sua collaborazione. Team RegionFlow`,
  ES: d => `Buenos días, le informamos de una nueva compra de materiales el ${d}. Esperamos su colaboración. Equipo RegionFlow`,
  SE: d => `God dag, vi informerar om ett nytt materialinköp den ${d}. Vi ser fram emot ert samarbete. Team RegionFlow`,
  NO: d => `God dag, vi informerer om et nytt materialkjøp den ${d}. Vi ser frem til samarbeidet. Team RegionFlow`,
  DK: d => `God dag, vi informerer om et nyt materialeindkøb den ${d}. Vi ser frem til samarbejdet. Team RegionFlow`,
  FI: d => `Hyvää päivää, tiedotamme uudesta materiaalien ostosta ${d}. Odotamme yhteistyötänne. RegionFlow-tiimi`,
  PT: d => `Bom dia, informamos sobre uma nova compra de materiais em ${d}. Aguardamos a sua colaboração. Equipa RegionFlow`,
  RO: d => `Bună ziua, vă informăm despre o nouă achiziție de materiale pe ${d}. Așteptăm colaborarea dumneavoastră. Echipa RegionFlow`,
  GB: d => `Good day, we inform you of a new material purchase on ${d}. We look forward to your cooperation. RegionFlow Team`,
};

function getTemplate(countryCode: string, customTemplate?: string): string {
  const today = new Date();
  const locale = LOCALE_MAP[countryCode] ?? 'cs-CZ';
  const date = today.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  if (customTemplate) return customTemplate.replace('{datum}', date);
  const templateFn = TEMPLATES[countryCode] ?? TEMPLATES['CZ'];
  return templateFn(date);
}

export function SmsModal({ areaName, countryCode, recipients, customTemplate, onClose }: SmsModalProps) {
  const [message, setMessage] = useState(() => getTemplate(countryCode, customTemplate));
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const charsLeft = MAX_CHARS - message.length;
  const smsCount = Math.ceil(message.length / MAX_CHARS) || 1;
  const canSend = message.trim().length > 0 && recipients.length > 0;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal sms-modal">
        <div className="modal-header">
          <div>
            <h2>Rozeslat SMS</h2>
            <p className="modal-subtitle">{areaName}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {sent ? (
          <div className="sms-success">
            <div className="sms-success-icon">✓</div>
            <h3>SMS odeslány!</h3>
            <p>Zpráva byla odeslána {recipients.length} {recipients.length === 1 ? 'příjemci' : 'příjemcům'}.</p>
            <button className="btn-primary" onClick={onClose}>Zavřít</button>
          </div>
        ) : (
          <>
            <div className="modal-body">
              <div className="sms-recipients">
                <div className="sms-recipients-header">
                  <span className="sms-recipients-label">Příjemci</span>
                  <span className="sms-recipients-count">{recipients.length} kontaktů se zapnutým SMS</span>
                </div>
                {recipients.length === 0 ? (
                  <div className="sms-no-recipients">
                    Žádný kontakt v tomto regionu nemá zapnuté SMS upozornění.
                  </div>
                ) : (
                  <div className="sms-recipients-list">
                    {recipients.map(c => (
                      <div key={c.id} className="sms-recipient">
                        <div className="sms-recipient-avatar">{c.name.charAt(0)}</div>
                        <div>
                          <div className="sms-recipient-name">{c.name}</div>
                          <div className="sms-recipient-phone">{c.phone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-field">
                <label>Zpráva *</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={5}
                  className="sms-textarea"
                />
                <div className="sms-meta">
                  <span className={`sms-chars ${charsLeft < 20 ? 'warning' : ''} ${message.length > MAX_CHARS ? 'over' : ''}`}>
                    {message.length} znaků
                    {smsCount > 1 && <span className="sms-count-badge"> · {smsCount} SMS</span>}
                  </span>
                  <span className="sms-chars-hint">
                    {charsLeft >= 0 ? `zbývá ${charsLeft} do 1 SMS` : `${smsCount} SMS zprávy`}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Zrušit</button>
              <button
                className={`btn-primary sms-send-btn ${sending ? 'sending' : ''}`}
                onClick={handleSend}
                disabled={!canSend || sending}
              >
                {sending ? (
                  <><span className="sms-spinner" /> Odesílám...</>
                ) : (
                  <>✉ Odeslat {recipients.length > 0 && `(${recipients.length})`}</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
