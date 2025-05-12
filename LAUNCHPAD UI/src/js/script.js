/*=========================================================================
====================== Main javascript ==================================
============================================================================*/


document.addEventListener('DOMContentLoaded', function() {

  setTimeout(function() {
    document.getElementById('loader').classList.add('fade-out');
    document.getElementById('content').style.opacity = '1';
  }, 1500);


  initializePage();
});

function initializePage() {
  // ================== Dark Mode Toggle ==================
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const moonIcon = darkModeToggle.querySelector('i');

  function applyDarkMode(state) {
    document.documentElement.classList.toggle('dark-theme', state);
    moonIcon.classList.toggle('fa-moon', !state);
    moonIcon.classList.toggle('fa-sun', state);
    darkModeToggle.style.backgroundColor = state ? '#4285f4' : '';
  }

  // Initialize dark mode state
  const savedMode = localStorage.getItem('darkMode') === 'true';
  applyDarkMode(savedMode);

  darkModeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark-theme');
    applyDarkMode(isDark);
    localStorage.setItem('darkMode', isDark);
  });

  // ================== Google Search ==================
  document.getElementById('search-button').addEventListener('click', performSearch);
  document.getElementById('google-search').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  function performSearch() {
    const query = document.getElementById('google-search').value.trim();
    if (query) window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  }

  // ================== Voice Search ==================
  const voiceBtn = document.getElementById("voice-btn");
  const searchInput = document.getElementById("google-search");

  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    voiceBtn.addEventListener("click", () => {
      recognition.start();
      voiceBtn.classList.add('voice-pulse');
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      searchInput.value = transcript;
      // Optional: Auto search
      document.getElementById("search-button").click();
      voiceBtn.classList.remove('voice-pulse');
    };

    recognition.onend = () => {
      voiceBtn.classList.remove('voice-pulse');
    };

    recognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error);
      voiceBtn.classList.remove('voice-pulse');
    };
  } else {
    voiceBtn.style.display = "none"; // Hide if unsupported
  }

  // ================== Time & Date ==================
  function updateDateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const time = `${hours}:${minutes} ${ampm}`;
    const date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
    document.getElementById('current-time').textContent = time;
    document.getElementById('current-date').textContent = date;
  }
  updateDateTime();
  setInterval(updateDateTime, 60000);

  // ================== Daily Quote ==================
  fetch('https://api.quotable.io/random')
    .then(res => res.json())
    .then(data => document.getElementById('daily-quote').textContent = data.content)
    .catch(err => {
      console.error(err);
      document.getElementById('daily-quote').textContent = "⚠️ Error loading quote";
    });

  // ================== Weather ==================
  // Function to get user's geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(fetchWeather, showError);
  } else {
    document.getElementById('weather-city').textContent = 'Location unavailable';
    document.getElementById('weather-temp').textContent = '--°C';
  }

  function fetchWeather(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    fetchWeatherData(lat, lon);
  }

  function showError(error) {
    console.error(`Geolocation error: ${error.message}`);
    document.getElementById('weather-city').textContent = 'Location error';
    document.getElementById('weather-temp').textContent = '--°C';
  }

  // Function to fetch weather data using OpenWeatherMap API
  function fetchWeatherData(lat, lon) {
    const apiKey = "58150b5e6a10b632504148292ede9f48";
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        updateWeatherUI(data);
      })
      .catch(error => {
        console.error("Error fetching weather data:", error);
        document.getElementById('weather-city').textContent = 'Weather unavailable';
        document.getElementById('weather-temp').textContent = '--°C';
      });
  }

  function updateWeatherUI(data) {
    const city = data.name;
    const temp = Math.floor(data.main.temp);
    const weather = data.weather[0].description;
    const icon = data.weather[0].icon;

    document.getElementById("weather-city").textContent = city;
    document.getElementById("weather-temp").textContent = `${temp}°C`;
    
    // Update weather icon based on condition
    const weatherIconElem = document.getElementById("weather-icon");
    let iconClass;
    
    // Map OpenWeatherMap icon codes to Font Awesome icons
    if (icon.includes('01')) {
      iconClass = 'fa-sun'; // clear sky
    } else if (icon.includes('02')) {
      iconClass = 'fa-cloud-sun'; // few clouds
    } else if (icon.includes('03') || icon.includes('04')) {
      iconClass = 'fa-cloud'; // scattered or broken clouds
    } else if (icon.includes('09')) {
      iconClass = 'fa-cloud-showers-heavy'; // shower rain
    } else if (icon.includes('10')) {
      iconClass = 'fa-cloud-rain'; // rain
    } else if (icon.includes('11')) {
      iconClass = 'fa-bolt'; // thunderstorm
    } else if (icon.includes('13')) {
      iconClass = 'fa-snowflake'; // snow
    } else if (icon.includes('50')) {
      iconClass = 'fa-smog'; // mist
    } else {
      iconClass = 'fa-cloud'; // default
    }
    
    weatherIconElem.innerHTML = `<i class="fas ${iconClass}"></i>`;
  }

  // ================== Reminders - Task Input ==================
  const mainTaskInput = document.getElementById('main-task-input');
  const taskContainer = document.querySelector('.task-container');

  // Load saved tasks
  const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
  savedTasks.forEach(task => createTask(task));

  mainTaskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && this.value.trim()) {
      const value = this.value.trim();
      createTask(value);
      savedTasks.push(value);
      localStorage.setItem('tasks', JSON.stringify(savedTasks));
      this.value = '';
    }
  });

  function createTask(text) {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-input';
    input.value = text;

    const delBtn = document.createElement('button');
    delBtn.textContent = "❌";
    delBtn.style.marginLeft = '8px';
    delBtn.style.background = 'none';
    delBtn.style.border = 'none';
    delBtn.style.cursor = 'pointer';
    delBtn.onclick = () => {
      taskContainer.removeChild(div);
      const index = savedTasks.indexOf(text);
      if (index > -1) {
        savedTasks.splice(index, 1);
        localStorage.setItem('tasks', JSON.stringify(savedTasks));
      }
    };

    div.appendChild(checkbox);
    div.appendChild(input);
    div.appendChild(delBtn);
    taskContainer.appendChild(div);
  }

  // ================== Quick Apps ==================
  document.querySelectorAll('.app-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const app = this.className.split(' ')[1];
      const links = {
        instagram: 'https://instagram.com/satyajit_mishra1',
        youtube: 'https://youtube.com',
        github: 'https://github.com/satyajitmishra-dev',
        linkedin: 'https://linkedin.com/satyajitmishra1',
        twitter: 'https://x.com/satyajit-mishr0',
        whatsapp: 'https://whatsapp.com',
        stackoverflow: 'https://stackoverflow.com/',
        codepen: 'https://codepen.com/'
      };
      if (links[app]) window.open(links[app], '_blank');
    });
  });

  // ================== Fetch Tech News ==================
  function fetchTechNews() {
    const apiKey = "2e93467a8694c2a2b82e1a6b560bd053";
    const url = `https://gnews.io/api/v4/top-headlines?topic=technology&lang=en&country=us&max=5&apikey=${apiKey}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const newsList = document.getElementById("news-list");
        newsList.innerHTML = "";

        if (data.articles && data.articles.length > 0) {
          data.articles.forEach((article) => {
            const li = document.createElement("li");
            li.style.marginBottom = "10px";
            li.innerHTML = `<a href="${article.url}" target="_blank" style="text-decoration: none; color: var(--accent-blue);">
              📰 ${article.title}
            </a>`;
            newsList.appendChild(li);
          });
        } else {
          throw new Error("No articles found");
        }
      })
      .catch((err) => {
        console.error("News fetch error:", err);
        document.getElementById("news-list").innerHTML = "<li>Failed to load news. Please try again later.</li>";
      });
  }

  fetchTechNews();

  // ================== Sortable Cards ==================
  const isDesktop = window.matchMedia("(min-width: 768px)").matches;

  if (isDesktop && typeof Sortable !== 'undefined') {
    const container = document.getElementById('card-container');
    
 
    const sortable = new Sortable(container, {
      animation: 200,
      ghostClass: 'sortable-ghost',
      onEnd: function (evt) {

        const cardOrder = Array.from(container.children).map(card => card.id);
   
        localStorage.setItem('cardOrder', JSON.stringify(cardOrder));
      }
    });


    const storedOrder = JSON.parse(localStorage.getItem('cardOrder'));
    if (storedOrder) {
      storedOrder.forEach(cardId => {
        const card = document.getElementById(cardId);
        if (card) container.appendChild(card); // Reorder the cards based on the stored order
      });
    }
  }
}