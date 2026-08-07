import React from 'react';

export const CORE_AVATARS = [
  { id: "r291e545fd67", name: "Gabby (Sparring Partner)" },
  { id: "r4ba1277e4fb", name: "Darius (Executive Mentor)" }
] as const;

interface AvatarSelectorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export function AvatarSelector({ id, label, value, onChange, disabled }: AvatarSelectorProps) {
  return (
    <div className="input-group">
      <label htmlFor={id}>{label}</label>
      <select 
        id={id} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {CORE_AVATARS.map((avatar) => (
          <option key={avatar.id} value={avatar.id}>
            {avatar.name}
          </option>
        ))}
      </select>
    </div>
  );
}
