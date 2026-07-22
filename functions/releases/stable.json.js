import { createReleaseHandler } from '../../lib/release-proxy.js';

export const onRequest = createReleaseHandler('stable');
