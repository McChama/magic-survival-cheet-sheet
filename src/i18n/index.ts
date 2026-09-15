import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en/translation.json";
import { buildEnglishGameDataResource } from "./gameData";

export const resources = {
  en: { translation: en, gameData: buildEnglishGameDataResource() },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  ns: ["translation", "gameData"],
  defaultNS: "translation",
  interpolation: { escapeValue: false },
});

export default i18n;
