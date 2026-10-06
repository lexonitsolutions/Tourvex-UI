"use client";

import { memo } from "react";
import FieldRenderer from "./FieldRenderer";

/** Renders `fields` (a Field[] from the API schema) for `value`. `base` is the dot path of `value` inside the section data. */
function SchemaForm({ fields, value, base = "" }) {
  return (
    <div className="adm-cms-fields">
      {(fields || []).map((f) => (
        <FieldRenderer key={f.name} field={f} value={value?.[f.name]} path={base ? `${base}.${f.name}` : f.name} />
      ))}
    </div>
  );
}

export default memo(SchemaForm);
