/**
 * Publication status the content API serves when the request does not ask for one.
 */
const DEFAULT_STATUS = 'published';

export abstract class CoreService {
  getFetchParams(params = {}): any {
    const { status } = params as { status?: unknown };

    return {
      ...params,
      status: typeof status === 'string' ? status : DEFAULT_STATUS,
    };
  }
}
