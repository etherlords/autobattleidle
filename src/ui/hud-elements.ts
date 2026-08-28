export const button = (className: string, label: string): HTMLButtonElement => {
  const element = document.createElement("button");
  element.className = className;
  element.type = "button";
  element.textContent = label;
  return element;
};

export const makeText = (tagName: "h1" | "p" | "li", value: string): HTMLElement => {
  const element = document.createElement(tagName);
  element.textContent = value;
  return element;
};

export const progress = (className: string): HTMLDivElement => {
  const element = document.createElement("div");
  element.className = className;
  element.setAttribute("role", "progressbar");
  return element;
};

export const setProgress = (
  element: HTMLDivElement,
  label: string,
  max: number,
  value: number,
): void => {
  element.setAttribute("aria-label", label);
  element.setAttribute("aria-valuemin", "0");
  element.setAttribute("aria-valuemax", String(max));
  element.setAttribute("aria-valuenow", String(value));
};
