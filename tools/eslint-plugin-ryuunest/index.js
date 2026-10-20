/**
 * @ryuunest/eslint-plugin — reglas de diseño de RyuuNest (SPEC §11.11, AC-13).
 *
 * `no-design-literals`: la interfaz no escribe colores ni medidas literales.
 * Todo color, tamaño, radio y espacio sale de `@ryuunest/ui-tokens`
 * (`DESIGN_RULES.md` V2 y V12). El lint se aplica solo al código de `src` en
 * `apps/` (la configuración decide las rutas); los paquetes de tokens y los
 * tests quedan fuera, porque ahí los valores literales son la fuente de verdad.
 */

/** Colores literales: hexadecimal, `rgb()`/`rgba()` y `hsl()`/`hsla()`. */
const COLOR_LITERAL = /^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/;

/** Propiedades cuyo valor es siempre un color (incluye nombres como «red»). */
const COLOR_KEYS = new Set([
  "color",
  "backgroundColor",
  "borderColor",
  "borderTopColor",
  "borderBottomColor",
  "borderLeftColor",
  "borderRightColor",
  "borderStartColor",
  "borderEndColor",
  "shadowColor",
  "textDecorationColor",
  "textShadowColor",
  "tintColor",
  "outlineColor",
]);

/** Medidas de diseño (SPEC §11.11: tamaño, radio o espacio). */
const MEASURE_KEYS = new Set([
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "borderRadius",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
  "borderStartStartRadius",
  "borderStartEndRadius",
  "borderEndStartRadius",
  "borderEndEndRadius",
  "padding",
  "paddingHorizontal",
  "paddingVertical",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingStart",
  "paddingEnd",
  "margin",
  "marginHorizontal",
  "marginVertical",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "marginStart",
  "marginEnd",
  "gap",
  "rowGap",
  "columnGap",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "top",
  "right",
  "bottom",
  "left",
  "start",
  "end",
]);

/**
 * Valores numéricos estructurales, no de diseño: `0` (sin desplazamiento) y
 * `1` (borde fino o índice). No hay token para ellos.
 */
const ALLOWED_NUMBERS = new Set([0, 1]);

/** Nombre de la clave de una propiedad, si es simple (no computada). */
function keyName(node) {
  if (node.computed) return null;
  if (node.key.type === "Identifier") return node.key.name;
  if (node.key.type === "Literal" && typeof node.key.value === "string") return node.key.value;
  return null;
}

/** Regla `no-design-literals`. */
const noDesignLiterals = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Prohíbe colores y medidas literales en la interfaz: todo sale de @ryuunest/ui-tokens (SPEC §11.11).",
    },
    schema: [],
    messages: {
      color:
        "Color literal «{{value}}»: usa un token de @ryuunest/ui-tokens (SPEC §11.11, DESIGN_RULES V2).",
      measure:
        "Medida literal en «{{key}}: {{value}}»: usa un token de @ryuunest/ui-tokens (SPEC §11.11).",
    },
  },
  create(context) {
    return {
      Property(node) {
        const name = keyName(node);
        if (name === null) return;
        const value = node.value;

        if (value.type === "Literal" && typeof value.value === "string") {
          const text = value.value.trim();
          if (COLOR_LITERAL.test(text) || COLOR_KEYS.has(name)) {
            context.report({ node: value, messageId: "color", data: { value: value.value } });
            return;
          }
        }

        if (
          MEASURE_KEYS.has(name) &&
          value.type === "Literal" &&
          typeof value.value === "number" &&
          !ALLOWED_NUMBERS.has(value.value)
        ) {
          context.report({
            node: value,
            messageId: "measure",
            data: { key: name, value: String(value.value) },
          });
        }
      },
    };
  },
};

export default {
  rules: {
    "no-design-literals": noDesignLiterals,
  },
};
