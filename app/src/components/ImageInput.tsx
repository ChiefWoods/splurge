import { ACCEPTED_IMAGE_TYPES } from '@/lib/constants';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Image from 'next/image';
import { ImageIcon, Trash2 } from 'lucide-react';
import { ChangeEvent } from 'react';

export function ImageInput({
  form,
  field,
  inputName,
  imagePreview,
  setImagePreview,
}: {
  form: any;
  field: any;
  inputName: string;
  imagePreview: string;
  setImagePreview: (image: string) => void;
}) {
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue(inputName, file);
    }
  };

  const handleImageDelete = () => {
    setImagePreview('');
    form.setValue(inputName, undefined);
  };

  return (
    <div className="relative flex justify-between gap-x-4">
      <Button
        type="button"
        className="relative flex h-32 w-32 items-center justify-center rounded-lg border bg-background p-0 hover:bg-background"
      >
        <Input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="absolute h-full w-full cursor-pointer opacity-0"
          {...field}
          onChange={handleImageChange}
        />
        {imagePreview ? (
          <Image
            src={imagePreview}
            alt="Preview"
            className="pointer-events-none h-full w-full rounded-lg object-cover"
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
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
