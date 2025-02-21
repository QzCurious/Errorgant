export const __ERRORGANT__ = '__ERRORGANT__' as const;
declare const IMPOSSIBLE: unique symbol;
type IMPOSSIBLE = typeof IMPOSSIBLE;

/**
 * Creates a typed Errorgant object, optionally with a context
 */
export type CreateErrorgant<
  K extends string,
  Ctx = IMPOSSIBLE,
> = Ctx extends IMPOSSIBLE
  ? { [__ERRORGANT__]: K }
  : { [__ERRORGANT__]: K; ctx: Ctx };

/** A general purpose Errorgant when key is not viable or applicable */
export type DefaultErrorgant = CreateErrorgant<typeof __ERRORGANT__>;

/**
 * Union type representing all possible Errorgant variants, useful for constraining types
 * @example
 * type MyFunc = (x: number) => Errorgant;
 * const myFunc: MyFunc = (x) => errorgant('E1', x);
 * function myFunc<T extends Errorgant>(x: T) {
 *   // ...
 * }
 */
export type Errorgant =
  | DefaultErrorgant
  | CreateErrorgant<string>
  | CreateErrorgant<string, unknown>;

/**
 * Creates an Errorgant object
 */
export function errorgant(): DefaultErrorgant;
/**
 * Creates an Errorgant object with a custom key and optional context
 * @param key - A key to discriminate the error
 * @param ctx - Optionally attach a context relates to the error
 */
export function errorgant<const K extends string, const Ctx = IMPOSSIBLE>(
  key: K,
  ctx?: Ctx,
): CreateErrorgant<K, Ctx>;
export function errorgant(key?: any, ctx?: any): any {
  if (!key) {
    return { [__ERRORGANT__]: __ERRORGANT__ } as any;
  }
  if (!ctx) {
    return { [__ERRORGANT__]: key } as any;
  }
  return { [__ERRORGANT__]: key, ctx } as any;
}

/**
 * Type guard to check if a value is an Errorgant object
 * @param maybeErrorgant - The value to check
 * @param filter - Optionally filter by a key, like other programming languages can narrow a catch statement by type
 */
export function isErrorgant<
  T,
  const F extends T extends CreateErrorgant<infer X> ? X : never,
>(
  maybeErrorgant: T,
  filter?: F,
): maybeErrorgant is [Extract<T, CreateErrorgant<F>>] extends [never]
  ? /* TODO: I want it be Errorgant only but would get "T could be instantiated with an arbitrary type" error */
    T & Errorgant
  : Extract<T, CreateErrorgant<F>> {
  const isErrorgant =
    typeof maybeErrorgant === 'object' &&
    maybeErrorgant !== null &&
    __ERRORGANT__ in maybeErrorgant;

  if (!isErrorgant) {
    return false;
  }

  if (filter !== undefined) {
    return maybeErrorgant[__ERRORGANT__] === filter;
  }

  return true;
}

/**
 * Run a throwable function, catch any errors and return as an Errorgant
 * @param mightThrow - The function that might throw
 * @param catcher - Optionally map catch errors to one or more specific Errorgant
 */
export function errorgantly<T, E extends Errorgant = never>(
  mightThrow: () => T,
  catcher?: (e: unknown) => E,
): [E] extends [never]
  ? T extends Promise<any>
    ? T | Promise<CreateErrorgant<typeof __ERRORGANT__, unknown>>
    : T | CreateErrorgant<typeof __ERRORGANT__, unknown>
  : T | E {
  try {
    const mightBePromise = mightThrow();
    if (mightBePromise instanceof Promise) {
      return mightBePromise.catch((e) =>
        catcher ? catcher(e) : (errorgant(__ERRORGANT__, e) as any),
      ) as any;
    }
    return mightBePromise as any;
  } catch (e) {
    return catcher ? catcher(e) : (errorgant(__ERRORGANT__, e) as any);
  }
}

/**
 * Converts a function preventing it from throwing, returning Errorgant instead
 * @experimental Don't know if it can preserve the original function's type will, especially with generic functions
 * @param fn - The function to wrap
 * @param catcher - Optionally map catch errors to one or more specific Errorgant
 */
export function errorgantify<
  T extends (...args: any[]) => any,
  E extends Errorgant = never,
>(
  fn: T,
  catcher?: (e: unknown) => E,
): [E] extends [never]
  ? ReturnType<T> extends Promise<any>
    ?
        | T
        | ((
            ...args: Parameters<T>
          ) => Promise<CreateErrorgant<typeof __ERRORGANT__, unknown>>)
    :
        | T
        | ((
            ...args: Parameters<T>
          ) => CreateErrorgant<typeof __ERRORGANT__, unknown>)
  : T | ((...args: Parameters<T>) => E) {
  return ((...args) => errorgantly(() => fn(...args), catcher)) as T;
}

// TODO: write a conventional function that make it easy to throw an errorgant when a line of code is not expected to run
