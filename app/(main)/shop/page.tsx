import { meta } from "@/components/meta";
import { ShopScreen } from "@/components/shop-screen";

export const metadata = meta({
  title: "Магазин",
  description: "Скины колеса, фоны, указатели и анимации.",
});

export default function ShopPage() {
  return <ShopScreen />;
}
