import { cn } from "@lib/utils";

const FormField = ({ label, name, type, register, error, className }) => (
  <div className={cn("form-control w-full", className)}>
    <label className="label">
      <span className="label-text text-gray-400 font-secondary uppercase tracking-widest text-[10px]">
        {label}
      </span>
    </label>
    <input
      type={type}
      placeholder={label}
      className="input bg-[#151515] border-gray-800 text-white focus:border-primary focus:outline-none font-secondary text-sm h-12"
      {...register(name)}
    />
    {error && (
      <span className="text-primary font-mono text-[10px] uppercase mt-1">
        {error.message}
      </span>
    )}
  </div>
);

export default FormField;
