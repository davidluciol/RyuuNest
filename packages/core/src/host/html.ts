/**
 * `host.html()`: envuelve el HTML en un documento con selectores CSS (P-5:
 * `htmlparser2` + `css-select`), sin DOM ni dependencias de plataforma.
 */
import { selectAll } from "css-select";
import { hasChildren, isText, type AnyNode, type Document, type Element } from "domhandler";
import { parseDocument } from "htmlparser2";

import type { HtmlDocument, HtmlElement } from "../contract/types.js";

/** Texto de un nodo y todos sus descendientes. */
function readText(node: AnyNode): string {
  if (isText(node)) {
    return node.data;
  }
  if (!hasChildren(node)) {
    return "";
  }
  return node.children.map((child) => readText(child)).join("");
}

class ElementView implements HtmlElement {
  constructor(private readonly node: Element) {}

  attr(name: string): string | undefined {
    return this.node.attribs[name];
  }

  text(): string {
    return readText(this.node);
  }

  select(selector: string): HtmlElement[] {
    return selectAll<AnyNode, Element>(selector, this.node).map(
      (element) => new ElementView(element),
    );
  }
}

class DocumentView implements HtmlDocument {
  constructor(private readonly root: Document) {}

  select(selector: string): HtmlElement[] {
    return selectAll<AnyNode, Element>(selector, this.root).map(
      (element) => new ElementView(element),
    );
  }

  find(selector: string): HtmlElement[] {
    return this.select(selector);
  }
}

/** Analiza `text` y lo devuelve como documento con selectores CSS. */
export function parseHtml(text: string): HtmlDocument {
  return new DocumentView(parseDocument(text));
}
