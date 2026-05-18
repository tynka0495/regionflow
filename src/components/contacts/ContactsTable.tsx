import type { Contact } from '../../types';
import { REGIONS } from '../../types';
import './ContactsTable.css';

interface ContactsTableProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
}

const MATERIAL_COLORS: Record<string, string> = {
  kontakty: '#6366f1',
  desky: '#0ea5e9',
  konektory: '#f59e0b',
  mobily: '#10b981',
  elektronika: '#8b5cf6',
  kabely: '#f43f5e',
  cpu: '#14b8a6',
  ram: '#fb923c',
  hdd: '#a3e635',
  ostatní: '#94a3b8',
};

export function ContactsTable({ contacts, onEdit }: ContactsTableProps) {
  const getRegionName = (code?: string) =>
    REGIONS.find(r => r.code === code)?.name ?? '—';

  if (contacts.length === 0) {
    return (
      <div className="card contacts-empty">
        <div className="contacts-empty-icon">🔍</div>
        <p>Žádné kontakty neodpovídají filtru</p>
      </div>
    );
  }

  return (
    <div className="card contacts-table-wrap">
      <div className="contacts-table-scroll">
        <table className="contacts-table">
          <thead>
            <tr>
              <th>Jméno</th>
              <th>Telefon</th>
              <th>Kraj / Město</th>
              <th>Materiál</th>
              <th>
                <span className="th-sms">
                  SMS
                  <span className="th-tooltip" data-tooltip="Kontakt souhlasí s přijímáním SMS upozornění o výkupech. Hromadná SMS se odešle jen těmto kontaktům.">?</span>
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
                <td className="contact-phone">{contact.phone}</td>
                <td className="contact-region">
                  {contact.country === 'CZ'
                    ? getRegionName(contact.region)
                    : <span className="badge-foreign">Zahraničí</span>
                  }
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
