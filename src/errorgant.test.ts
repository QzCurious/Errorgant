import { expect, expectTypeOf, test } from 'vitest';
import {
  __ERRORGANT__,
  errorgant,
  errorgantify,
  errorgantly,
  isErrorgant,
  type CreateErrorgant,
  type DefaultErrorgant,
  type Errorgant,
} from './errorgant';

test('creates basic errorgant with error key', () => {
  const err = errorgant('TEST_ERROR');
  expect(err).toEqual({ [__ERRORGANT__]: 'TEST_ERROR' });
});

test('creates errorgant with context', () => {
  const context = { details: 'test context' };
  const err = errorgant('TEST_ERROR', context);
  expect(err).toEqual({ [__ERRORGANT__]: 'TEST_ERROR', ctx: context });
});

test('creates default errorgant when no key provided', () => {
  const err = errorgant();
  expect(err).toEqual({ [__ERRORGANT__]: __ERRORGANT__ });
});

test('matches expected type with error key', () => {
  const err = errorgant('TEST_ERROR');
  expectTypeOf(err).toMatchTypeOf<CreateErrorgant<'TEST_ERROR'>>();
});

test('matches expected type with context structure', () => {
  const err = errorgant('TEST_ERROR', { details: 'test' } as const);
  type ExpectedType = CreateErrorgant<'TEST_ERROR', { details: 'test' }>;
  expectTypeOf(err).toMatchTypeOf<ExpectedType>();
});

test('matches expected type with complex context', () => {
  const context = {
    code: 500,
    message: 'error',
  } as const;
  const err = errorgant('COMPLEX_ERROR', context);
  type ExpectedType = CreateErrorgant<'COMPLEX_ERROR', typeof context>;
  expectTypeOf(err).toMatchTypeOf<ExpectedType>();
});

test('identifies valid errorgant objects', () => {
  const err = errorgant('TEST_ERROR');
  expect(isErrorgant(err)).toBe(true);
});

test('rejects non-errorgant values', () => {
  expect(isErrorgant(null)).toBe(false);
  expect(isErrorgant(undefined)).toBe(false);
  expect(isErrorgant({})).toBe(false);
  expect(isErrorgant({ some: 'object' })).toBe(false);
});

test('filters errorgants by error key', () => {
  const err = errorgant('TEST_ERROR');
  expect(isErrorgant(err, 'TEST_ERROR')).toBe(true);
  expect(isErrorgant(err, 'DIFFERENT_ERROR' as any)).toBe(false);
});

test('handles errorgants with context in type guard', () => {
  const err = errorgant('TEST_ERROR', { details: 'test' });
  expect(isErrorgant(err)).toBe(true);
  expect(isErrorgant(err, 'TEST_ERROR')).toBe(true);
});

test('narrows unknown values correctly in type guard', () => {
  const value: unknown = errorgant('TEST_ERROR');
  if (isErrorgant(value)) {
    expectTypeOf(value).toMatchTypeOf<Errorgant>();
  }
});

test('narrows types without specific error key in type guard', () => {
  const errA = errorgant('A');
  const errB = errorgant('B', 'ctx');
  const success = 'success';
  const err: typeof errA | typeof errB | typeof success = 'dont care' as any;

  if (isErrorgant(err)) {
    expectTypeOf(err).toMatchTypeOf<Errorgant>();
  } else {
    expectTypeOf(err).toMatchTypeOf<'success'>();
  }
});

test('narrows types with specific error key in type guard', () => {
  const errA = errorgant('A');
  const errB = errorgant('B', 'ctx');
  const success = 'success';
  const err: typeof errA | typeof errB | typeof success = 'dont care' as any;

  if (isErrorgant(err, 'A')) {
    expectTypeOf(err).toMatchTypeOf<CreateErrorgant<'A'>>();
  } else if (isErrorgant(err, 'B')) {
    expectTypeOf(err).toMatchTypeOf<CreateErrorgant<'B', 'ctx'>>();
  } else {
    expectTypeOf(err).toMatchTypeOf<'success'>();
  }
});

test('returns success value from errorgantly when no error', () => {
  const result = errorgantly(() => 'success');
  expect(result).toBe('success');
});

test('returns default errorgant from errorgantly on error', () => {
  const error = new Error('test error');
  const result = errorgantly(() => {
    throw error;
  });
  expect(isErrorgant(result)).toBe(true);
  expect(result).toEqual(errorgant(__ERRORGANT__, error));
});

test('uses custom error catcher in errorgantly', () => {
  const customError = errorgant('CUSTOM_ERROR', 'custom context');
  const result = errorgantly(
    () => {
      throw new Error('test error');
    },
    () => customError,
  );
  expect(isErrorgant(result, 'CUSTOM_ERROR')).toBe(true);
  expect(result).toEqual(customError);
});

test('prevents non-errorgant return in errorgantly error catcher', () => {
  errorgantly(
    () => {},
    // @ts-expect-error
    () => 'not errorgant',
  );
});

test('infers return types correctly in errorgantly', () => {
  const successResult = errorgantly(() => 'success');
  // TODO: It would be good if it can be .toMatchTypeOf<'success' | DefaultErrorgant>()
  expectTypeOf(successResult).toMatchTypeOf<string | DefaultErrorgant>();

  const customResult = errorgantly(
    () => 'success',
    () => errorgant('CUSTOM_ERROR'),
  );
  expectTypeOf(customResult).toMatchTypeOf<
    string | CreateErrorgant<'CUSTOM_ERROR'>
  >();
});

