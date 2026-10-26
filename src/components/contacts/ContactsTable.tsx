import type { Contact } from '../../types';
import { REGIONS, euCountryName } from '../../types';
import { useLanguage } from '../../lib/LanguageContext';
import { t } from '../../lib/i18n';
import './ContactsTable.css';

interface ContactsTableProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
}

const MATERIAL_COLORS: Record<string, string> = {
  'železo': '#64748b',
  'měď': '#c2410c',
  'hliník': '#0ea5e9',
  mosaz: '#ca8a04',
  nerez: '#14b8a6',
  olovo: '#6366f1',
  kabely: '#f43f5e',
  'elektro šrot': '#8b5cf6',
  autobaterie: '#16a34a',
  'papír': '#0284c7',
  plasty: '#db2777',
};

export function ContactsTable({ contacts, onEdit }: ContactsTableProps) {
  const lang = useLanguage();

  const getRegionName = (code?: string) =>
    REGIONS.find(r => r.code === code)?.name ?? '—';

  if (contacts.length === 0) {
    return (
      <div className="card contacts-empty">
        <div className="contacts-empty-icon">🔍</div>
        <p>{t('contacts_empty_msg', lang)}</p>
      </div>
    );
  }

  return (
    <div className="card contacts-table-wrap">
      <div className="contacts-table-scroll">
        <table className="contacts-table">
          <thead>
            <tr>
              <th>{t('col_name', lang)}</th>
              <th>{t('col_contact', lang)}</th>
              <th>{t('col_region', lang)}</th>
              <th>{t('col_material', lang)}</th>
              <th>
                <span className="th-sms">
                  SMS
                  <span className="th-tooltip" data-tooltip={t('sms_tooltip', lang)}>?</span>
                </span>
              </th>
              <th>
                <span className="th-sms">
                  E-mail
                  <span className="th-tooltip" data-tooltip={t('email_tooltip', lang)}>?</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {contacts.map(contact => (
              <tr key={contact.id} className="contact-row" onClick={() => onEdit(contact)}>
                <td>
                  <div className="contact-name-cell">
                    <div>
                      <div className="contact-name">{contact.name}</div>
                      <div className="contact-city">{contact.city}</div>
                    </div>
                  </div>
                </td>
                <td className="contact-reach">
                  <div className="contact-phone">{contact.phone}</div>
                  {contact.email && (
                    <div className="contact-email" title={contact.email}>{contact.email}</div>
                  )}
                </td>
                <td className="contact-region">
                  {contact.country === 'EU' ? euCountryName(contact.euCountry) : getRegionName(contact.region)}
                </td>
                <td>
                  <div className="material-badges">
                    {contact.materials.map(m => (
                      <span
                        key={m}
                        className="material-badge"
                        style={{ background: `${(MATERIAL_COLORS[m] ?? '#94a3b8')}20`, color: MATERIAL_COLORS[m] ?? '#94a3b8' }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`sms-icon ${contact.smsEnabled ? 'on' : 'off'}`}>
                    {contact.smsEnabled ? '✓' : '✕'}
                  </span>
                </td>
                <td>
                  <span className={`sms-icon ${contact.emailEnabled ? 'on' : 'off'}`}>
                    {contact.emailEnabled ? '✓' : '✕'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
