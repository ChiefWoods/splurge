import { InfoTooltip } from "./InfoTooltip";
import { FormLabel } from "./ui/form";

export function ImageInputLabel() {
  return (
    <FormLabel className="flex items-center gap-1">
      <span>Image</span>
      <InfoTooltip text="When uploading images, you'll be prompted to sign once to pay an upload fee, and again as a generic message signing." />
    </FormLabel>
  );
}
