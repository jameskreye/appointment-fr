import React from "react";
import { Controller } from "react-hook-form";
import type { Control, FieldValues, Path, RegisterOptions } from "react-hook-form";


interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  control?: Control<T>;
  register?: any;
  rules?: RegisterOptions;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const FormField = <T extends FieldValues>({
  name,
  label,
  placeholder,
  type = "text",
  required = false,
  control,
  register,
  rules,
  error,
  onChange,
  onBlur,
}: FormFieldProps<T>) => {
  // If using Controller
  if (control) {
    return (
      <div>
        <label className="block mb-1 font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <Controller
          name={name}
          control={control}
          rules={rules}
          render={({ field, fieldState }) => (
            <>
              <input
                {...field}
                type={type}
                placeholder={placeholder}
                onChange={(e) => {
                  field.onChange(e);
                  onChange?.(e);
                }}
                onBlur={(e) => {
                  field.onBlur();
                  onBlur?.(e);
                }}
                className={`w-full p-3 border rounded-md ${
                  error || fieldState.error ? "border-red-500" : "border-gray-300"
                }`}
              />
              {(error || fieldState.error) && (
                <p className="text-red-500 text-sm mt-1">
                  {error || fieldState.error?.message}
                </p>
              )}
            </>
          )}
        />
      </div>
    );
  }

  // If using register
  return (
    <div>
      <label className="block mb-1 font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        {...register(name, rules)}
        type={type}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full p-3 border rounded-md ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};