import React from 'react';

export const CORE_AVATARS = [
  { id: "r291e545fd67", name: "Gabby - Home" },
  { id: "r4ba1277e4fb", name: "Darius - Outdoor" },
  { id: "r9d30b0e55ac", name: "Luna" },
  { id: "rf4703150052", name: "Charlie" },
  { id: "rc2146c13e81", name: "Olivia" },
  { id: "r4317e64d25a", name: "Gloria" },
  { id: "r6ae5b6efc9d", name: "Anna" },
  { id: "r9c55f9312fb", name: "Steph - Office V1" },
  { id: "r1a4e22fa0d9", name: "Benjamin" },
  { id: "r68fe8906e53", name: "Mary - Office" },
  { id: "r67d1c9cac37", name: "Jackie - Office V2" },
  { id: "ra066ab28864", name: "Raj" }
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
