import { z } from 'zod';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_SHOPPER_NAME_LENGTH,
  MAX_STORE_ITEM_NAME_LENGTH,
  MAX_STORE_NAME_LENGTH,
} from './constants';

function validateFileType(file: File) {
  return ACCEPTED_IMAGE_TYPES.includes(file.type);
}

export const createProfileSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters.')
    .max(
      MAX_SHOPPER_NAME_LENGTH,
      `Name must be less than ${MAX_SHOPPER_NAME_LENGTH} characters.`
    ),
  image: z
    .any()
    .optional()
    .refine((file) => {
      if (file) {
        return validateFileType(file);
      } else {
        return true;
      }
    }, 'Only file types of .jpg, .jpeg, .png and .svg formats are supported.'),
  address: z.string().min(3, 'Address must be at least 3 characters.'),
});

export const createStoreSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters.')
    .max(
      MAX_STORE_NAME_LENGTH,
      `Name must be less than ${MAX_STORE_NAME_LENGTH} characters.`
    ),
  image: z
    .any()
    .optional()
    .refine((file) => {
      if (file) {
        return validateFileType(file);
      } else {
        return true;
      }
    }, 'Only file types of .jpg, .jpeg, .png and .svg formats are supported.'),
  about: z.string().min(3, 'About must be at least 3 characters.'),
});

export const createItemSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters.')
    .max(
      MAX_STORE_ITEM_NAME_LENGTH,
      `Name must be less than ${MAX_STORE_ITEM_NAME_LENGTH} characters.`
    ),
  image: z
    .any()
    .optional()
    .refine((file) => {
      if (file) {
        return validateFileType(file);
      } else {
        return true;
      }
    }, 'Only file types of .jpg, .jpeg, .png and .svg formats are supported.'),
  description: z.string().min(3, 'Description must be at least 3 characters.'),
  inventoryCount: z
    .number()
    .int()
    .min(0, 'Inventory count must be at least 0.'),
  price: z
    .number()
    .min(1, 'Price must be at least 1.00.')
    .multipleOf(0.01, 'Price must have at most 2 decimal places.'),
});

export type CreateProfileFormData = z.infer<typeof createProfileSchema>;
export type CreateStoreFormData = z.infer<typeof createStoreSchema>;
export type CreateItemFormData = z.infer<typeof createItemSchema>;
