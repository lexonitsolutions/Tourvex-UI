"use client"

import { Collapsible as CollapsiblePrimitive } from "radix-ui"

function Collapsible({
  ...props
}) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
  ...props
}) {
  return (<CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props} />);
}

function CollapsibleContent({
  children,
  className,
  ...props
}) {
  return (
    <CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" className={className ? `adm-collapse ${className}` : "adm-collapse"} {...props}>
      <div>{children}</div>
    </CollapsiblePrimitive.CollapsibleContent>
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
