import { useState, useMemo } from 'react';
import { Layout } from '../layout/Layout';
import { ContactsFilter } from './ContactsFilter';
import { ContactsTable } from './ContactsTable';
import { ContactModal } from './ContactModal';
import { SmsModal } from '../sms/SmsModal';
import { CzechMap } from '../map/CzechMap';
import { EuropeMap } from '../map/EuropeMap';
import { MapToggle } from '../map/MapToggle';
import type { MapMode } from '../map/MapToggle';
import type { Contact, RegionCode, Country, Material } from '../../types';
import { REGIONS } from '../../types';
import { useLanguage } from '../../lib/LanguageContext';
import { t } from '../../lib/i18n';
import './ContactsSection.css';

interface ContactsSectionProps {
  contacts: Contact[];
  onSaveContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  allMaterials: Material[];
  onAddMaterial: (material: string) => void;
  smsTemplate?: string;
}

export function ContactsSection({ contacts, onSaveContact, onDeleteContact, allMaterials, onAddMaterial, smsTemplate }: ContactsSectionProps) {
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
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);

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
    setFilterCountry(mode === 'CZ' ? 'CZ' : 'zahraničí');
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
    contacts.filter(c => c.country === 'CZ').forEach(c => {
      if (c.region) counts[c.region] = (counts[c.region] ?? 0) + 1;
    });
    return counts;
  }, [contacts]);

  const contactCountByEuCountry = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.filter(c => c.country === 'zahraničí').forEach(c => {
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

  const smsRecipients = contacts.filter(c => {
    if (!c.smsEnabled) return false;
    if (selectedRegion) return c.region === selectedRegion;
    if (selectedEuCountry) return c.euCountry === selectedEuCountry;
    return false;
  });

  const smsAreaName = selectedRegionName ?? selectedEuCountry ?? '';

  return (
    <>
      <Layout
        title={t('contacts_title', lang)}
        subtitle={`${filtered.length} ${lang === 'en' ? 'contacts' : 'kontaktů'} · ${smsCount} SMS ${lang === 'en' ? 'active' : 'aktivní'}`}
        actions={<button className="btn-primary" onClick={openCreate}>{t('contacts_add', lang)}</button>}
      >
        <ContactsFilter
          search={search}
          onSearchChange={setSearch}
          filterRegion={filterRegion}
          onRegionChange={setFilterRegion}
          filterCountry={filterCountry}
          onCountryChange={setFilterCountry}
          filterMaterial={filterMaterial}
          onMaterialChange={setFilterMaterial}
          allMaterials={allMaterials}
        />

        <div className="contacts-body">
          <div className="card contacts-map-card">
            <div className="contacts-map-header">
              <MapToggle mode={mapMode} onChange={handleMapModeChange} />
              {(selectedRegion || selectedEuCountry) && (
                <button className="btn-primary sms-btn" onClick={() => setSmsModalOpen(true)}>
                  ✉ SMS {selectedRegionName ?? selectedEuCountry}
                </button>
              )}
            </div>

            {mapMode === 'CZ' ? (
              <CzechMap
                selectedRegion={selectedRegion}
                onRegionSelect={handleRegionSelect}
                contactCountByRegion={contactCountByRegion}
              />
            ) : (
              <EuropeMap
                selectedCountry={selectedEuCountry}
                onCountrySelect={setSelectedEuCountry}
                contactCountByCountry={contactCountByEuCountry}
              />
            )}
          </div>

          <div className="contacts-table-section">
            <ContactsTable
              contacts={filtered}
              onEdit={openEdit}
            />
          </div>
        </div>
      </Layout>

      {smsModalOpen && (
        <SmsModal
          areaName={smsAreaName}
          countryCode={selectedRegion ? 'CZ' : (selectedEuCountry ?? 'CZ')}
          recipients={smsRecipients}
          customTemplate={smsTemplate}
          onClose={() => setSmsModalOpen(false)}
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
