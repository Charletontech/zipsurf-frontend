import { Api } from "./utils.js";

const grid = document.getElementById("locations-grid");

async function init() {
  try {
    const response = await Api.get("/locations");
    renderLocations(response.data);
  } catch (err) {
    grid.innerHTML = `<div class="col-span-full text-center text-red-500">Failed to load locations.</div>`;
  }
}

function renderLocations(locations) {
  if (!locations.length) {
    grid.innerHTML = `<div class="col-span-full text-center text-gray-500">No locations available yet.</div>`;
    return;
  }

  grid.innerHTML = locations
    .map((loc, index) => {
      const isActive = loc.status === "Active";
      const address = loc.address || "Address coming soon...";
      const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        address
      )}`;

      return `
        <div class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all reveal reveal-scale active" style="animation-delay: ${
          index * 100
        }ms">
            <div class="flex justify-between items-start mb-4">
              <div class="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-brand-primary">
                <span class="material-icons">business</span>
              </div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isActive
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
              }">
                ${isActive ? "Open Now" : "Closed"}
              </span>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
              ${loc.name}
            </h3>
            <div class="space-y-3 text-sm text-gray-600 dark:text-slate-400">
              <div class="flex items-start gap-3">
                <span class="material-icons text-lg text-slate-400 mt-0.5">place</span>
                <span>${address}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="material-icons text-lg text-slate-400">schedule</span>
                <span>Mon-Sun: 24 Hours</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="material-icons text-lg text-slate-400">wifi</span>
                <span>Gigabit Fiber</span>
              </div>
            </div>
            <div class="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
              <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="w-full py-2 px-4 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg hover:bg-brand-primary hover:text-white dark:hover:bg-brand-primary transition-colors font-medium flex items-center justify-center gap-2">
                Get Directions
                <span class="material-icons text-sm">arrow_forward</span>
              </a>
            </div>
          </div>
        `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", init);
