export const sheet = (...styles: string[]) => {
  const cs = new CSSStyleSheet();
  cs.replaceSync(styles.join(""));
  return cs;
};

export const sheets = (styleSheets?: (string | CSSStyleSheet)[]) =>
  styleSheets?.map((style) => {
    if (typeof style === "string") return sheet(style);
    return style;
  });

export const tagged = (
  strings: TemplateStringsArray,
  ...values: (string | number)[]
) => strings.flatMap((s, i) => [s, values[i] || ""]).join("");

export const css = tagged;
