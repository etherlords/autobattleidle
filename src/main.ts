import "./style.css";
import { createApplication } from "./app/application";

const app = document.querySelector<HTMLElement>("#app");

if (app === null) {
  throw new Error("Application root #app was not found");
}

createApplication(app);
