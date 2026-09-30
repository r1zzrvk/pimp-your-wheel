export const ICON_NAMES = [
  "dharmachakra",
  "ranking-star",
  "up",
  "shop",
  "currency",
  "flame",
  "volume",
  "volume-mute",
  "check",
  "cross",
] as const;

export type IconName = (typeof ICON_NAMES)[number];
export type IconWeight = "regular" | "solid";

const WEIGHT_CLASS: Record<IconWeight, string> = {
  regular: "fi-rr",
  solid: "fi-sr",
};

export type IconProps = {
  name: IconName;
  weight?: IconWeight;
  size?: number;
  className?: string;
};

export function Icon({ name, weight = "regular", size = 20, className }: IconProps) {
  return (
    <i
      aria-hidden
      className={`${WEIGHT_CLASS[weight]}-${name} inline-block shrink-0 leading-none ${className ?? ""}`}
      style={{ width: size, height: size, fontSize: size }}
    />
  );
}
