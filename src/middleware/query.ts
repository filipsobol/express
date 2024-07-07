import merge from 'utils-merge';
import parseUrl from 'parseurl';
import qs from 'qs';

/**
 * @api public
 */

export default function query(options: Record<string, any>): any {
  var opts: any = merge({}, options)
  var queryparse: Function = qs.parse;

  if (typeof options === 'function') {
    queryparse = options;
    opts = undefined;
  }

  if (opts !== undefined && opts.allowPrototypes === undefined) {
    // back-compat for qs module
    opts.allowPrototypes = true;
  }

  return function query(req: any, res: any, next: any){
    if (!req.query) {
      var val = parseUrl(req)!.query;
      req.query = queryparse(val, opts);
    }

    next();
  };
};
