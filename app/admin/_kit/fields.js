"use client";

import { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon";
import { cx } from "./primitives";
import { Input } from "../_ui/components/input";
import { Textarea } from "../_ui/components/textarea";
import { Label } from "../_ui/components/label";
import { Checkbox } from "../_ui/components/checkbox";
import { Switch as UiSwitch } from "../_ui/components/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../_ui/components/select";
import { Popover, PopoverContent, PopoverTrigger } from "../_ui/components/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "../_ui/components/command";

// Form fields on shadcn Input / Textarea / Select / Checkbox / Switch / Label / Popover + Command. Page-level props are the same as
// the old kit (value / onChange(value) / error / hint / required ...).

const CONTROL = "tw:h-10 tw:rounded-xl tw:bg-(--adm-control-bg) tw:text-[15px] tw:md:text-[15px]";

/** Wrapper: label, hint, error wired with aria-describedby / aria-invalid through the render prop. */
export function Field({ label, hint, error, required, children, className, htmlFor }) {
  const auto = useId();
  const id = htmlFor || auto;
  const describedBy = [hint ? `${id}-h` : null, error ? `${id}-e` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("adm-field", error && "has-error", className)}>
      {label ? (
        <Label htmlFor={id} className="adm-field__label tw:block tw:text-[13.5px] tw:leading-normal tw:font-semibold tw:text-(--adm-ink)">
          {label}
          {required ? <span className="adm-field__req" aria-hidden="true"> *</span> : null}
        </Label>
      ) : null}
      {typeof children === "function" ? children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined }) : children}
      {hint && !error ? <p className="adm-field__hint" id={`${id}-h`}>{hint}</p> : null}
      {error ? <p className="adm-field__error" id={`${id}-e`} role="alert">{error}</p> : null}
    </div>
  );
}

export function TextField({ label, hint, error, required, className, value, onChange, prefix, suffix, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className} htmlFor={rest.id}>
      {(a11y) => (
        <div className={cx("adm-affix", (prefix || suffix) && "has-affix")}>
          {prefix ? <span className="adm-affix__pre">{prefix}</span> : null}
          <Input className={cx(CONTROL, prefix && "tw:rounded-l-none", suffix && "tw:rounded-r-none")} type="text" value={value ?? ""} onChange={(e) => onChange?.(e.target.value, e)} {...a11y} {...rest} />
          {suffix ? <span className="adm-affix__suf">{suffix}</span> : null}
        </div>
      )}
    </Field>
  );
}

export function TextArea({ label, hint, error, required, className, value, onChange, rows = 4, maxLength, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className} htmlFor={rest.id}>
      {(a11y) => (
        <>
          <Textarea className="tw:min-h-[84px] tw:resize-y tw:rounded-xl tw:bg-(--adm-control-bg) tw:text-[15px] tw:md:text-[15px]" rows={rows} maxLength={maxLength} value={value ?? ""} onChange={(e) => onChange?.(e.target.value, e)} {...a11y} {...rest} />
          {maxLength ? <p className="adm-field__count">{(value || "").length}/{maxLength}</p> : null}
        </>
      )}
    </Field>
  );
}

// Radix Select cannot use "" as an item value, so "no selection" travels as a sentinel and is mapped back to "".
const NONE = "__none__";

export function SelectField({ label, hint, error, required, className, value, onChange, options, placeholder, disabled, ...rest }) {
  const hasNone = placeholder !== undefined;
  const current = value === undefined || value === null || value === "" ? (hasNone ? NONE : undefined) : String(value);
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className} htmlFor={rest.id}>
      {(a11y) => (
        <Select value={current} onValueChange={(v) => onChange?.(v === NONE ? "" : v)} disabled={disabled}>
          <SelectTrigger className={cx(CONTROL, "tw:w-full")} {...a11y}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {hasNone ? <SelectItem value={NONE}>{placeholder}</SelectItem> : null}
            {options.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </Field>
  );
}

/** Money amount (AED by default). Keeps the raw string while typing and reports a number (or null) on every change. */
export function MoneyField({ label, hint, error, required, className, value, onChange, currency = "AED", ...rest }) {
  const [text, setText] = useState(value == null ? "" : String(value));
  const last = useRef(value);
  useEffect(() => {
    if (value !== last.current) {
      last.current = value;
      setText(value == null ? "" : String(value));
    }
  }, [value]);
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className} htmlFor={rest.id}>
      {(a11y) => (
        <div className="adm-affix has-affix">
          <span className="adm-affix__pre">{currency}</span>
          <Input
            className={cx(CONTROL, "tw:rounded-l-none tw:text-right")}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={text}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
              setText(raw);
              const n = raw === "" || raw === "." ? null : Number(raw);
              last.current = n;
              onChange?.(n);
            }}
            onBlur={() => {
              if (text !== "" && text !== "." && !Number.isNaN(Number(text))) setText(Number(text).toFixed(2));
            }}
            {...a11y}
            {...rest}
          />
        </div>
      )}
    </Field>
  );
}

