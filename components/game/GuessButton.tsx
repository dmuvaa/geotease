import { Button } from "@/components/ui/Button";

export function GuessButton({
  disabled,
  pending,
  onClick,
}: {
  disabled: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="pin" disabled={disabled || pending} onClick={onClick} className="w-full">
      {pending ? "Checking the map…" : "Submit guess"}
    </Button>
  );
}
