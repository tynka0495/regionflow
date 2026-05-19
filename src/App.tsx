import { useState, useEffect, useLayoutEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, rowToContact, rowToMaterial, contactToRow, rowToSettings, settingsToRow } from './lib/supabase';
import { LanguageContext } from './lib/LanguageContext';
import { Sidebar } from './components/layout/Sidebar';
import { ContactsSection } from './components/contacts/ContactsSection';
import { MaterialsSection } from './components/materials/MaterialsSection';
import { SettingsSection } from './components/settings/SettingsSection';
import { AuthPage } from './components/auth/AuthPage';
import type { ActiveSection, Contact, Material, UserSettings } from './types';
import { MATERIALS } from './types';
import './styles/globals.css';
import './App.css';

const ACCENT_HOVER: Record<string, string> = {
  '#4f46e5': '#4338ca',
  '#7c3aed': '#6d28d9',
  '#0284c7': '#0369a1',
  '#059669': '#047857',
  '#e11d48': '#be123c',
  '#d97706': '#b45309',
};

function applyTheme(settings: UserSettings) {
  document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
  const color = settings.accentColor ?? '#4f46e5';
  const hover = ACCENT_HOVER[color] ?? '#4338ca';
  document.documentElement.style.setProperty('--primary', color);
  document.documentElement.style.setProperty('--primary-hover', hover);
  document.documentElement.style.setProperty('--sidebar-active', color);
  if (settings.darkMode !== undefined) localStorage.setItem('darkMode', String(settings.darkMode));
  if (settings.accentColor) localStorage.setItem('accentColor', settings.accentColor);
}


export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>(() => {
    const saved = localStorage.getItem('activeSection');
    return (saved as ActiveSection) || 'contacts';
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({});

  useLayoutEffect(() => {
    const dark = localStorage.getItem('darkMode') === 'true';
    const accent = localStorage.getItem('accentColor') ?? undefined;
    applyTheme({ darkMode: dark, accentColor: accent });
  }, []);

  const loadData = async (userId: string) => {
    const [{ data: contactRows }, { data: materialRows }, { data: settingsRow }] = await Promise.all([
      supabase.from('contacts').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('materials').select('*').eq('user_id', userId).order('sort_order'),
      supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    if (contactRows) setContacts(contactRows.map(rowToContact));

    if (materialRows && materialRows.length > 0) {
      setAllMaterials(materialRows.map(rowToMaterial));
    } else {
      const defaults = MATERIALS.map((m, i) => ({ ...m, user_id: userId, sort_order: i }));
      const { data: seeded } = await supabase.from('materials').insert(defaults).select();
      if (seeded) setAllMaterials(seeded.map(rowToMaterial));
    }

    if (settingsRow) {
      const s = rowToSettings(settingsRow);
      setUserSettings(s);
      applyTheme(s);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setAppLoading(false);
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        loadData(session.user.id);
      } else if (!session) {
        setContacts([]);
        setAllMaterials([]);
        setUserSettings({});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSectionChange = (section: ActiveSection) => {
    setActiveSection(section);
    localStorage.setItem('activeSection', section);
  };

  const handleLogout = () => supabase.auth.signOut();

  const handleUpdateSettings = async (updates: Partial<UserSettings>) => {
    if (!session) return;
    const updated = { ...userSettings, ...updates };
    setUserSettings(updated);
    applyTheme(updated);
    await supabase.from('user_settings').upsert(settingsToRow(updated, session.user.id));
  };

  const handleAddMaterial = async (nameOrMaterial: string | Material) => {
    const mat: Material = typeof nameOrMaterial === 'string'
      ? { name: nameOrMaterial, active: true }
      : nameOrMaterial;
    if (!session || allMaterials.find(m => m.name === mat.name)) return;
    const row = { ...mat, user_id: session.user.id, sort_order: allMaterials.length };
    const { data } = await supabase.from('materials').insert(row).select().single();
    if (data) setAllMaterials(prev => [...prev, rowToMaterial(data)]);
  };

  const handleUpdateMaterial = async (oldName: string, updated: Material) => {
    if (!session) return;
    setAllMaterials(prev => prev.map(m => m.name === oldName ? updated : m));
    if (oldName !== updated.name) {
      setContacts(prev => prev.map(c => ({
        ...c,
        materials: c.materials.map(m => m === oldName ? updated.name : m),
      })));
      await supabase.rpc('rename_material_in_contacts', {
        p_user_id: session.user.id,
        p_old_name: oldName,
        p_new_name: updated.name,
      }).throwOnError();
    }
    await supabase.from('materials')
      .update({ name: updated.name, price: updated.price ?? null, unit: updated.unit ?? null, active: updated.active ?? true })
      .eq('user_id', session.user.id)
      .eq('name', oldName);
  };

  const handleDeleteMaterial = async (name: string) => {
    if (!session) return;
    setAllMaterials(prev => prev.filter(m => m.name !== name));
    setContacts(prev => prev.map(c => ({ ...c, materials: c.materials.filter(m => m !== name) })));
    await supabase.from('materials').delete().eq('user_id', session.user.id).eq('name', name);
    await supabase.rpc('remove_material_from_contacts', {
      p_user_id: session.user.id,
      p_material_name: name,
    });
  };

  const handleSaveContact = async (contact: Contact) => {
    if (!session) return;
    const row = contactToRow(contact, session.user.id);
    await supabase.from('contacts').upsert(row);
    setContacts(prev => {
      const exists = prev.find(c => c.id === contact.id);
      return exists ? prev.map(c => c.id === contact.id ? contact : c) : [...prev, contact];
    });
  };

  const handleDeleteContact = async (id: string) => {
    if (!session) return;
    setContacts(prev => prev.filter(c => c.id !== id));
    await supabase.from('contacts').delete().eq('id', id).eq('user_id', session.user.id);
  };

  if (appLoading) {
    return (
      <div className="app-loading">
        <span className="app-loading-icon">♻</span>
      </div>
    );
  }

  if (!session) return <AuthPage />;

  const lang = userSettings.language ?? 'cs';

  const NAV_ITEMS: { id: ActiveSection; label: string; icon: string }[] = [
    { id: 'contacts', label: 'Kontakty', icon: '👥' },
    { id: 'materials', label: 'Materiály', icon: '♻️' },
    { id: 'settings', label: 'Nastavení', icon: '⚙️' },
  ];

  return (
    <LanguageContext.Provider value={lang}>
    <div className="app">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        userEmail={session.user.email}
        onLogout={handleLogout}
      />

      <div className="app-main">
        {activeSection === 'contacts' && (
          <ContactsSection
            contacts={contacts}
            onSaveContact={handleSaveContact}
            onDeleteContact={handleDeleteContact}
            allMaterials={allMaterials}
            onAddMaterial={handleAddMaterial}
            smsTemplate={userSettings.smsTemplate}
          />
        )}
        {activeSection === 'materials' && (
          <MaterialsSection
            contacts={contacts}
            allMaterials={allMaterials}
            onAddMaterial={handleAddMaterial}
            onUpdateMaterial={handleUpdateMaterial}
            onDeleteMaterial={handleDeleteMaterial}
          />
        )}
        {activeSection === 'settings' && (
          <SettingsSection
            settings={userSettings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </div>

      <nav className="mobile-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`mobile-nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => handleSectionChange(item.id)}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}
        <button className="mobile-nav-item mobile-nav-logout" onClick={handleLogout}>
          <span className="mobile-nav-icon">⏻</span>
          <span className="mobile-nav-label">Odhlásit</span>
        </button>
      </nav>
    </div>
    </LanguageContext.Provider>
  );
}
