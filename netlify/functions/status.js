import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const url = "https://www.olx.com.br/estado-rn?q=xbox%20360&sf=1";

let monitoringData = {
  lastCheck: null,
  foundToday: [],
  totalChecks: 0,
  checkInterval: 30
};

async function verificarOLX() {
  try {
    console.log(`[${new Date().toLocaleString('pt-BR')}] Verificando OLX...`);
    monitoringData.totalChecks++;
    monitoringData.lastCheck = new Date().toISOString();

    const response = await fetch(url, {
      headers: {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "user-agent": "Mozilla/5.0"
      },
      method: "GET"
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const listings = [];
    $('[data-ds-component="DS-AdCard"]').each((i, elem) => {
      const title = $(elem).find('h2').text().trim();
      const price = $(elem).find('[data-ds-component="DS-Text"]').first().text().trim();
      const link = $(elem).find('a').attr('href');
      const timeInfo = $(elem).text();

      if (timeInfo.includes('Hoje')) {
        const fullLink = link?.startsWith('http')
          ? link
          : `https://www.olx.com.br${link}`;

        listings.push({
          title: title || 'Sem título',
          price: price || 'Preço não informado',
          link: fullLink,
          foundAt: new Date().toISOString()
        });
      }
    });

    if (listings.length > 0) {
      listings.forEach(listing => {
        const exists = monitoringData.foundToday.some(
          item => item.title === listing.title && item.price === listing.price
        );
        if (!exists) monitoringData.foundToday.unshift(listing);
      });

      monitoringData.foundToday = monitoringData.foundToday.slice(0, 50);
    }

    return monitoringData;

  } catch (err) {
    console.error("Erro ao buscar OLX:", err.message);
    return { ...monitoringData, error: err.message };
  }
}

export async function handler() {
  const data = await verificarOLX();
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
}
