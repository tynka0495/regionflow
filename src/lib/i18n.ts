export type Lang = 'cs' | 'en';

const translations = {
  // Navigation
  nav_contacts:  { cs: 'Kontakty',  en: 'Contacts'  },
  nav_materials: { cs: 'Materiály', en: 'Materials'  },
  nav_settings:  { cs: 'Nastavení', en: 'Settings'   },

  // Contacts section
  contacts_title:    { cs: 'Kontakty',          en: 'Contacts'        },
  contacts_add:      { cs: '+ Přidat kontakt',  en: '+ Add contact'   },
  contacts_sms_btn:  { cs: '✉ SMS',             en: '✉ SMS'           },

  // Materials section
  materials_title:   { cs: 'Materiály',          en: 'Materials'       },
  materials_add:     { cs: '+ Přidat materiál',  en: '+ Add material'  },
  materials_subtitle_types: { cs: 'typů materiálů', en: 'material types' },

  // Settings section
  settings_title:    { cs: 'Nastavení',                  en: 'Settings'              },
  settings_subtitle: { cs: 'Přizpůsobte si aplikaci',    en: 'Customize your app'    },

  settings_sms_title:   { cs: 'Výchozí SMS zpráva',     en: 'Default SMS message'    },
  settings_sms_hint:    { cs: 'Použijte {datum} pro automatické doplnění data', en: 'Use {datum} to insert the date automatically' },
  settings_sms_preview: { cs: 'Náhled',                 en: 'Preview'                },
  settings_sms_save:    { cs: 'Uložit zprávu',          en: 'Save message'           },
  settings_sms_saved:   { cs: '✓ Uloženo',              en: '✓ Saved'                },
  settings_sms_saving:  { cs: 'Ukládám...',             en: 'Saving...'              },
  settings_sms_reset:   { cs: 'Obnovit výchozí',        en: 'Restore default'        },

  settings_appearance_title: { cs: 'Vzhled',                      en: 'Appearance'              },
  settings_appearance_hint:  { cs: 'Tmavý režim a barva motivu',  en: 'Dark mode and accent color' },
  settings_dark_label:       { cs: 'Tmavý režim',                 en: 'Dark mode'               },
  settings_dark_hint:        { cs: 'Přepne aplikaci do tmavého vzhledu', en: 'Switch the app to dark theme' },
  settings_color_label:      { cs: 'Barva motivu',                en: 'Theme color'             },
  settings_color_hint:       { cs: 'Hlavní barva tlačítek a zvýraznění', en: 'Main color for buttons and highlights' },

  settings_lang_title: { cs: 'Jazyk aplikace',       en: 'App language'          },
  settings_lang_hint:  { cs: 'Nastavte preferovaný jazyk', en: 'Set your preferred language' },

  settings_pw_title:    { cs: 'Změna hesla',                  en: 'Change password'            },
  settings_pw_hint:     { cs: 'Aktualizujte přihlašovací heslo', en: 'Update your login password' },
  settings_pw_old:      { cs: 'Staré heslo',                  en: 'Old password'               },
  settings_pw_new:      { cs: 'Nové heslo',                   en: 'New password'               },
  settings_pw_confirm:  { cs: 'Potvrzení nového hesla',       en: 'Confirm new password'       },
  settings_pw_change:   { cs: 'Změnit heslo',                 en: 'Change password'            },
  settings_pw_changing: { cs: 'Měním...',                     en: 'Changing...'                },
  settings_pw_success:  { cs: 'Heslo bylo úspěšně změněno.',  en: 'Password changed successfully.' },
  settings_pw_err_match: { cs: 'Nová hesla se neshodují.',    en: 'New passwords do not match.' },
  settings_pw_err_short: { cs: 'Heslo musí mít alespoň 6 znaků.', en: 'Password must be at least 6 characters.' },
  settings_pw_err_wrong: { cs: 'Staré heslo je nesprávné.',   en: 'Old password is incorrect.'  },
  settings_pw_err_user:  { cs: 'Chyba: uživatel nenalezen.',  en: 'Error: user not found.'      },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Lang): string {
  return translations[key][lang];
}
