type ChatGPTIconProps = {
  className?: string;
};

export function ChatGPTIcon({ className = "size-6" }: ChatGPTIconProps) {
  return (
    <img
      className={`${className} shrink-0 rounded-[22%] object-contain`}
      src="/assets/brand/chatgpt-app.png"
      alt=""
      aria-hidden="true"
    />
  );
}
