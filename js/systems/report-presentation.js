export function deterministicReportVariant(seed,scope,count){
  const maximum=Math.max(1,Math.floor(Number(count)||1));let hash=(Number(seed)>>>0)^2166136261;
  for(const character of String(scope)){hash^=character.codePointAt(0);hash=Math.imul(hash,16777619);}
  return(hash>>>0)%maximum;
}

export function formatReportNumber(value,locale){return new Intl.NumberFormat(locale).format(Number(value)||0);}

export function formatReportDate(value,locale){
  const date=new Date(value);if(Number.isNaN(date.getTime()))return"—";
  return new Intl.DateTimeFormat(locale,{dateStyle:"medium",timeStyle:"short"}).format(date);
}

export function reportPluralKey(base,count,locale){return`${base}.${new Intl.PluralRules(locale).select(Number(count)||0)==="one"?"one":"other"}`;}
