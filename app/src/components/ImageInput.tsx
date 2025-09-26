'use client';

import { ACCEPTED_IMAGE_TYPES } from '@/lib/constants';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Image from 'next/image';
import { ImageIcon, Trash2 } from 'lucide-react';
import {
  ChangeEvent,
  DragEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ControllerRenderProps } from 'react-hook-form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const reader = useMemo(() => new FileReader(), []);

  const setImage = useCallback(
    (file: File) => {
      field.onChange(file);
      reader.readAsDataURL(file);
    },
    [field, reader]
  );

  function removeImage(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setImagePreview('');
  }

  const handleChange = useCallback(
    (file: File | undefined) => {
      if (!file) {
        toast.error('No file uploaded.');
      } else if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setImage(file);
      } else {
        toast.error('Please upload a .jpg, .jpeg, .png or .svg file.');
      }
    },
    [setImage]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      handleChange(e.dataTransfer.files[0]);
    },
    [handleChange]
  );

  const handleLoad = useCallback(() => {
    setImagePreview(reader.result as string);
  }, [setImagePreview, reader]);

  const handleError = useCallback(() => {
    toast.error('Unable to upload image.');
  }, []);

  useEffect(() => {
    reader.addEventListener('load', handleLoad);
    reader.addEventListener('error', handleError);

    return () => {
      reader.removeEventListener('load', handleLoad);
      reader.removeEventListener('error', handleError);
    };
  }, [reader, setImagePreview, handleLoad, handleError]);

  return (
    <div className="relative flex justify-between gap-x-4">
      <Button
        type="button"
        className={cn(
          'relative flex size-32 flex-col items-center justify-center gap-1 rounded-lg border bg-background p-0 transition-colors hover:bg-background',
          isDragOver
            ? 'border-primary bg-primary/20'
            : 'border-border bg-background hover:bg-background'
        )}
        onClick={() => imageFileInput.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Input
          type="file"
          className="pointer-events-none absolute size-full cursor-pointer select-none opacity-0"
          tabIndex={-1}
          ref={(e) => {
            field.ref(e);
            imageFileInput.current = e;
          }}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            handleChange(e.target.files?.[0]);
          }}
          onBlur={field.onBlur}
        />
        {imagePreview ? (
          <>
            <Image
              src={imagePreview}
              alt="Preview"
              className="pointer-events-none rounded-lg object-cover"
              fill
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute bottom-1 right-1 size-8 rounded-full border-[1px] border-background bg-foreground p-1 hover:bg-primary"
              onClick={removeImage}
            >
              <Trash2 className="text-background" />
            </Button>
          </>
        ) : (
          <>
            <ImageIcon className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Browse or Drop
            </span>
          </>
        )}
      </Button>
    </div>
  );
}
