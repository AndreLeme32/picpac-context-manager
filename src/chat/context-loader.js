const CACHE = [];

async function load() {
  try {
    console.log('Loading contexts from API...');
    const response = await fetch('http://localhost:3000/api/v2/github/contexts');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const contexts = data.contexts || [];
    CACHE.length = 0;
    CACHE.push(...contexts);
    console.log(`Successfully loaded ${CACHE.length} contexts.`);
    return CACHE;
  } catch (error) {
    console.error('Failed to load contexts:', error.message);
    return CACHE;
  }
}

function getContexts() {
  return [...CACHE];
}

async function refresh() {
  return await load();
}

module.exports = {
  load,
  getContexts,
  refresh
};