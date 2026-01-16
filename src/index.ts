import { define as defineRadio } from "./components/radio";
import { define as defineTabs, RampikeTabs } from "./components/tabs";
import { define as defineModal } from "./components/modal";
import { define as definePages } from "./components/pagination";

defineTabs();
defineRadio();
defineModal("ram-modal");
definePages();
window.addEventListener("DOMContentLoaded", main);

async function main() {

}