test('preserves normal function behavior in errorgantify', () => {
  const fn = (x: number) => x * 2;
  const wrapped = errorgantify(fn);
  expect(wrapped(2)).toBe(4);
});

test('wraps errors in errorgant using errorgantify', () => {
  const fn = () => {
    throw new Error('test error');
  };
  const wrapped = errorgantify(fn);
  const result = wrapped();
  expect(isErrorgant(result)).toBe(true);
});

test('uses custom error catcher in errorgantify', () => {
  const fn = () => {
    throw new Error('test error');
  };
  const customError = errorgant('CUSTOM_ERROR');
  const wrapped = errorgantify(fn, () => customError);
  const result = wrapped();
  expect(isErrorgant(result, 'CUSTOM_ERROR')).toBe(true);
});

test('prevents non-errorgant return in errorgantify error catcher', () => {
  errorgantify(
    () => {},
    // @ts-expect-error
    () => 'not errorgant',
  );
});

test('preserves function arguments in errorgantify', () => {
  const fn = (a: string, b: number) => ({ a, b });
  const wrapped = errorgantify(fn);
  const result = wrapped('test', 123);
  expect(result).toEqual({ a: 'test', b: 123 });
});

test('infers wrapped function types correctly in errorgantify', () => {
  const wrapped = errorgantify(
    (a: number, b: string): boolean => a > 0 && b.length > 0,
  );
  expectTypeOf(wrapped).toMatchTypeOf<
    (a: number, b: string) => boolean | DefaultErrorgant
  >();
  expectTypeOf(wrapped(1, 't')).toMatchTypeOf<boolean | DefaultErrorgant>();
});

test('infers custom error catcher types correctly in errorgantify', () => {
  const wrapped = errorgantify(
    (x: number) => x.toString(),
    () => errorgant('CUSTOM_ERROR'),
  );
  expectTypeOf(wrapped(1)).toMatchTypeOf<
    string | CreateErrorgant<'CUSTOM_ERROR'>
  >();
});

test('errorgantly can handle async functions', async () => {
  const theError = new Error('test error');
  async function mightThrow(shouldThrow: boolean) {
    if (shouldThrow) {
      throw theError;
    }
    return 'success';
  }

  const successResult = await errorgantly(() => mightThrow(false));
  expect(isErrorgant(successResult)).toBe(false);
  expectTypeOf(successResult).toMatchTypeOf<string | DefaultErrorgant>();

  const successResultWithCatcher = await errorgantly(
    () => mightThrow(false),
    () => errorgant('CUSTOM_ERROR'),
  );
  expect(isErrorgant(successResultWithCatcher)).toBe(false);
  expectTypeOf(successResultWithCatcher).toMatchTypeOf<
    string | CreateErrorgant<'CUSTOM_ERROR'>
  >();

  const errorResult = await errorgantly(() => mightThrow(true));
  expect(isErrorgant(errorResult)).toBe(true);
  expect(errorResult).toEqual(errorgant(__ERRORGANT__, theError));
  expectTypeOf(errorResult).toMatchTypeOf<
    string | CreateErrorgant<typeof __ERRORGANT__, unknown>
  >();

  const errorResultWithCatcher = await errorgantly(
    () => mightThrow(true),
    () => errorgant('CUSTOM_ERROR'),
  );
  expect(isErrorgant(errorResultWithCatcher, 'CUSTOM_ERROR')).toBe(true);
  expectTypeOf(errorResultWithCatcher).toMatchTypeOf<
    string | CreateErrorgant<'CUSTOM_ERROR'>
  >();
});

test('errorgantify can handle async functions', async () => {
  const fn = async (shouldThrow: boolean) => {
    if (shouldThrow) {
      throw new Error('test error');
    }
    return 'success';
  };
  const wrapped = errorgantify(fn);
  const wrappedWithCatcher = errorgantify(fn, () => errorgant('CUSTOM_ERROR'));

  const result = await wrapped(true);
  expect(isErrorgant(result)).toBe(true);
  expectTypeOf(result).toMatchTypeOf<
    string | CreateErrorgant<typeof __ERRORGANT__, unknown>
  >();
  const successResult = await wrapped(false);
  expect(isErrorgant(successResult)).toBe(false);
  expectTypeOf(successResult).toMatchTypeOf<string | DefaultErrorgant>();

  const successResultWithCatcher = await wrappedWithCatcher(false);
  expect(isErrorgant(successResultWithCatcher)).toBe(false);
  expectTypeOf(successResultWithCatcher).toMatchTypeOf<
    string | CreateErrorgant<'CUSTOM_ERROR'>
  >();

  const errorResult = await wrapped(true);
  expect(isErrorgant(errorResult)).toBe(true);
  expectTypeOf(errorResult).toMatchTypeOf<
    string | CreateErrorgant<typeof __ERRORGANT__, unknown>
  >();

  const errorResultWithCatcher = await wrappedWithCatcher(true);
  expect(isErrorgant(errorResultWithCatcher, 'CUSTOM_ERROR')).toBe(true);
  expectTypeOf(errorResultWithCatcher).toMatchTypeOf<
    string | CreateErrorgant<'CUSTOM_ERROR'>
  >();
});
