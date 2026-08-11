import fr from "../i18n/fr.js";
import en from "../i18n/en.js";

export const LOCALE_STORAGE_KEY="backrooms.locale.v1";
export const SUPPORTED_LOCALES=Object.freeze(["fr","en"]);
const catalogs=Object.freeze({fr,en}),listeners=new Set();

function storage(){try{return globalThis.localStorage??null;}catch{return null;}}
function normalize(locale){const value=String(locale??"").toLowerCase();return value.startsWith("fr")?"fr":value.startsWith("en")?"en":null;}
function detect(){try{const saved=normalize(storage()?.getItem(LOCALE_STORAGE_KEY));if(saved)return saved;}catch{}for(const locale of globalThis.navigator?.languages??[globalThis.navigator?.language]){const normalized=normalize(locale);if(normalized)return normalized;}return"fr";}

let currentLocale=detect();
export function getLocale(){return currentLocale;}
function placeholders(value){return[...String(value).matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map(match=>match[1]).sort();}
export function getTranslationDiagnostics(){const reference=new Set(Object.keys(catalogs.fr)),missing={},extra={},parameterMismatches=[];for(const locale of SUPPORTED_LOCALES){const keys=new Set(Object.keys(catalogs[locale]));missing[locale]=Object.freeze([...reference].filter(key=>!keys.has(key)).sort());extra[locale]=Object.freeze([...keys].filter(key=>!reference.has(key)).sort());for(const key of reference)if(keys.has(key)){const expected=placeholders(catalogs.fr[key]).join(","),actual=placeholders(catalogs[locale][key]).join(",");if(expected!==actual)parameterMismatches.push(Object.freeze({locale,key,expected,actual}));}}return Object.freeze({missing:Object.freeze(missing),extra:Object.freeze(extra),parameterMismatches:Object.freeze(parameterMismatches),valid:Object.values(missing).every(keys=>!keys.length)&&Object.values(extra).every(keys=>!keys.length)&&!parameterMismatches.length});}
export function translate(key,parameters={}){let value=catalogs[currentLocale]?.[key]??catalogs.fr[key]??key;for(const[name,replacement]of Object.entries(parameters))value=value.replaceAll(`{${name}}`,String(replacement));return value;}
export function setLocale(locale,{persist=true}={}){const normalized=normalize(locale);if(!normalized||!SUPPORTED_LOCALES.includes(normalized))throw new TypeError(`Langue non prise en charge : ${locale}`);if(persist)try{storage()?.setItem(LOCALE_STORAGE_KEY,normalized);}catch{}if(normalized===currentLocale)return currentLocale;currentLocale=normalized;globalThis.document?.documentElement&&(globalThis.document.documentElement.lang=normalized);for(const listener of listeners)listener(normalized);return currentLocale;}
export function subscribeLocale(listener){if(typeof listener!=="function")throw new TypeError("Écouteur de langue invalide.");listeners.add(listener);return()=>listeners.delete(listener);}
export function translateDocument(root=globalThis.document){
  if(!root)return;
  root.documentElement&&(root.documentElement.lang=currentLocale);
  for(const node of root.querySelectorAll?.("[data-i18n]")??[])node.textContent=translate(node.dataset.i18n);
  for(const node of root.querySelectorAll?.("[data-i18n-html]")??[])node.innerHTML=translate(node.dataset.i18nHtml);
  for(const node of root.querySelectorAll?.("[data-i18n-aria]")??[])node.setAttribute("aria-label",translate(node.dataset.i18nAria));
  for(const node of root.querySelectorAll?.("[data-i18n-title]")??[])node.setAttribute("title",translate(node.dataset.i18nTitle));
  for(const node of root.querySelectorAll?.("[data-i18n-content]")??[])node.setAttribute("content",translate(node.dataset.i18nContent));
  for(const button of root.querySelectorAll?.("[data-locale]")??[]){button.classList.toggle("active",button.dataset.locale===currentLocale);button.setAttribute?.("aria-pressed",String(button.dataset.locale===currentLocale));}
}
export function initI18n(root=globalThis.document){if(!root)return()=>{};translateDocument(root);const click=event=>{const locale=event.target.closest?.("[data-locale]")?.dataset.locale;if(locale)setLocale(locale);};root.addEventListener?.("click",click);const unsubscribe=subscribeLocale(()=>translateDocument(root));return()=>{root.removeEventListener?.("click",click);unsubscribe();};}
