import { useState } from 'react';
import type { Contact, Country } from '../../types';
import '../sms/SmsModal.css';
import './EmailModal.css';

interface EmailModalProps {
  areaName: string;
  country: Country;
  recipients: Contact[];
  onClose: () => void;
}

interface Campaign {
  id: string;
  label: string;
  subject: string;
  body: string;
}

const CAMPAIGNS_CZ: Campaign[] = [
  {
    id: 'christmas',
    label: '🎄 Vánoce',
    subject: 'Vánoční bonus +15 % za všechny materiály 🎄',
    body: 'Dobrý den, {jmeno},\n\nudělejte si před Vánoci místo doma i v dílně. Od 1. do 23. prosince Vám za všechny materiály vyplatíme o 15 % víc než obvykle.\n\nStačí odpovědět na tento e-mail a domluvíme termín výkupu.\n\nKrásné svátky přeje\nTým RegionFlow',
  },
  {
    id: 'price',
    label: '📈 Vyšší cena',
    subject: 'Tento týden vykupujeme měď za vyšší cenu',
    body: 'Dobrý den, {jmeno},\n\nceny kovů jdou nahoru a my to posíláme dál: do neděle vykupujeme měď, mosaz a kabely za zvýšené ceny. Platíme hned na místě.\n\nPřijďte na kteroukoliv naši provozovnu nebo odpovězte a domluvíme odvoz.\n\nTým RegionFlow',
  },
  {
    id: 'black-friday',
    label: '🖤 Black Friday',
    subject: 'Black Friday: jen tento týden vykupujeme za vyšší ceny',
    body: 'Dobrý den, {jmeno},\n\nzatímco ostatní slevy dávají, my přidáváme. Celý Black Friday týden vykupujeme měď, mosaz, hliník a kabely za zvýhodněné ceny.\n\nOzvěte se a domluvíme odvoz.\n\nTým RegionFlow',
  },
  {
    id: 'spring',
    label: '🌱 Jarní úklid',
    subject: 'Jarní úklid? Starý kov a papír od Vás odvezeme zdarma',
    body: 'Dobrý den, {jmeno},\n\njaro je ideální čas vyklidit garáž, dílnu i půdu. Při výkupu nad 200 kg železa nebo papíru si pro materiál přijedeme zdarma.\n\nTěšíme se na spolupráci,\nTým RegionFlow',
  },
  {
    id: 'loyalty',
    label: '⭐ Věrnostní bonus',
    subject: 'Děkujeme za spolupráci – máme pro Vás bonus',
    body: 'Dobrý den, {jmeno},\n\nděkujeme, že s námi spolupracujete. Při příštím výkupu Vám jako věrnému partnerovi přidáme bonus 500 Kč.\n\nTým RegionFlow',
  },
  {
    id: 'custom',
    label: '✏️ Vlastní',
    subject: '',
    body: 'Dobrý den, {jmeno},\n\n\n\nTým RegionFlow',
  },
];

const CAMPAIGNS_SK: Campaign[] = [
  {
    id: 'christmas',
    label: '🎄 Vianoce',
    subject: 'Vianočný bonus +15 % za všetky materiály 🎄',
    body: 'Dobrý deň, {jmeno},\n\nurobte si pred Vianocami miesto doma aj v dielni. Od 1. do 23. decembra Vám za všetky materiály vyplatíme o 15 % viac ako zvyčajne.\n\nStačí odpovedať na tento e-mail a dohodneme termín výkupu.\n\nKrásne sviatky praje\nTím RegionFlow',
  },
  {
    id: 'price',
    label: '📈 Vyššia cena',
    subject: 'Tento týždeň vykupujeme meď za vyššiu cenu',
    body: 'Dobrý deň, {jmeno},\n\nceny kovov idú hore a my to posúvame ďalej: do nedele vykupujeme meď, mosadz a káble za zvýšené ceny. Platíme hneď na mieste.\n\nPríďte na ktorúkoľvek našu prevádzku alebo odpovedzte a dohodneme odvoz.\n\nTím RegionFlow',
  },
  {
    id: 'black-friday',
    label: '🖤 Black Friday',
    subject: 'Black Friday: len tento týždeň vykupujeme za vyššie ceny',
    body: 'Dobrý deň, {jmeno},\n\nkým ostatní dávajú zľavy, my pridávame. Celý Black Friday týždeň vykupujeme meď, mosadz, hliník a káble za zvýhodnené ceny.\n\nOzvite sa a dohodneme odvoz.\n\nTím RegionFlow',
  },
  {
    id: 'spring',
    label: '🌱 Jarné upratovanie',
    subject: 'Jarné upratovanie? Starý kov a papier od Vás odvezieme zadarmo',
    body: 'Dobrý deň, {jmeno},\n\njar je ideálny čas vypratať garáž, dielňu aj povalu. Pri výkupe nad 200 kg železa alebo papiera si pre materiál prídeme zadarmo.\n\nTešíme sa na spoluprácu,\nTím RegionFlow',
  },
  {
    id: 'loyalty',
    label: '⭐ Vernostný bonus',
    subject: 'Ďakujeme za spoluprácu – máme pre Vás bonus',
    body: 'Dobrý deň, {jmeno},\n\nďakujeme, že s nami spolupracujete. Pri ďalšom výkupe Vám ako vernému partnerovi pridáme bonus 20 €.\n\nTím RegionFlow',
  },
  {
    id: 'custom',
    label: '✏️ Vlastný',
    subject: '',
    body: 'Dobrý deň, {jmeno},\n\n\n\nTím RegionFlow',
  },
];

