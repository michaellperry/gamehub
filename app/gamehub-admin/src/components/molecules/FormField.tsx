import React from 'react';

export interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  placeholder?: string;
  type?: string;
  className?: string;
}

function FormField({ 
  id, 
  label, 
  value, 
  onChange, 
  name = id, 
  placeholder = "", 
  type = "text",
  className = ""
}: FormFieldProps) {
  return (
    <div className={`mt-4 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1">
        <input
          type={type}
          name={name}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
        />
      </div>
    </div>
  );
}

export default FormField;
