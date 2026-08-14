type CodexIconProps = {
  className?: string;
};

export function CodexIcon({ className = "size-6" }: CodexIconProps) {
  return (
    <span className={`${className} relative shrink-0`} aria-hidden="true">
      <img
        className="codex-app-icon-light size-full object-contain"
        src="/assets/brand/codex-app-light.png"
        alt=""
      />
      <img
        className="codex-app-icon-dark size-full object-contain"
        src="/assets/brand/codex-app-dark.png"
        alt=""
      />
    </span>
  );
}
