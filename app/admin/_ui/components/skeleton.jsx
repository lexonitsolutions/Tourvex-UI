import { cn } from "@/app/admin/_ui/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("adm-skel tw:rounded-md tw:bg-(--adm-skel-a)", className)}
      {...props} />
  );
}

export { Skeleton }
