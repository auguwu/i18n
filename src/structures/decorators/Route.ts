/**
 * Copyright (c) 2020-2021 Arisu
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

//import type { RouteMeta } from '../Endpoint';
import { MetadataKeys } from '../internal/MetadataKeys';

interface RouteDefinition {
  run(): void | Promise<void>;
  meta: any;
}

/**
 * Returns all the routes in a specific [target].
 * @param target The target class to find routes in
 * @returns The routes or an empty array if none were found
 */
export const getRoutesIn = (target: any): RouteDefinition[] =>
  Reflect.getMetadata(MetadataKeys.Route, target) ?? [];

export default function Route(info: any): MethodDecorator {
  return (target: any, property, descriptor: TypedPropertyDescriptor<any>) => {
    if (target.prototype !== undefined)
      throw new SyntaxError(`@Route(...) cannot work in static methods. (method "${String(property)}" in ${target.name})`);

    const routes: RouteDefinition[] = Reflect.getMetadata(MetadataKeys.Route, target) ?? [];
    routes.push({
      meta: info,
      run: descriptor.value!
    });

    Reflect.defineMetadata(MetadataKeys.Route, routes, target);
  };
}
