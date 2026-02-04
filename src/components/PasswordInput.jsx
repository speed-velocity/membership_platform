import React, { useState } from 'react';

export default function PasswordInput({ value, onChange, placeholder, required, minLength, disabled, ...props }) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-input-wrap">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        disabled={disabled}
        {...props}
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? '🙈' : '👁'}
      </button>
    </div>
  );
}
