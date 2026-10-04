import { createGithubReleasesHandler } from '../../../lib/github-releases.js';

export const onRequest = createGithubReleasesHandler('FreeSense-org/NetSpider');
