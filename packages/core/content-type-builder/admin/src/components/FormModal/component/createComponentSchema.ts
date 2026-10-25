import { translatedErrors as errorsTrads } from '@strapi/admin/strapi-admin';
import snakeCase from 'lodash/snakeCase';
import * as yup from 'yup';

import { getTrad } from '../../../utils/getTrad';
import { createComponentUid } from '../utils/createUid';

// Starts with a letter, then letters, numbers, dashes and underscores — the rule the
// error message states. Splitting on the underscore alone left no room for a dash.
const CATEGORY_NAME_REGEX = /^[A-Za-z][A-Za-z0-9_-]*$/;

const isValidCategoryName = (value: string) => CATEGORY_NAME_REGEX.test(value);

export const createComponentSchema = (
  usedComponentNames: Array<string>,
  reservedNames: Array<string>,
  category: string,
  takenCollectionNames: Array<string>,
  currentCollectionName: string
) => {
  const shape = {
    displayName: yup
      .string()
      .test({
        name: 'nameAlreadyUsed',
        message: errorsTrads.unique.id,
        test(value) {
          if (!value) {
            return false;
          }

          const name = createComponentUid(value, category);

          const snakeCaseKey = snakeCase(name);
          const snakeCaseCollectionName = snakeCase(currentCollectionName);

          return (
            usedComponentNames.every((reserved) => {
              return snakeCase(reserved) !== snakeCaseKey;
            }) &&
            takenCollectionNames.every(
              (collectionName) => snakeCase(collectionName) !== snakeCaseCollectionName
            )
          );
        },
      })
      .test({
        name: 'nameNotAllowed',
        message: getTrad('error.contentTypeName.reserved-name'),
        test(value) {
          if (!value) {
            return false;
          }

          const snakeCaseKey = snakeCase(value);
          return reservedNames.every((reserved) => {
            return snakeCase(reserved) !== snakeCaseKey;
          });
        },
      })
      .required(errorsTrads.required.id),
    category: yup
      .string()
      .test({
        name: 'categoryNameFormat',
        message: getTrad('error.category.format'),
        test(value) {
          if (!value) {
            return true;
          }

          return isValidCategoryName(value);
        },
      })
      .required(errorsTrads.required.id),

    icon: yup.string(),
  };

  return yup.object(shape);
};
