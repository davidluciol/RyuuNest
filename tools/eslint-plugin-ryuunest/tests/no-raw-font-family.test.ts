import { RuleTester } from "eslint";

import plugin from "../index.js";

/**
 * F34.1 — regla `ryuunest/no-raw-font-family`: «Inter» y «Manrope» no son
 * nombres de fuente registrados (en web caen a serif y en el dispositivo a la
 * fuente del sistema). Un estilo de texto sale de `textStyle(token)`, que
 * resuelve el archivo empaquetado; asignar `token.fontFamily` en bruto como
 * `fontFamily` de un estilo está prohibido.
 *
 * Leer `token.fontFamily` para mostrarlo o compararlo no se marca: solo la
 * propiedad de estilo `fontFamily: <algo>.fontFamily`.
 */

const rule = plugin.rules["no-raw-font-family"];

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

ruleTester.run("no-raw-font-family", rule, {
  valid: [
    // El uso correcto: el estilo resuelto por textStyle.
    { code: `const s = { ...textStyle(typography.bodyMd), flex: 1 };` },
    // Nombre de archivo resuelto (PostScript), no la familia del token.
    { code: `const s = { fontFamily: font.postScriptName };` },
    // Mostrar o comparar la familia no es estilizar con ella.
    { code: `const label = style.fontFamily + " " + style.fontSize;` },
    { code: `const same = file.family === token.fontFamily;` },
    { code: `const text = \`\${style.fontFamily} \${style.fontSize}\`;` },
    // Otras propiedades con el mismo origen no son de fuente.
    { code: `const s = { family: typography.bodyMd.fontFamily };` },
  ],
  invalid: [
    {
      code: `const s = { fontFamily: typography.labelSm.fontFamily };`,
      errors: [{ messageId: "rawFontFamily" }],
    },
    {
      // Un estilo ya resuelto a medias también es un token en bruto.
      code: `const s = { fontFamily: titleStyle.fontFamily, fontSize: titleStyle.fontSize };`,
      errors: [{ messageId: "rawFontFamily" }],
    },
    {
      code: `const s = { "fontFamily": typography["bodyMd"].fontFamily };`,
      errors: [{ messageId: "rawFontFamily" }],
    },
    {
      code: `const s = { fontFamily: typography.bodyMd["fontFamily"] };`,
      errors: [{ messageId: "rawFontFamily" }],
    },
  ],
});