/** Native date input (the OS picker follows color-scheme, so it themes in dark). value: "YYYY-MM-DD". */
export function DateField({ label, hint, error, required, className, value, onChange, min, max, ...rest }) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className} htmlFor={rest.id}>
      {(a11y) => <Input className={CONTROL} type="date" value={value ?? ""} min={min} max={max} onChange={(e) => onChange?.(e.target.value)} {...a11y} {...rest} />}
    </Field>
  );
}

/** value = { from: "YYYY-MM-DD", to: "YYYY-MM-DD" }. Each end constrains the other. */
export function DateRangeField({ label, hint, error, className, value, onChange }) {
  const v = value || {};
  const id = useId();
  return (
    <fieldset className={cx("adm-field adm-range", error && "has-error", className)}>
      {label ? <legend className="adm-field__label">{label}</legend> : null}
      <div className="adm-range__row">
        <Input id={`${id}-f`} className={CONTROL} type="date" aria-label={`${label || "Date range"} from`} value={v.from || ""} max={v.to || undefined} onChange={(e) => onChange?.({ ...v, from: e.target.value })} />
        <span className="adm-range__sep" aria-hidden="true">to</span>
        <Input id={`${id}-t`} className={CONTROL} type="date" aria-label={`${label || "Date range"} to`} value={v.to || ""} min={v.from || undefined} onChange={(e) => onChange?.({ ...v, to: e.target.value })} />
      </div>
      {hint && !error ? <p className="adm-field__hint">{hint}</p> : null}
      {error ? <p className="adm-field__error" role="alert">{error}</p> : null}
    </fieldset>
  );
}

export function Switch({ label, description, checked, onChange, disabled, id }) {
  const auto = useId();
  const sid = id || auto;
  return (
    <div className={cx("adm-switchrow", disabled && "is-disabled")}>
      <UiSwitch
        id={sid}
        checked={!!checked}
        onCheckedChange={(v) => onChange?.(v)}
        disabled={disabled}
        aria-labelledby={`${sid}-l`}
        aria-describedby={description ? `${sid}-d` : undefined}
        className="tw:h-[22px] tw:w-[38px] tw:shrink-0"
      />
      <div className="adm-switchrow__text">
        <label id={`${sid}-l`} htmlFor={sid} className="adm-switchrow__label">{label}</label>
        {description ? <p id={`${sid}-d`} className="adm-switchrow__desc">{description}</p> : null}
      </div>
    </div>
  );
}

/** Multi select: shadcn Popover + Command list with checkboxes. options: [{ value, label, description?, disabled? }]; value: string[] */
export function MultiSelect({ label, hint, error, required, className, value = [], onChange, options, placeholder = "Select..." }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const labels = options.filter((o) => value.includes(o.value));
  function toggle(v) {
    onChange?.(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className} htmlFor={`${id}-b`}>
      {(a11y) => (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button type="button" id={`${id}-b`} aria-haspopup="listbox" className="adm-ms__btn tw:flex tw:min-h-10 tw:w-full tw:items-center tw:justify-between tw:gap-2 tw:rounded-xl tw:border tw:border-input tw:bg-(--adm-control-bg) tw:py-1.5 tw:pr-2.5 tw:pl-2 tw:text-left tw:text-[15px]" {...a11y}>
              <span className="adm-ms__chips">
                {labels.length ? labels.map((o) => <span key={o.value} className="adm-chip">{o.label}</span>) : <span className="adm-ms__ph">{placeholder}</span>}
              </span>
              <Icon name="chevronDown" size={16} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="tw:w-(--radix-popover-trigger-width) tw:p-1">
            <Command>
              <CommandList>
                <CommandGroup>
                  {options.map((o) => {
                    const on = value.includes(o.value);
                    return (
                      <CommandItem key={o.value} value={`${o.label} ${o.description || ""}`} disabled={o.disabled} onSelect={() => toggle(o.value)} className="tw:items-start tw:gap-2.5 tw:py-2">
                        <Checkbox checked={on} tabIndex={-1} aria-hidden className="tw:pointer-events-none tw:mt-0.5" />
                        <span className="tw:grid">
                          <span className="adm-ms__optlabel">{o.label}</span>
                          {o.description ? <span className="adm-ms__optdesc">{o.description}</span> : null}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </Field>
  );
}
