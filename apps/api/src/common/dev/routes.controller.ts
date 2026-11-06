import { Controller, Get, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { z } from 'zod';

export type RouteInfo = {
  method: string;
  path: string;
  /** Bounded context of the controller, from its Nest module (DistributionModule -> distribution). */
  context: string;
  controller: string;
  /** JSON schema of the request body, from the zod schema given to `@Body({ schema })`. */
  bodySchema: unknown;
};

const join = (...parts: string[]) =>
  `/${parts
    .flatMap((p) => p.split('/'))
    .filter(Boolean)
    .join('/')}`;

/** Every HTTP route of the API, read from Nest's own metadata, for the toolbox's API explorer. */
@Controller('dev/routes')
export class DevRoutesController {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
  ) {}

  @Get()
  list(): RouteInfo[] {
    const routes = this.discovery.getControllers().flatMap(({ instance, metatype, host }) => {
      if (!instance || !metatype || metatype === DevRoutesController) return [];
      const prototype = Object.getPrototypeOf(instance);
      const base = [Reflect.getMetadata(PATH_METADATA, metatype) ?? ''].flat()[0];
      const context = (host?.metatype?.name ?? '').replace(/Module$/, '').toLowerCase();

      return this.scanner.getAllMethodNames(prototype).flatMap((name) => {
        const handler = prototype[name];
        const path = Reflect.getMetadata(PATH_METADATA, handler);
        if (path === undefined) return [];
        const args: Record<string, { schema?: z.ZodType }> =
          Reflect.getMetadata(ROUTE_ARGS_METADATA, metatype, name) ?? {};
        const schema = Object.values(args).find((arg) => arg.schema)?.schema;
        return {
          method: RequestMethod[Reflect.getMetadata(METHOD_METADATA, handler)],
          path: join('api', base, [path].flat()[0]),
          context,
          controller: metatype.name,
          bodySchema: schema ? z.toJSONSchema(schema, { io: 'input' }) : null,
        };
      });
    });
    return routes.sort(
      (a, b) => a.context.localeCompare(b.context) || a.path.localeCompare(b.path),
    );
  }
}
