import { z } from 'zod';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_SHOPPER_NAME_LENGTH,
  MAX_STORE_ITEM_NAME_LENGTH,
  MAX_STORE_NAME_LENGTH,
} from './constants';
import { capitalizeFirstLetter } from './utils';

const zCommonString = (field: string) => {
  return z
    .string()
    .min(3, `${capitalizeFirstLetter(field)} must be at least 3 characters.`);
};

const zName = (maxLength: number) => {
  return zCommonString('name').max(
    maxLength,
    `Name must be less than ${maxLength} characters.`
  );
};

const zImage = z
  .any()
  .optional()
  .refine((file) => {
    return file ? ACCEPTED_IMAGE_TYPES.includes(file.type) : true;
  }, 'Only file types of .jpg, .jpeg, .png and .svg formats are supported.');

const zInventoryCount = z
  .number()
  .int()
  .min(0, 'Inventory count must be at least 0.');

const zPrice = z
  .number()
  .min(1, 'Price must be at least 1.00.')
  .refine(
    (num) => Number(num.toFixed(2)) === num,
    'Price must have at most 2 decimal places'
  );

export const createProfileSchema = z.object({
  name: zName(MAX_SHOPPER_NAME_LENGTH),
  image: zImage,
  address: zCommonString('address'),
});

export const createStoreSchema = z.object({
  name: zName(MAX_STORE_NAME_LENGTH),
  image: zImage,
  about: zCommonString('about'),
});

export const createItemSchema = z.object({
  name: zName(MAX_STORE_ITEM_NAME_LENGTH),
  image: zImage,
  description: zCommonString('description'),
  inventoryCount: zInventoryCount,
  price: zPrice,
});

export const updateItemSchema = z.object({
  inventoryCount: zInventoryCount,
  price: zPrice,
});

export type CreateProfileFormData = z.infer<typeof createProfileSchema>;
export type CreateStoreFormData = z.infer<typeof createStoreSchema>;
export type CreateItemFormData = z.infer<typeof createItemSchema>;
export type UpdateItemFormData = z.infer<typeof updateItemSchema>;
