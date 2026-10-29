import { BlockList, isIP } from 'node:net';
import type { Request } from 'express';
import { ApplicationError } from '../platform/application-error';
function canonicalIp(value: string): string {
  const ip = value.startsWith('::ffff:') && isIP(value.slice(7)) === 4 ? value.slice(7) : value;
  if (!isIP(ip)) throw new ApplicationError(400, 'INVALID_SOURCE', 'Nguồn yêu cầu không hợp lệ.');
  return isIP(ip) === 6 ? new URL(`http://[${ip}]`).hostname.slice(1, -1) : ip;
}
/** Only the immediate configured proxy may supply one overwritten source address. */
export function trustedSource(request: Request, trustedCidrs: readonly string[]): string {
  const peer = canonicalIp(request.socket.remoteAddress ?? '');
  const trusted = new BlockList();
  for (const cidr of trustedCidrs) {
    const [address, prefix] = cidr.split('/');
    const family = isIP(address);
    if (!family || !/^\d+$/.test(prefix ?? '') || Number(prefix) > (family === 4 ? 32 : 128))
      throw new ApplicationError(503, 'AUTH_CONFIGURATION', 'Cấu hình xác thực chưa sẵn sàng.');
    trusted.addSubnet(address, Number(prefix), family === 4 ? 'ipv4' : 'ipv6');
  }
  if (!trusted.check(peer, isIP(peer) === 4 ? 'ipv4' : 'ipv6')) return peer;
  const forwarded = request.get('X-Forwarded-For');
  if (!forwarded || forwarded.includes(','))
    throw new ApplicationError(400, 'INVALID_SOURCE', 'Nguồn yêu cầu không hợp lệ.');
  return canonicalIp(forwarded);
}
