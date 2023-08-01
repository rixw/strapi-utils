/**
 * Wraps function with search plugin error message for strapi logger.
 *
 * @param {Function} fn - Function
 * @returns {Function} Function wrapped with Search plugin error message
 */
// prettier-ignore
export const wrapMethodWithError = (fn: Function) => (...args: any[]) => {
  try {
    return fn(...args);
  } catch (error) {
    strapi.log.error(`Search plugin: ${(error as Error).message}`);
  }
};
