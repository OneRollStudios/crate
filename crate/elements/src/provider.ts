import type { CrateLabels } from "../../components/agent-wait-states";

/**
 * <crate-provider locale="fr">: labels and locale for every Crate element
 * inside it, like CrateProvider in React. Set labels as a property:
 * provider.labels = { thinking: "Réflexion…" }.
 */
export class CrateProviderElement extends HTMLElement {
  static observedAttributes = ["locale"];
  #labels?: Partial<CrateLabels>;

  get labels() {
    return this.#labels;
  }
  set labels(value: Partial<CrateLabels> | undefined) {
    this.#labels = value;
    this.#refresh();
  }
  get locale() {
    return this.getAttribute("locale") ?? undefined;
  }
  set locale(value: string | undefined) {
    if (value) this.setAttribute("locale", value);
    else this.removeAttribute("locale");
  }

  connectedCallback() {
    this.style.display = "contents";
  }
  attributeChangedCallback() {
    this.#refresh();
  }
  #refresh() {
    for (const element of this.querySelectorAll("*")) {
      if (element.tagName.startsWith("CRATE-") && "render" in element) (element as unknown as { render: () => void }).render();
    }
  }
}

if (!customElements.get("crate-provider")) customElements.define("crate-provider", CrateProviderElement);
