import { type InputHTMLAttributes } from "react";

type NumberInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export const NumberInput = ({ label, ...props }: NumberInputProps) => {
  return (
    <label className="grid gap-2 text-sm">
      <span className="subtle">{label}</span>
      <input
        type="number"
        step="any"
        className="h-11 rounded-xl border border-white/15 bg-black/25 px-3 text-white outline-none transition placeholder:text-slate-400 focus:border-rose-300/75 focus:ring-2 focus:ring-rose-300/30"
        {...props}
      />
    </label>
  );
};
