import { Strapi } from '@strapi/strapi';
import { Request } from 'koa';
import createError from 'http-errors';

export type RebuildPayload = {
  contentTypes: string[];
};

export default ({ strapi }: { strapi: Strapi }) => ({
  rebuild(ctx) {
    strapi.log.debug('Rebuild endpoint called', strapi.config.get('plugin.search-index'));
    // console.debug('Search Index config', strapi.config.get('plugin.search-index'));
    // Check that the plugin is enabled
    const enabled =
      (strapi.config.get('plugin.search-index') as any)?.enableRebuildEndpoint || false;
    if (!enabled) {
      throw createError.Forbidden('Rebuild endpoint is disabled');
    }

    // Sanitize the payload
    const req = ctx.request as Request;
    const rawPayload = req.body;
    if (!rawPayload) {
      throw createError.BadRequest('Missing payload');
    }
    const valid =
      typeof rawPayload === 'object' &&
      rawPayload['contentTypes'] &&
      (Array.isArray(rawPayload['contentTypes']) || rawPayload['contentTypes'] === '*');
    if (!valid) {
      throw createError.BadRequest('Invalid payload');
    }
    const payload = rawPayload as RebuildPayload;

    // Call the rebuild function - this is async but we won't await it
    try {
      strapi.log.debug('Calling in to rebuild service');
      // console.debug('Plugin:', strapi.plugin('search-index'));
      // console.debug('Services:', strapi.plugin('search-index').services);
      // console.debug('Provider:', strapi.plugin('search-index').service('provider'));
      strapi.plugin('search-index').service('provider').rebuild(payload.contentTypes, {});
    } catch (error) {
      throw createError.InternalServerError('Something went wrong');
    }

    ctx.status = 202;
    ctx.body = { result: 'ok' };
  },
});
