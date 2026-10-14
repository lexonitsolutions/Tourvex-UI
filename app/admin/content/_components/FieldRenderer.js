"use client";

import Image from "next/image";
import { memo, useId } from "react";
import { Field, Switch, SelectField } from "../../_kit";
import { Input } from "../../_ui/components/input";
import { Textarea } from "../../_ui/components/textarea";
import { customFieldType, useFormContext } from "./formContext";
import { CONTROL, Counter, TEXTAREA } from "./parts";
import SchemaForm from "./SchemaForm";
import ListField from "./ListField";
import LinkField from "./LinkField";
import ImageField from "./ImagePicker";
import VideoField from "./VideoPicker";
import RichTextField from "./RichTextField";
import HolidayPackagePicker from "./HolidayPackagePicker";
import CruiseCardPicker from "./CruiseCardPicker";
import EventCardPicker from "./EventCardPicker";
import YachtCardPicker from "./YachtCardPicker";

const WIDE = new Set(["text", "textarea", "richtext", "image", "video", "link", "list", "group"]);
const HEX = /^#[0-9a-f]{6}$/i;
const PAYMENT_LOGOS = {
  visa: "visa.svg", mastercard: "mastercard.svg", amex: "americanexpress.svg", discover: "discover.svg",
  jcb: "jcb.svg", unionpay: "unionpay.svg", dinersclub: "dinersclub.svg", maestro: "maestro.svg",
  gpay: "googlepay.svg", applepay: "applepay.svg", samsungpay: "samsungpay.svg", paypal: "paypal.svg",
  alipay: "alipay.svg", wechatpay: "wechatpay.svg", rupay: "rupay.svg", upi: "upi.svg", mada: "mada.svg",
  klarna: "klarna.svg", afterpay: "afterpay.svg", banktransfer: "banktransfer.svg",
};

