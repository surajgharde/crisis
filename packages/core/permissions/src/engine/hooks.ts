import { cloneDeep } from 'lodash';
import { hooks } from '@strapi/utils';

import * as domain from '../domain';
import type { Permission } from '../domain/permission';
import type { PermissionRule } from '../types';

export interface PermissionEngineHooks {
  'before-format::validate.permission': ReturnType<typeof hooks.createAsyncBailHook>;
  'format.permission': ReturnType<typeof hooks.createAsyncSeriesWaterfallHook>;
  'after-format::validate.permission': ReturnType<typeof hooks.createAsyncBailHook>;
  'before-evaluate.permission': ReturnType<typeof hooks.createAsyncSeriesHook>;
  'before-register.permission': ReturnType<typeof hooks.createAsyncSeriesHook>;
}

export type HookName = keyof PermissionEngineHooks;

/**
 * Create a hook map used by the permission Engine
 */
const createEngineHooks = (): PermissionEngineHooks => ({
  'before-format::validate.permission': hooks.createAsyncBailHook(),
  'format.permission': hooks.createAsyncSeriesWaterfallHook(),
  'after-format::validate.permission': hooks.createAsyncBailHook(),
  'before-evaluate.permission': hooks.createAsyncSeriesHook(),
  'before-register.permission': hooks.createAsyncSeriesHook(),
});

/**
 * Create a context from a domain {@link Permission} used by the validate hooks
 */
const createValidateContext = (permission: Permission) => ({
  get permission(): Readonly<Permission> {
    return cloneDeep(permission);
  },
});

/**
 * Create a context from a domain {@link Permission} used by the before valuate hook
 */
const createBeforeEvaluateContext = (permission: Permission) => ({
  get permission(): Readonly<Permission> {
    return cloneDeep(permission);
  },

  addCondition(condition: string) {
    Object.assign(permission, domain.permission.addCondition(condition, permission));

    return this;
  },
});

interface WillRegisterContextParams {
  permission: PermissionRule;
  options: Record<string, unknown>;
}

/**
 * Create a context from a casl Permission & some options
 * @param caslPermission
 */
const createWillRegisterContext = ({ permission, options }: WillRegisterContextParams) => {
  // Hooks add their clauses on top of whatever condition the permission already carries.
  // That condition is kept whole as the first clause: its own shape — the `$or` of the
  // conditions attached to the action, for instance — has to survive untouched.
  const clauses: unknown[] = permission.condition ? [permission.condition] : [];
  let hookOrClause: { $or: unknown[] } | undefined;

  const rebuildCondition = () => {
    permission.condition = { $and: clauses };
  };

  return {
    ...options,

    get permission() {
      return cloneDeep(permission);
    },

    condition: {
      and(rawConditionObject: unknown) {
        clauses.push(rawConditionObject);

        rebuildCondition();

        return this;
      },

      or(rawConditionObject: unknown) {
        if (!hookOrClause) {
          hookOrClause = { $or: [] };
          clauses.push(hookOrClause);
        }

        hookOrClause.$or.push(rawConditionObject);

        rebuildCondition();

        return this;
      },
    },
  };
};

export {
  createEngineHooks,
  createValidateContext,
  createBeforeEvaluateContext,
  createWillRegisterContext,
};
