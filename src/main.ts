import "./style.css";

const app = document.querySelector<HTMLElement>("#app");

if (app === null) {
  throw new Error("Application root #app was not found");
}
