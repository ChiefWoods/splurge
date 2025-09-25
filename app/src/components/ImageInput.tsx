'use client';

import { ACCEPTED_IMAGE_TYPES } from '@/lib/constants';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Image from 'next/image';
import { ImageIcon, Trash2 } from 'lucide-react';
import { ChangeEvent, useRef } from 'react';
import { ControllerRenderProps } from 'react-hook-form';

export function ImageInput({
  field,
  imagePreview,
  setImagePreview,
}: {
  field: ControllerRenderProps<any, string>;
  imagePreview: string;
  setImagePreview: (image: string) => void;
}) {
  const imageFileInput = useRef<HTMLInputElement>(null);

  function handleImageChange(file: File) {
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
    }
  }

  function handleImageDelete() {
    setImagePreview('');
  }

  return (
    <div className="relative flex justify-between gap-x-4">
      <Button
        type="button"
        className="relative flex size-32 items-center justify-center rounded-lg border bg-background p-0 hover:bg-background"
        onClick={() => imageFileInput.current?.click()}
      >
        <Input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="pointer-events-none absolute size-full cursor-pointer select-none opacity-0"
          tabIndex={-1}
          ref={(e) => {
            field.ref(e);
            imageFileInput.current = e;
          }}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            field.onChange(file);
            if (file) {
              handleImageChange(file);
            }
          }}
          onBlur={field.onBlur}
        />
        {imagePreview ? (
          <Image
            src={imagePreview}
            alt="Preview"
            className="pointer-events-none size-full rounded-lg object-cover"
            fill
          />
        ) : (
          <ImageIcon className="text-muted-foreground" />
        )}
      </Button>
      {imagePreview && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleImageDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}
