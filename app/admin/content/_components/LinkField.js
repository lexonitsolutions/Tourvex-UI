"use client";

import { memo, useId, useState } from "react";
import { Field } from "../../_kit";
import { Input } from "../../_ui/components/input";
import { isSafeHref } from "../../_lib/cms";
import { useFormContext } from "./formContext";
import { CONTROL } from "./parts";

const HINT = "Start with / or https://";

function LinkField({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const id = useId();
  const [touched, setTouched] = useState(false);
  const v = value && typeof value === "object" ? value : { label: "", href: "" };
  const hrefLocal = touched && v.href && !isSafeHref(v.href) ? "Use a path starting with / or a full https:// address." : "";
  const set = (patch) => onChange(path, { ...v, ...patch });
  return (
    <fieldset className="adm-cms-link" aria-labelledby={`${id}-l`}>
      <legend id={`${id}-l`} className="adm-cms-link__legend">
        {field.label}
        {field.required ? <span className="adm-field__req" aria-hidden="true"> *</span> : null}
      </legend>
      <div className="adm-cms-link__row">
        <Field label="Label" error={errors[`${path}.label`] || errors[path]}>
          {(a11y) => <Input className={CONTROL} value={v.label || ""} disabled={readOnly} placeholder="Button text" onChange={(e) => set({ label: e.target.value })} {...a11y} />}
        </Field>
        <Field label="Link" hint={HINT} error={errors[`${path}.href`] || hrefLocal}>
          {(a11y) => (
            <Input
              className={`${CONTROL} tw:font-mono tw:text-[14px]`}
              value={v.href || ""}
              disabled={readOnly}
              placeholder="/holidays or https://..."
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              onBlur={() => setTouched(true)}
              onChange={(e) => set({ href: e.target.value })}
              {...a11y}
            />
          )}
        </Field>
      </div>
      {field.help ? <p className="adm-field__hint">{field.help}</p> : null}
    </fieldset>
  );
}

export default memo(LinkField);
