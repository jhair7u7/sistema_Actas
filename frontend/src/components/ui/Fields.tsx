import clsx from "clsx";
import { Check } from "lucide-react";
import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { forwardRef } from "react";

type FieldProps = {
  label: string;
  hint?: string;
};

export const TextField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldProps
>(({ label, hint, className, id, ...rest }, ref) => {
  const inputId = id ?? rest.name ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="flex flex-col">
      <label htmlFor={inputId} className="label-field">
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        className={clsx("input-field", className)}
        {...rest}
      />
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
});
TextField.displayName = "TextField";

export const SelectField = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & FieldProps
>(({ label, hint, className, id, children, ...rest }, ref) => {
  const inputId = id ?? rest.name ?? label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="flex flex-col">
      <label htmlFor={inputId} className="label-field">
        {label}
      </label>
      <select
        id={inputId}
        ref={ref}
        className={clsx("input-field appearance-none pr-8", className)}
        {...rest}
      >
        {children}
      </select>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
});
SelectField.displayName = "SelectField";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  indeterminate?: boolean;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, checked, ...rest }, ref) => {
    const visualChecked = !!checked || !!indeterminate;
    return (
      <label
        className={clsx(
          "relative inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded border transition-colors",
          visualChecked
            ? "border-brand-500 bg-brand-500"
            : "border-gray-300 bg-white hover:border-brand-400",
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="absolute inset-0 cursor-pointer opacity-0"
          {...rest}
        />
        {checked && (
          <Check className="h-3 w-3 stroke-[3] text-white" aria-hidden />
        )}
        {!checked && indeterminate && (
          <span className="block h-0.5 w-2 rounded-full bg-white" />
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";