let previousFoundCount = 0;
let notificationsEnabled = false;

async function updateStatus() {
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    
    document.getElementById('lastCheck').textContent = 
      data.lastCheck ? new Date(data.lastCheck).toLocaleString('pt-BR') : 'Aguardando...';
    
    document.getElementById('totalChecks').textContent = data.totalChecks;
    document.getElementById('foundCount').textContent = data.foundToday.length;
    document.getElementById('interval').textContent = `${data.checkInterval}s`;
    
    if (data.foundToday.length > previousFoundCount && notificationsEnabled) {
      const newListings = data.foundToday.length - previousFoundCount;
      showNotification('Novos anúncios encontrados!', 
        `${newListings} novo(s) anúncio(s) de Xbox 360 no OLX`);
    }
    
    previousFoundCount = data.foundToday.length;
    
    updateListings(data.foundToday);
    
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
  }
}

function updateListings(listings) {
  const container = document.getElementById('listingsContainer');
  
  if (listings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>🔎 Procurando por novos anúncios...</p>
        <p class="empty-state-hint">Os anúncios aparecerão aqui quando forem encontrados</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = listings.map(listing => `
    <div class="listing-card">
      <div class="listing-title">${listing.title}</div>
      <div class="listing-price">${listing.price}</div>
      <div class="listing-meta">
        <span>Encontrado: ${new Date(listing.foundAt).toLocaleString('pt-BR')}</span>
        <a href="${listing.link}" target="_blank" class="listing-link">Ver Anúncio</a>
      </div>
    </div>
  `).join('');
}

function showNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: '🎮',
      badge: '🔥'
    });
  }
}

function showNotificationPrompt() {
  if (Notification.permission === 'default') {
    document.getElementById('notificationPermission').classList.add('show');
  }
}

document.getElementById('checkNowBtn').addEventListener('click', async () => {
  const btn = document.getElementById('checkNowBtn');
  btn.disabled = true;
  btn.innerHTML = '<span>⏳ Verificando...</span>';
  
  try {
    const response = await fetch('/api/check-now', { method: 'POST' });
    const result = await response.json();
    
    await updateStatus();
    
    btn.innerHTML = '<span>✓ Verificado!</span>';
    setTimeout(() => {
      btn.innerHTML = '<span>🔍 Verificar Agora</span>';
      btn.disabled = false;
    }, 2000);
  } catch (error) {
    console.error('Erro ao verificar:', error);
    btn.innerHTML = '<span>❌ Erro</span>';
    setTimeout(() => {
      btn.innerHTML = '<span>🔍 Verificar Agora</span>';
      btn.disabled = false;
    }, 2000);
  }
});

document.getElementById('enableNotifications').addEventListener('click', async () => {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    notificationsEnabled = true;
    document.getElementById('notificationPermission').classList.remove('show');
    showNotification('Notificações ativadas!', 'Você será notificado sobre novos anúncios');
  }
});

document.getElementById('dismissNotifications').addEventListener('click', () => {
  document.getElementById('notificationPermission').classList.remove('show');
});

updateStatus();
setInterval(updateStatus, 5000);

setTimeout(showNotificationPrompt, 3000);
