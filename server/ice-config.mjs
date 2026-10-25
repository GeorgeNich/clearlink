/** Public STUN helps discover direct routes; it never relays call media. */
export function readIceServers(raw = process.env.ICE_SERVERS_JSON) {
  if (raw === undefined) return [{ urls: 'stun:stun.cloudflare.com:3478' }];
  let servers;
  try { servers = JSON.parse(raw); }
  catch { throw new Error('ICE_SERVERS_JSON must be a JSON array of STUN/TURN server objects.'); }
  if (!Array.isArray(servers) || servers.some(server => {
    if (!server || typeof server !== 'object' || Array.isArray(server)) return true;
    const urls = typeof server.urls === 'string' ? [server.urls] : server.urls;
    return !Array.isArray(urls) || urls.length === 0 || urls.some(url => typeof url !== 'string' || !/^(stun|stuns|turn|turns):[^\s]+$/.test(url));
  })) throw new Error('ICE_SERVERS_JSON entries must have a urls string or non-empty array of stun:, stuns:, turn: or turns: URLs.');
  // An explicit [] disables external services for isolated local testing.
  return servers;
}