const CAMPAIGNS_EN: Campaign[] = [
  {
    id: 'christmas',
    label: '🎄 Christmas',
    subject: 'Christmas bonus: +15 % for all materials 🎄',
    body: 'Hello {jmeno},\n\nmake some room before Christmas. From 1 to 23 December we pay 15 % more than usual for all materials.\n\nJust reply to this e-mail and we will arrange a pickup.\n\nHappy holidays,\nRegionFlow Team',
  },
  {
    id: 'price',
    label: '📈 Higher price',
    subject: 'This week we pay more for copper',
    body: 'Hello {jmeno},\n\nmetal prices are up and we pass it on: until Sunday we buy copper, brass and cables at higher prices. We pay on the spot.\n\nVisit any of our yards or reply and we will arrange a pickup.\n\nRegionFlow Team',
  },
  {
    id: 'black-friday',
    label: '🖤 Black Friday',
    subject: 'Black Friday: higher purchase prices this week only',
    body: 'Hello {jmeno},\n\nwhile others give discounts, we add more. During Black Friday week we buy copper, brass, aluminium and cables at bonus prices.\n\nGet in touch and we will arrange a pickup.\n\nRegionFlow Team',
  },
  {
    id: 'spring',
    label: '🌱 Spring cleaning',
    subject: 'Spring cleaning? We pick up your old metal and paper for free',
    body: 'Hello {jmeno},\n\nspring is the perfect time to clear out your garage and workshop. For pickups over 200 kg of iron or paper we come to you for free.\n\nLooking forward to working with you,\nRegionFlow Team',
  },
  {
    id: 'loyalty',
    label: '⭐ Loyalty bonus',
    subject: 'Thank you for working with us – a bonus for you',
    body: 'Hello {jmeno},\n\nthank you for working with us. On your next pickup we will add a €20 loyalty bonus.\n\nRegionFlow Team',
  },
  {
    id: 'custom',
    label: '✏️ Custom',
    subject: '',
    body: 'Hello {jmeno},\n\n\n\nRegionFlow Team',
  },
];

export function EmailModal({ areaName, country, recipients, onClose }: EmailModalProps) {
  const CAMPAIGNS = { CZ: CAMPAIGNS_CZ, SK: CAMPAIGNS_SK, EU: CAMPAIGNS_EN }[country];
  const [campaignId, setCampaignId] = useState(CAMPAIGNS[0].id);
  const [subject, setSubject] = useState(CAMPAIGNS[0].subject);
  const [body, setBody] = useState(CAMPAIGNS[0].body);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && recipients.length > 0;
  const preview = body.replace('{jmeno}', recipients[0]?.name.split(' ')[0] ?? 'Jane');

  const pickCampaign = (c: Campaign) => {
    setCampaignId(c.id);
    setSubject(c.subject);
    setBody(c.body);
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal sms-modal email-modal">
        <div className="modal-header">
          <div>
            <h2>Marketingový e-mail</h2>
            <p className="modal-subtitle">{areaName}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {sent ? (
          <div className="sms-success">
            <div className="sms-success-icon">✓</div>
            <h3>E-maily odeslány!</h3>
            <p>Kampaň byla odeslána {recipients.length} {recipients.length === 1 ? 'příjemci' : 'příjemcům'}.</p>
            <button className="btn-primary" onClick={onClose}>Zavřít</button>
          </div>
        ) : (
          <>
            <div className="modal-body">
              <div className="email-campaigns">
                {CAMPAIGNS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`email-campaign ${campaignId === c.id ? 'active' : ''}`}
                    onClick={() => pickCampaign(c)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="sms-recipients">
                <div className="sms-recipients-header">
                  <span className="sms-recipients-label">Příjemci</span>
                  <span className="sms-recipients-count">{recipients.length} kontaktů se souhlasem</span>
                </div>
                {recipients.length === 0 ? (
                  <div className="sms-no-recipients">
                    Žádný kontakt v této oblasti nemá e-mail se souhlasem s marketingem.
                  </div>
                ) : (
                  <div className="sms-recipients-list">
                    {recipients.map(c => (
                      <div key={c.id} className="sms-recipient">
                        <div className="sms-recipient-avatar">{c.name.charAt(0)}</div>
                        <div>
                          <div className="sms-recipient-name">{c.name}</div>
                          <div className="sms-recipient-phone">{c.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-field">
                <label>Předmět *</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} className="email-subject" />
              </div>

              <div className="form-field">
                <label>Text * <span className="email-hint">{'{jmeno}'} se nahradí křestním jménem</span></label>
                <textarea value={body} onChange={e => setBody(e.target.value)} rows={8} className="sms-textarea" />
              </div>

              <details className="email-preview">
                <summary>Náhled pro {recipients[0]?.name ?? 'příjemce'}</summary>
                <div className="email-preview-subject">{subject}</div>
                <pre className="email-preview-body">{preview}</pre>
              </details>
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
                  <>📧 Odeslat {recipients.length > 0 && `(${recipients.length})`}</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
