const API_KEY = '30441bd9a25ecc0855dec3bec3ad1b10'; // Ganti dengan API key dari openweathermap.org
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const HISTORY_KEY = 'weatherApp.history';
const MAX_HISTORY = 8;

// ---------- DOM elements ----------
const form = document.querySelector('#searchForm');
const input = document.querySelector('#cityInput');

const loadingEl = document.querySelector('#loading');
const errorEl = document.querySelector('#error');
const emptyEl = document.querySelector('#empty');
const resultEl = document.querySelector('#weatherResult');

const cityNameEl = document.querySelector('#cityName');
const updatedAtEl = document.querySelector('#updatedAt');
const iconEl = document.querySelector('#weatherIcon');
const temperatureEl = document.querySelector('#temperature');
const descriptionEl = document.querySelector('#description');
const humidityEl = document.querySelector('#humidity');
const windEl = document.querySelector('#wind');
const feelsLikeEl = document.querySelector('#feelsLike');
const unitToggleBtn = document.querySelector('#unitToggle');

const historyListEl = document.querySelector('#historyList');
const historyEmptyEl = document.querySelector('#historyEmpty');
const clearHistoryBtn = document.querySelector('#clearHistory');

// ---------- App state ----------
let lastData = null;       // data cuaca terakhir yang berhasil di-fetch (untuk toggle unit)
let unit = 'C';            // 'C' atau 'F'

// ============================================================
// UI helpers — loading & error state
// ============================================================

const showLoading = () => {
  loadingEl.classList.remove('hidden');
  errorEl.classList.add('hidden');
};

const hideLoading = () => {
  loadingEl.classList.add('hidden');
};

const showError = (message) => {
  errorEl.textContent = `⚠️ ${message}`;
  errorEl.classList.remove('hidden');
  resultEl.classList.add('hidden');
  emptyEl.classList.add('hidden');
};

const clearError = () => {
  errorEl.classList.add('hidden');
};

// ============================================================
// Fetch cuaca — async/await + Fetch API
// ============================================================

const getWeather = async (city) => {
  try {
    clearError();
    showLoading();

    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=id`;
    const res = await fetch(url);

    // Error handling: kota tidak ditemukan (404)
    if (res.status === 404) {
      throw new Error(`Kota "${city}" tidak ditemukan. Coba periksa ejaannya.`);
    }
    if (!res.ok) {
      throw new Error(`Server error (${res.status}). Coba lagi nanti.`);
    }

    const data = await res.json();

    lastData = data;
    unit = 'C';
    unitToggleBtn.textContent = '°C';

    displayWeather(data);
    saveToHistory(data.name);
  } catch (err) {
    // Error handling: network error (fetch gagal total, biasanya TypeError)
    if (err instanceof TypeError) {
      showError('Gagal terhubung ke server. Periksa koneksi internet kamu.');
    } else {
      showError(err.message);
    }
  } finally {
    hideLoading();
  }
};

// ============================================================
// Tampilkan hasil cuaca
// ============================================================

const displayWeather = (data) => {
  emptyEl.classList.add('hidden');
  resultEl.classList.remove('hidden');

  cityNameEl.textContent = `${data.name}, ${data.sys?.country ?? ''}`;
  updatedAtEl.textContent = `Diperbarui ${new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  iconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  iconEl.alt = data.weather[0].description;

  descriptionEl.textContent = data.weather[0].description;
  humidityEl.textContent = `${data.main.humidity}%`;
  windEl.textContent = `${data.wind.speed} m/s`;

  renderTemperature(data);
};

// Render suhu sesuai unit yang dipilih (°C/°F) 
const renderTemperature = (data) => {
  const isCelsius = unit === 'C';
  const toFahrenheit = (celsius) => (celsius * 9) / 5 + 32;

  const temp = isCelsius ? data.main.temp : toFahrenheit(data.main.temp);
  const feels = isCelsius ? data.main.feels_like : toFahrenheit(data.main.feels_like);

  temperatureEl.textContent = `${Math.round(temp)}°${unit}`;
  feelsLikeEl.textContent = `${Math.round(feels)}°${unit}`;
};

unitToggleBtn.addEventListener('click', () => {
  if (!lastData) return;
  unit = unit === 'C' ? 'F' : 'C';
  unitToggleBtn.textContent = `°${unit}`;
  renderTemperature(lastData);
});

// ============================================================
// Riwayat pencarian — LocalStorage + array methods 
// ============================================================

const getHistory = () => {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveToHistory = (city) => {
  const current = getHistory();

  // filter(): buang duplikat kota yang sama (case-insensitive)
  const withoutDuplicate = current.filter(
    (item) => item.toLowerCase() !== city.toLowerCase()
  );

  const updated = [city, ...withoutDuplicate].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  renderHistory();
};

const renderHistory = () => {
  const history = getHistory();

  historyEmptyEl.classList.toggle('hidden', history.length > 0);
  clearHistoryBtn.classList.toggle('hidden', history.length === 0);

  // map(): ubah tiap nama kota jadi elemen <li> yang bisa diklik
  historyListEl.innerHTML = history
    .map(
      (city) => `
        <li>
          <button
            type="button"
            data-history-chip
            data-city="${city}"
            class="border border-white/14 bg-white/5 text-white text-[13px] px-3.5 py-2 rounded-full cursor-pointer hover:bg-white/12 transition-colors"
          >
            ${city}
          </button>
        </li>
      `
    )
    .join('');
};

historyListEl.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-history-chip]');
  if (!chip) return;
  const city = chip.dataset.city;
  input.value = city;
  getWeather(city);
});

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

// ============================================================
// Event listener utama — form pencarian
// ============================================================

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = input.value.trim();
  if (!city) return;
  getWeather(city);
});

renderHistory();
