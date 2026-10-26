import { useState, useMemo } from 'react';
import { Layout } from '../layout/Layout';
import { ContactsFilter } from './ContactsFilter';
import { ContactsTable } from './ContactsTable';
import { ContactModal } from './ContactModal';
import { SmsModal } from '../sms/SmsModal';
import { EmailModal } from '../email/EmailModal';
import { CsvImportModal } from '../import/CsvImportModal';
import { CzechMap } from '../map/CzechMap';
import { EuropeMap } from '../map/EuropeMap';
import { MapToggle } from '../map/MapToggle';
import type { MapMode } from '../map/MapToggle';
import type { Contact, RegionCode, Country, Material } from '../../types';
import { REGIONS, euCountryName } from '../../types';
import { useLanguage } from '../../lib/LanguageContext';
import { t } from '../../lib/i18n';
import './ContactsSection.css';

interface ContactsSectionProps {
  contacts: Contact[];
  onSaveContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  onImportContacts: (contacts: Contact[]) => void;
  allMaterials: Material[];
  onAddMaterial: (material: string) => void;
  smsTemplate?: string;
}

export function ContactsSection({ contacts, onSaveContact, onDeleteContact, onImportContacts, allMaterials, onAddMaterial, smsTemplate }: ContactsSectionProps) {
  const lang = useLanguage();
  const [mapMode, setMapMode] = useState<MapMode>('CZ');
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState<RegionCode | ''>('');
  const [filterCountry, setFilterCountry] = useState<Country | ''>('');
  const [filterMaterial, setFilterMaterial] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<RegionCode | null>(null);
  const [selectedEuCountry, setSelectedEuCountry] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  const [singleRecipient, setSingleRecipient] = useState<{ kind: 'sms' | 'email'; contact: Contact } | null>(null);

  const openCreate = () => {
    setEditingContact(undefined);
    setModalOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingContact(undefined);
  };

  const handleSave = (contact: Contact) => {
    onSaveContact(contact);
    closeModal();
  };

  const handleMapModeChange = (mode: MapMode) => {
    setMapMode(mode);
    setSelectedRegion(null);
    setSelectedEuCountry(null);
    setFilterRegion('');
    setFilterCountry(mode);
  };

  const handleRegionSelect = (code: RegionCode | null) => {
    setSelectedRegion(code);
    setFilterRegion(code ?? '');
  };

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
          !c.phone.includes(search) && !c.city.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (filterRegion && c.region !== filterRegion) return false;
      if (filterCountry && c.country !== filterCountry) return false;
      if (filterMaterial && !c.materials.includes(filterMaterial)) return false;
      if (selectedEuCountry && c.euCountry !== selectedEuCountry) return false;
      return true;
    });
  }, [contacts, search, filterRegion, filterCountry, filterMaterial, selectedEuCountry]);

  const contactCountByRegion = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.forEach(c => {
      if (c.region) counts[c.region] = (counts[c.region] ?? 0) + 1;
    });
    return counts;
  }, [contacts]);

  const contactCountByEuCountry = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.filter(c => c.country === 'EU').forEach(c => {
      if (c.euCountry) counts[c.euCountry] = (counts[c.euCountry] ?? 0) + 1;
    });
    return counts;
  }, [contacts]);

  const smsCount = filtered.filter(c => c.smsEnabled).length;

  const handleDeleteContact = (id: string) => {
    onDeleteContact(id);
  };

  const selectedRegionName = selectedRegion
    ? REGIONS.find(r => r.code === selectedRegion)?.name
    : null;

  const inSelectedArea = (c: Contact) =>
    selectedRegion ? c.region === selectedRegion : !!selectedEuCountry && c.country === 'EU' && c.euCountry === selectedEuCountry;
  const smsRecipients = contacts.filter(c => c.smsEnabled && inSelectedArea(c));
  const emailRecipients = contacts.filter(c => !!c.email && !!c.emailEnabled && inSelectedArea(c));

  const selectedEuCountryName = selectedEuCountry ? euCountryName(selectedEuCountry) : null;
  const smsAreaName = selectedRegionName ?? selectedEuCountryName ?? '';

  return (
    <>
      <Layout
        title={t('contacts_title', lang)}
        subtitle={`${filtered.length} ${t('contacts_subtitle', lang)} · ${smsCount} ${t('contacts_sms_active', lang)}`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setImportOpen(true)}>{t('contacts_import', lang)}</button>
            <button className="btn-primary" onClick={openCreate}>{t('contacts_add', lang)}</button>
          </>
        }
      >
        <ContactsFilter
          search={search}
          onSearchChange={setSearch}
          filterRegion={filterRegion}
          onRegionChange={code => handleRegionSelect(code || null)}
          filterCountry={filterCountry}
          onCountryChange={country => {
            setFilterCountry(country);
            setSelectedEuCountry(null);
          }}
          filterMaterial={filterMaterial}
          onMaterialChange={setFilterMaterial}
          allMaterials={allMaterials}
        />


        <div className="contacts-body">
          <div className="card contacts-map-card">
            <div className="contacts-map-header">
              <MapToggle mode={mapMode} onChange={handleMapModeChange} />
              {(selectedRegion || selectedEuCountry) && (
                <div className="area-actions">
                  <span className="area-name">{smsAreaName}</span>
                  <button className="btn-primary sms-btn" onClick={() => setSmsModalOpen(true)}>
                    {t('send_sms', lang)} ({smsRecipients.length})
                  </button>
                  <button className="btn-primary sms-btn" onClick={() => setEmailModalOpen(true)}>
                    {t('send_email', lang)} ({emailRecipients.length})
                  </button>
                </div>
              )}
            </div>

            {mapMode === 'EU' ? (
              <EuropeMap
                selectedCountry={selectedEuCountry}
                onCountrySelect={setSelectedEuCountry}
                contactCountByCountry={contactCountByEuCountry}
              />
            ) : (
              <CzechMap
                country={mapMode}
                selectedRegion={selectedRegion}
                onRegionSelect={handleRegionSelect}
                contactCountByRegion={contactCountByRegion}
              />
            )}
          </div>

          <div className="contacts-table-section">
            <ContactsTable
              contacts={filtered}
              onEdit={openEdit}
              onSendSms={contact => setSingleRecipient({ kind: 'sms', contact })}
              onSendEmail={contact => setSingleRecipient({ kind: 'email', contact })}
            />
          </div>
        </div>
      </Layout>

      {smsModalOpen && (
        <SmsModal
          areaName={smsAreaName}
          countryCode={mapMode === 'EU' ? (selectedEuCountry ?? 'GB') : mapMode}
          recipients={smsRecipients}
          customTemplate={smsTemplate}
          onClose={() => setSmsModalOpen(false)}
        />
      )}

      {singleRecipient?.kind === 'sms' && (
        <SmsModal
          areaName={singleRecipient.contact.name}
          countryCode={singleRecipient.contact.country === 'EU' ? (singleRecipient.contact.euCountry ?? 'GB') : singleRecipient.contact.country}
          recipients={[singleRecipient.contact]}
          customTemplate={smsTemplate}
          onClose={() => setSingleRecipient(null)}
        />
      )}

      {singleRecipient?.kind === 'email' && (
        <EmailModal
          areaName={singleRecipient.contact.name}
          country={singleRecipient.contact.country}
          recipients={[singleRecipient.contact]}
          onClose={() => setSingleRecipient(null)}
        />
      )}

      {importOpen && (
        <CsvImportModal
          existingContacts={contacts}
          allMaterials={allMaterials}
          onAddMaterial={onAddMaterial}
          onImport={onImportContacts}
          onClose={() => setImportOpen(false)}
        />
      )}

      {emailModalOpen && (
        <EmailModal
          areaName={smsAreaName}
          country={mapMode}
          recipients={emailRecipients}
          onClose={() => setEmailModalOpen(false)}
        />
      )}

      {modalOpen && (
        <ContactModal
          contact={editingContact}
          allMaterials={allMaterials.map(m => m.name)}
          onAddMaterial={onAddMaterial}
          onSave={handleSave}
          onDelete={editingContact ? () => handleDeleteContact(editingContact.id) : undefined}
          onClose={closeModal}
        />
      )}
    </>
  );
}
