import { Strapi } from '@strapi/strapi';
import { Request } from 'koa';
import createError from 'http-errors';

export type RebuildPayload = {
  contentTypes: string[];
};

export default ({ strapi }: { strapi: Strapi }) => ({
  rebuild(ctx) {
    strapi.log.debug('Rebuild endpoint called');
    console.debug('Search Index config', strapi.plugins['search-index'].config);
    // Check that the plugin is enabled
    const enabled = strapi.plugins['search-index'].config.enableRebuildEndpoint || false;
    if (!enabled) {
      throw createError.Forbidden('Rebuild endpoint is disabled');
    }

    // Sanitize the payload
    const req = ctx.request as Request;
    const rawPayload = req.body;
    if (!rawPayload) {
      throw createError.BadRequest('Missing payload');
    }
    if (
      typeof rawPayload !== 'object' ||
      !Object.entries(rawPayload).find(([key]) => key === 'contentTypes') ||
      !Array.isArray(rawPayload['contentTypes'])
    ) {
      throw createError.BadRequest('Invalid payload');
    }
    const payload = rawPayload as RebuildPayload;

    // Call the rebuild function - this is async but we won't await it
    try {
      strapi.plugin['search-index'].services['provider'].rebuild(payload.contentTypes, {});
    } catch (error) {
      throw createError.InternalServerError('Something went wrong');
    }

    ctx.status = 202;
    ctx.body = { result: 'ok' };
  },
});