function PaymentProviderControl({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const option = (field.options || []).find((item) => item.value === value);
  const select = (next) => {
    onChange(path, next);
    const labelPath = path.replace(/\.type$/, ".label");
    const nextOption = (field.options || []).find((item) => item.value === next);
    if (labelPath !== path && nextOption) onChange(labelPath, nextOption.label);
  };
  return (
    <div className="adm-payment-provider">
      <SelectField label={field.label} hint={field.help} error={errors[path]} value={value} options={field.options || []} disabled={readOnly} onChange={select} />
      {value && (
        <div className="adm-payment-preview" aria-label={`${option?.label || value} logo preview`}>
          {PAYMENT_LOGOS[value] ? <Image src={`/payment-icons/${PAYMENT_LOGOS[value]}`} alt="" width={76} height={38} /> : <span className={`adm-payment-fallback is-${value}`}><i className={value === "cash" ? "fa-solid fa-money-bill-wave" : "fa-solid fa-building-columns"} aria-hidden="true" />{option?.label || value}</span>}
          <span>Logo added automatically</span>
        </div>
      )}
    </div>
  );
}

function TextControl({ field, value, path, multiline }) {
  const { errors, readOnly, onChange } = useFormContext();
  const text = typeof value === "string" ? value : "";
  return (
    <Field label={field.label} hint={field.help} error={errors[path]} required={field.required}>
      {(a11y) => (
        <>
          {multiline ? (
            <Textarea className={TEXTAREA} rows={field.rows || 4} value={text} placeholder={field.placeholder} disabled={readOnly} onChange={(e) => onChange(path, e.target.value)} {...a11y} />
          ) : (
            <Input className={CONTROL} type="text" value={text} placeholder={field.placeholder} disabled={readOnly} onChange={(e) => onChange(path, e.target.value)} {...a11y} />
          )}
          <Counter length={text.length} max={field.maxLength} />
        </>
      )}
    </Field>
  );
}

function NumberControl({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  return (
    <Field label={field.label} hint={field.help} error={errors[path]} required={field.required}>
      {(a11y) => (
        <Input
          className={CONTROL}
          type="number"
          inputMode="decimal"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value ?? ""}
          disabled={readOnly}
          onChange={(e) => onChange(path, e.target.value === "" ? null : Number(e.target.value))}
          {...a11y}
        />
      )}
    </Field>
  );
}

function ColorControl({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const hex = typeof value === "string" ? value : "";
  return (
    <Field label={field.label} hint={field.help} error={errors[path]}>
      {(a11y) => (
        <div className="adm-cms-color">
          <input
            type="color"
            className="adm-cms-color__swatch"
            aria-label={`${field.label} colour picker`}
            value={HEX.test(hex) ? hex : "#000000"}
            disabled={readOnly}
            onChange={(e) => onChange(path, e.target.value)}
          />
          <Input className={`${CONTROL} tw:font-mono`} type="text" value={hex} maxLength={7} spellCheck={false} placeholder="#0f2454" disabled={readOnly} onChange={(e) => onChange(path, e.target.value.trim())} {...a11y} />
        </div>
      )}
    </Field>
  );
}

function GroupControl({ field, value, path }) {
  const id = useId();
  return (
    <fieldset className="adm-cms-group" aria-labelledby={`${id}-l`}>
      <legend id={`${id}-l`} className="adm-cms-group__legend">{field.label}</legend>
      <SchemaForm fields={field.fields} value={value} base={path} />
    </fieldset>
  );
}

function FieldRenderer({ field, value, path }) {
  const { errors, readOnly, onChange } = useFormContext();
  const custom = customFieldType(field.type);
  let body;
  switch (field.type) {
    case "text":
      body = <TextControl field={field} value={value} path={path} />;
      break;
    case "textarea":
      body = <TextControl field={field} value={value} path={path} multiline />;
      break;
    case "richtext":
      body = <RichTextField field={field} value={value} path={path} />;
      break;
    case "image":
      body = <ImageField field={field} value={value} path={path} />;
      break;
    case "video":
      body = <VideoField field={field} value={value} path={path} />;
      break;
    case "link":
      body = <LinkField field={field} value={value} path={path} />;
      break;
    case "toggle":
      body = (
        <div>
          <Switch label={field.label} description={field.help} checked={!!value} disabled={readOnly} onChange={(v) => onChange(path, v)} />
          {errors[path] ? <p className="adm-field__error" role="alert">{errors[path]}</p> : null}
        </div>
      );
      break;
    case "number":
      body = <NumberControl field={field} value={value} path={path} />;
      break;
    case "select":
      body = field.name === "type" && path.includes("paymentMethods")
        ? <PaymentProviderControl field={field} value={value} path={path} />
        : <SelectField label={field.label} hint={field.help} error={errors[path]} value={value} options={field.options || []} disabled={readOnly} onChange={(v) => onChange(path, v)} />;
      break;
    case "color":
      body = <ColorControl field={field} value={value} path={path} />;
      break;
    case "list":
      if (field.name === "packages") {
        body = <HolidayPackagePicker field={field} value={value} path={path} />;
      } else if (field.name === "cruises") {
        body = <CruiseCardPicker field={field} value={value} path={path} />;
      } else if (field.name === "events") {
        body = <EventCardPicker field={field} value={value} path={path} />;
      } else if (field.name === "yachts") {
        body = <YachtCardPicker field={field} value={value} path={path} />;
      } else {
        body = <ListField field={field} value={value} path={path} />;
      }
      break;
    case "group":
      body = <GroupControl field={field} value={value} path={path} />;
      break;
    default: {
      const Custom = custom?.Component;
      body = Custom ? <Custom field={field} value={value} path={path} /> : <p className="adm-muted">Unsupported field type &quot;{field.type}&quot; ({field.label}).</p>;
    }
  }
  return <div className={WIDE.has(field.type) || custom?.wide ? "adm-cms-field is-wide" : "adm-cms-field"}>{body}</div>;
}

export default memo(FieldRenderer);
