import { render } from "preact";
import * as Crate from "../../components/agent-wait-states";
import type { CrateLabels } from "../../components/agent-wait-states";
import { crateSheet } from "./styles-runtime";

export type ElementSpec = {
  tag: string;
  component: string;
  attributes: { name: string; prop: string; kind: "string" | "number" | "boolean" }[];
  properties: string[];
  events: Record<string, string>;
  defaults: Record<string, unknown>;
};

type Props = Record<string, unknown>;

/** The nearest <crate-provider> around an element, if any. */
export interface ProviderLike extends HTMLElement {
  labels?: Partial<CrateLabels>;
  locale?: string;
}

function parse(kind: ElementSpec["attributes"][number]["kind"], value: string | null): unknown {
  if (kind === "boolean") return value !== null && value !== "false";
  if (value === null) return undefined;
  if (kind === "number") return value.trim() === "" || Number.isNaN(Number(value)) ? undefined : Number(value);
  return value;
}

// Parts hosts can style with ::part(). The component's outer element is
// "container"; every button is "button"; decorative icon wrappers are "icon".
function tagParts(root: ShadowRoot) {
  [...root.children].find((node) => node.tagName !== "STYLE")?.setAttribute("part", "container");
  for (const button of root.querySelectorAll("button")) button.setAttribute("part", "button");
  for (const icon of root.querySelectorAll('[aria-hidden="true"]')) if (icon.querySelector("svg") || icon.tagName === "svg") icon.setAttribute("part", "icon");
}

export function defineCrateElement(spec: ElementSpec) {
  const Component = (Crate as unknown as Record<string, React.ComponentType<Props>>)[spec.component];
  if (!Component) throw new Error(`crate-elements: no component ${spec.component}`);

  class CrateElement extends HTMLElement {
    static observedAttributes = spec.attributes.map((attribute) => attribute.name);
    #root: ShadowRoot;
    #props: Props = {};
    #observer?: MutationObserver;
    #connected = false;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: "open" });
      this.#root.adoptedStyleSheets = [crateSheet()];
    }

    connectedCallback() {
      this.#connected = true;
      this.render();
      this.#observer = new MutationObserver(() => tagParts(this.#root));
      this.#observer.observe(this.#root, { childList: true, subtree: true });
    }

    disconnectedCallback() {
      this.#connected = false;
      this.#observer?.disconnect();
      render(null, this.#root);
    }

    attributeChangedCallback() {
      this.render();
    }

    /** Re-renders with the current attributes, properties, and provider. */
    render() {
      if (!this.#connected) return;
      const props: Props = { ...spec.defaults };
      for (const attribute of spec.attributes) {
        const value = parse(attribute.kind, this.getAttribute(attribute.name));
        if (value !== undefined) props[attribute.prop] = value;
      }
      Object.assign(props, this.#props);
      for (const [prop, type] of Object.entries(spec.events)) {
        props[prop] = () => this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true }));
      }
      const provider = this.closest("crate-provider") as ProviderLike | null;
      render(
        <Crate.CrateProvider labels={provider?.labels} locale={provider?.locale}>
          <Component {...props} />
        </Crate.CrateProvider>,
        this.#root,
      );
      tagParts(this.#root);
    }

    static {
      // Every prop is also a JS property; data props (lists, labels) are properties only.
      for (const prop of spec.properties) {
        const attribute = spec.attributes.find((item) => item.prop === prop);
        Object.defineProperty(this.prototype, prop, {
          get(this: CrateElement) {
            if (prop in this.#props) return this.#props[prop];
            return attribute ? parse(attribute.kind, this.getAttribute(attribute.name)) : undefined;
          },
          set(this: CrateElement, value: unknown) {
            if (value === undefined) delete this.#props[prop];
            else this.#props[prop] = value;
            this.render();
          },
          configurable: true,
          enumerable: true,
        });
      }
    }
  }

  if (!customElements.get(spec.tag)) customElements.define(spec.tag, CrateElement);
  return CrateElement;
}
