import logoAsset from "@/assets/beu-logo.asset.json";

export function Logo({ className = "h-7 w-7 rounded-md" }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Beu Verify logo"
      width={64}
      height={64}
      className={`${className} object-cover ring-1 ring-primary/40`}
    />
  );
}
