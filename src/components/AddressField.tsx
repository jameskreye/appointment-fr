import React from "react";
import  { Controller } from "react-hook-form";

import type { Control, FieldValues, Path } from "react-hook-form";

interface AddressFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  control: Control<T>;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suggestions: any[];
  onSuggestionSelect: (suggestion: any) => void;
}

export const AddressField = <T extends FieldValues>({
  name,
  label,
  placeholder,
  required = false,
  control,
  error,
  onChange,
  suggestions,
  onSuggestionSelect,
}: AddressFieldProps<T>) => {
  return (
    <div className="mb-4">
      <label className="block mb-1 font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="relative">
            <input
              {...field}
              type="text"
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              onChange={(e) => {
                field.onChange(e);
                onChange(e);
              }}
              className={`w-full p-3 border rounded-md ${
                error ? "border-red-500" : "border-gray-300"
              }`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

            {suggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 w-full shadow-md max-h-60 overflow-auto">
                {suggestions.map((s) => (
                  <li
                    key={s.placePrediction.placeId}
                    onClick={() => onSuggestionSelect(s)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {s.placePrediction.text.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      />
    </div>
  );
};